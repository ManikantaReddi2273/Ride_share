package com.ridesharing.userservice.service;

import com.ridesharing.userservice.dto.ApiResponse;
import com.ridesharing.userservice.dto.AuthResponse;
import com.ridesharing.userservice.dto.ForgotPasswordRequest;
import com.ridesharing.userservice.dto.LoginRequest;
import com.ridesharing.userservice.dto.RegisterRequest;
import com.ridesharing.userservice.dto.ResetPasswordRequest;
import com.ridesharing.userservice.dto.VerifyOtpRequest;
import com.ridesharing.userservice.entity.*;
import com.ridesharing.userservice.exception.BadRequestException;
import com.ridesharing.userservice.exception.UnauthorizedException;
import com.ridesharing.userservice.repository.*;
import com.ridesharing.userservice.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

/**
 * Authentication Service
 * Handles user registration and login business logic
 */
@Service
@Transactional
public class AuthService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PendingRegistrationRepository pendingRegistrationRepository;
    
    @Autowired
    private RoleRepository roleRepository;
    
    @Autowired
    private DriverProfileRepository driverProfileRepository;
    
    @Autowired
    private PassengerProfileRepository passengerProfileRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private EmailService emailService;

    private static final SecureRandom OTP_RANDOM = new SecureRandom();
    private static final int OTP_TTL_MINUTES = 10;
    
    /**
     * Register a new user
     * This method generates OTP and saves registration data temporarily in pending_registrations table.
     * User account is only created in users table after OTP verification.
     * ADMIN role cannot be created through public registration - only through admin dashboard.
     * @param request Registration request containing user details
     * @return AuthResponse with verification required flag
     */
    public AuthResponse register(RegisterRequest request) {
        // Prevent ADMIN role creation through public registration
        // ADMIN users can only be created by existing admins through admin dashboard
        if (request.getEmail() != null && request.getEmail().toLowerCase().contains("admin")) {
            // Additional check: if someone tries to register with admin email pattern
            // This is a soft check - the actual role assignment happens in verifyOtp
        }
        
        // Check if user already exists (verified users)
        if (userRepository.existsByEmailOrPhone(request.getEmail(), request.getPhone())) {
            throw new BadRequestException("User already exists with this email or phone number");
        }
        
        // Check if pending registration exists - if so, delete old one
        if (pendingRegistrationRepository.existsByEmailOrPhone(request.getEmail(), request.getPhone())) {
            pendingRegistrationRepository.findByEmail(request.getEmail())
                .ifPresent(pendingRegistrationRepository::delete);
        }
        
        // Generate OTP
        String otp = generateOtp();
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(OTP_TTL_MINUTES);
        
        // Create pending registration (NOT in users table)
        PendingRegistration pendingRegistration = new PendingRegistration();
        pendingRegistration.setEmail(request.getEmail());
        pendingRegistration.setPhone(request.getPhone());
        pendingRegistration.setName(request.getName());
        pendingRegistration.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        pendingRegistration.setVerificationCode(otp);
        pendingRegistration.setExpiresAt(expiresAt);
        
        pendingRegistration = pendingRegistrationRepository.save(pendingRegistration);
        
        // Send OTP email
        emailService.sendOtpEmail(request.getEmail(), otp);

        AuthResponse response = new AuthResponse();
        response.setToken(null);
        response.setTokenType("Bearer");
        response.setUserId(null); // No user ID yet - user will be created after OTP verification
        response.setEmail(request.getEmail());
        response.setName(request.getName());
        response.setRole("PASSENGER");
        response.setExpiresIn(null);
        response.setVerificationRequired(Boolean.TRUE);
        response.setMessage("Verification code sent to your email. Please enter the 4 digit OTP to activate your account.");
        
        return response;
    }
    
    /**
     * Login user
     * @param request Login request containing email/phone and password
     * @return AuthResponse with JWT token and user information
     */
    public AuthResponse login(LoginRequest request) {
        // Find user by email or phone
        User user = userRepository.findByEmailOrPhone(
                request.getEmailOrPhone(), 
                request.getEmailOrPhone()
        ).orElseThrow(() -> new UnauthorizedException("Invalid email/phone or password"));
        
        // Check if user account is active
        if (user.getStatus() != User.UserStatus.ACTIVE) {
            throw new UnauthorizedException("User account is not active");
        }

        if (!Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new UnauthorizedException("Account not verified. Please enter the OTP sent to your email.");
        }
        
        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email/phone or password");
        }
        
        // Generate JWT token
        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole().getName());
        
        // Create and return authentication response
        AuthResponse response = new AuthResponse();
        response.setToken(token);
        response.setTokenType("Bearer");
        response.setUserId(user.getId());
        response.setEmail(user.getEmail());
        response.setName(user.getName());
        response.setRole(user.getRole().getName());
        response.setExpiresIn(jwtUtil.getExpirationTime());
        
        return response;
    }

    /**
     * Verify the OTP sent to user's email.
     * On successful verification, creates the user account in users table and creates passenger profile.
     *
     * @param request verify OTP request
     * @return ApiResponse indicating success/failure
     */
    public ApiResponse verifyOtp(VerifyOtpRequest request) {
        // Find pending registration
        PendingRegistration pendingRegistration = pendingRegistrationRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("No pending registration found. Please register first."));

        // Validate OTP not expired
        if (pendingRegistration.getExpiresAt().isBefore(LocalDateTime.now())) {
            // Clean up expired registration
            pendingRegistrationRepository.delete(pendingRegistration);
            throw new BadRequestException("OTP expired. Please register again to receive a new code.");
        }

        // Validate OTP matches (trim and compare as strings)
        String storedOtp = pendingRegistration.getVerificationCode() != null ? 
                pendingRegistration.getVerificationCode().trim() : null;
        String providedOtp = request.getOtp() != null ? request.getOtp().trim() : null;
        
        if (storedOtp == null || providedOtp == null || !storedOtp.equals(providedOtp)) {
            throw new BadRequestException("Invalid OTP. Please re-check the code sent to your email.");
        }

        // Check if user already exists (shouldn't happen, but safety check)
        if (userRepository.existsByEmailOrPhone(pendingRegistration.getEmail(), pendingRegistration.getPhone())) {
            // User already exists - delete pending registration
            pendingRegistrationRepository.delete(pendingRegistration);
            throw new BadRequestException("User already exists. Please login instead.");
        }

        // OTP is valid - create user account in users table
        Role role = roleRepository.findByName("PASSENGER")
                .orElseThrow(() -> new BadRequestException("Default PASSENGER role not found. Please contact administrator."));
        
        // Create verified user
        User user = new User();
        user.setEmail(pendingRegistration.getEmail());
        user.setPhone(pendingRegistration.getPhone());
        user.setName(pendingRegistration.getName());
        user.setPasswordHash(pendingRegistration.getPasswordHash());
        user.setRole(role);
        user.setStatus(User.UserStatus.ACTIVE);
        user.setEmailVerified(Boolean.TRUE);
        user = userRepository.save(user);

        // Create passenger profile
        PassengerProfile passengerProfile = new PassengerProfile();
        passengerProfile.setUser(user);
        passengerProfileRepository.save(passengerProfile);

        // Delete pending registration (cleanup)
        pendingRegistrationRepository.delete(pendingRegistration);

        return new ApiResponse(true, "Verification successful! Your account has been activated. You can now login with your credentials.");
    }

    private String generateOtp() {
        int otp = 1000 + OTP_RANDOM.nextInt(9000);
        return String.valueOf(otp);
    }

    /**
     * Initiate forgot password flow by sending OTP to user's email.
     * This reuses the verificationCode / verificationExpiresAt fields on the User entity.
     *
     * @param request forgot password request with email
     * @return ApiResponse indicating OTP sent
     */
    public ApiResponse forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("No account found with this email"));

        if (!Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new BadRequestException("Email is not verified. Please verify your account first.");
        }

        String otp = generateOtp();
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(OTP_TTL_MINUTES);

        user.setVerificationCode(otp);
        user.setVerificationExpiresAt(expiresAt);
        userRepository.save(user);

        emailService.sendPasswordResetEmail(user.getEmail(), otp);

        return new ApiResponse(true, "Reset OTP sent to your email. It expires in 10 minutes.");
    }

    /**
     * Reset password after verifying OTP.
     *
     * @param request reset password request with email, otp, newPassword
     * @return ApiResponse indicating success
     */
    public ApiResponse resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("No account found with this email"));

        // Validate OTP presence and expiry
        if (user.getVerificationCode() == null || user.getVerificationExpiresAt() == null) {
            throw new BadRequestException("No active reset request found. Please request a new OTP.");
        }

        if (user.getVerificationExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("OTP has expired. Please request a new one.");
        }

        if (!user.getVerificationCode().trim().equals(request.getOtp().trim())) {
            throw new BadRequestException("Invalid OTP. Please check the code sent to your email.");
        }

        // Prevent using the same password
        if (passwordEncoder.matches(request.getNewPassword(), user.getPasswordHash())) {
            throw new BadRequestException("New password must be different from current password.");
        }

        // Update password and clear verification fields
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setVerificationCode(null);
        user.setVerificationExpiresAt(null);
        userRepository.save(user);

        return new ApiResponse(true, "Password reset successful. You can now log in with your new password.");
    }
}

