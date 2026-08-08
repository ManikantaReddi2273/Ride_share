package com.ridesharing.userservice.service;

import com.ridesharing.userservice.dto.ApiResponse;
import com.ridesharing.userservice.dto.AuthResponse;
import com.ridesharing.userservice.dto.ForgotPasswordRequest;
import com.ridesharing.userservice.dto.LoginRequest;
import com.ridesharing.userservice.dto.RegisterRequest;
import com.ridesharing.userservice.dto.ResendOtpRequest;
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
import java.util.List;

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
     * Register a new user — stores pending row + emails OTP.
     * Re-registering with the same email/phone refreshes OTP (no duplicate-key 500).
     */
    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.getEmail());
        String phone = normalizePhone(request.getPhone());

        if (userRepository.existsByEmailOrPhone(email, phone)) {
            throw new BadRequestException(
                    "An account already exists with this email or phone. Please login or use Forgot Password.");
        }

        // Remove any prior pending rows for this email OR phone (avoids unique constraint 500)
        deletePendingConflicts(email, phone);

        String otp = generateOtp();
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(OTP_TTL_MINUTES);

        PendingRegistration pendingRegistration = new PendingRegistration();
        pendingRegistration.setEmail(email);
        pendingRegistration.setPhone(phone);
        pendingRegistration.setName(request.getName().trim());
        pendingRegistration.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        pendingRegistration.setVerificationCode(otp);
        pendingRegistration.setExpiresAt(expiresAt);
        pendingRegistrationRepository.saveAndFlush(pendingRegistration);

        emailService.sendOtpEmail(email, otp);

        AuthResponse response = new AuthResponse();
        response.setToken(null);
        response.setTokenType("Bearer");
        response.setUserId(null);
        response.setEmail(email);
        response.setName(request.getName().trim());
        response.setRole("PASSENGER");
        response.setExpiresIn(null);
        response.setVerificationRequired(Boolean.TRUE);
        response.setMessage(
                "Verification code sent to your email. Enter the 4-digit OTP to activate your account. "
                        + "You can resend the code if it does not arrive.");
        return response;
    }

    /**
     * Resend registration OTP for an existing pending signup.
     */
    public AuthResponse resendOtp(ResendOtpRequest request) {
        String email = normalizeEmail(request.getEmail());

        PendingRegistration pending = pendingRegistrationRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException(
                        "No pending registration found for this email. Please register first."));

        if (userRepository.existsByEmail(email)) {
            pendingRegistrationRepository.delete(pending);
            throw new BadRequestException("Account already verified. Please login.");
        }

        String otp = generateOtp();
        pending.setVerificationCode(otp);
        pending.setExpiresAt(LocalDateTime.now().plusMinutes(OTP_TTL_MINUTES));
        pendingRegistrationRepository.saveAndFlush(pending);

        emailService.sendOtpEmail(email, otp);

        AuthResponse response = new AuthResponse();
        response.setToken(null);
        response.setUserId(null);
        response.setEmail(email);
        response.setName(pending.getName());
        response.setRole("PASSENGER");
        response.setVerificationRequired(Boolean.TRUE);
        response.setMessage("A new verification code has been sent to your email.");
        return response;
    }
    
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmailOrPhone(
                request.getEmailOrPhone(), 
                request.getEmailOrPhone()
        ).orElseThrow(() -> new UnauthorizedException("Invalid email/phone or password"));
        
        if (user.getStatus() != User.UserStatus.ACTIVE) {
            throw new UnauthorizedException("User account is not active");
        }

        if (!Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new UnauthorizedException(
                    "Account not verified. Please complete OTP verification from the register page, or resend OTP.");
        }
        
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email/phone or password");
        }
        
        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole().getName());
        
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

    public ApiResponse verifyOtp(VerifyOtpRequest request) {
        String email = normalizeEmail(request.getEmail());

        PendingRegistration pendingRegistration = pendingRegistrationRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException(
                        "No pending registration found. Please register first or resend OTP."));

        if (pendingRegistration.getExpiresAt().isBefore(LocalDateTime.now())) {
            pendingRegistrationRepository.delete(pendingRegistration);
            throw new BadRequestException("OTP expired. Please click Resend OTP to get a new code.");
        }

        String storedOtp = pendingRegistration.getVerificationCode() != null
                ? pendingRegistration.getVerificationCode().trim() : null;
        String providedOtp = request.getOtp() != null ? request.getOtp().trim() : null;
        
        if (storedOtp == null || providedOtp == null || !storedOtp.equals(providedOtp)) {
            throw new BadRequestException("Invalid OTP. Please re-check the code sent to your email.");
        }

        if (userRepository.existsByEmailOrPhone(pendingRegistration.getEmail(), pendingRegistration.getPhone())) {
            pendingRegistrationRepository.delete(pendingRegistration);
            throw new BadRequestException("User already exists. Please login instead.");
        }

        Role role = roleRepository.findByName("PASSENGER")
                .orElseThrow(() -> new BadRequestException(
                        "Default PASSENGER role not found. Please contact administrator."));
        
        User user = new User();
        user.setEmail(pendingRegistration.getEmail());
        user.setPhone(pendingRegistration.getPhone());
        user.setName(pendingRegistration.getName());
        user.setPasswordHash(pendingRegistration.getPasswordHash());
        user.setRole(role);
        user.setStatus(User.UserStatus.ACTIVE);
        user.setEmailVerified(Boolean.TRUE);
        user = userRepository.save(user);

        PassengerProfile passengerProfile = new PassengerProfile();
        passengerProfile.setUser(user);
        passengerProfileRepository.save(passengerProfile);

        pendingRegistrationRepository.delete(pendingRegistration);

        return new ApiResponse(true,
                "Verification successful! Your account has been activated. You can now login.");
    }

    public ApiResponse forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(normalizeEmail(request.getEmail()))
                .orElseThrow(() -> new BadRequestException("No account found with this email"));

        if (!Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new BadRequestException("Email is not verified. Please verify your account first.");
        }

        String otp = generateOtp();
        user.setVerificationCode(otp);
        user.setVerificationExpiresAt(LocalDateTime.now().plusMinutes(OTP_TTL_MINUTES));
        userRepository.save(user);

        emailService.sendPasswordResetEmail(user.getEmail(), otp);

        return new ApiResponse(true, "Reset OTP sent to your email. It expires in 10 minutes.");
    }

    public ApiResponse resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByEmail(normalizeEmail(request.getEmail()))
                .orElseThrow(() -> new BadRequestException("No account found with this email"));

        if (user.getVerificationCode() == null || user.getVerificationExpiresAt() == null) {
            throw new BadRequestException("No active reset request found. Please request a new OTP.");
        }

        if (user.getVerificationExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("OTP has expired. Please request a new one.");
        }

        if (!user.getVerificationCode().trim().equals(request.getOtp().trim())) {
            throw new BadRequestException("Invalid OTP. Please check the code sent to your email.");
        }

        if (passwordEncoder.matches(request.getNewPassword(), user.getPasswordHash())) {
            throw new BadRequestException("New password must be different from current password.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setVerificationCode(null);
        user.setVerificationExpiresAt(null);
        userRepository.save(user);

        return new ApiResponse(true, "Password reset successful. You can now log in with your new password.");
    }

    private void deletePendingConflicts(String email, String phone) {
        List<PendingRegistration> conflicts =
                pendingRegistrationRepository.findAllByEmailOrPhone(email, phone);
        if (!conflicts.isEmpty()) {
            pendingRegistrationRepository.deleteAll(conflicts);
            pendingRegistrationRepository.flush();
        }
    }

    private String generateOtp() {
        int otp = 1000 + OTP_RANDOM.nextInt(9000);
        return String.valueOf(otp);
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }

    private String normalizePhone(String phone) {
        return phone == null ? null : phone.trim();
    }
}
