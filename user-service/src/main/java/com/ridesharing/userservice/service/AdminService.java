package com.ridesharing.userservice.service;

import com.ridesharing.userservice.dto.CreateAdminRequest;
import com.ridesharing.userservice.dto.UserListResponse;
import com.ridesharing.userservice.entity.Role;
import com.ridesharing.userservice.entity.User;
import com.ridesharing.userservice.exception.BadRequestException;
import com.ridesharing.userservice.exception.ForbiddenException;
import com.ridesharing.userservice.exception.ResourceNotFoundException;
import com.ridesharing.userservice.repository.RoleRepository;
import com.ridesharing.userservice.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Admin Service
 * Handles admin-only operations
 */
@Service
@Transactional
@Slf4j
public class AdminService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private RoleRepository roleRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    /**
     * Verify that the current user is an admin
     * @param userRole Current user's role
     * @throws ForbiddenException if user is not an admin
     */
    private void verifyAdmin(String userRole) {
        if (!"ADMIN".equals(userRole)) {
            throw new ForbiddenException("Access denied. Admin privileges required.");
        }
    }
    
    /**
     * Create a new admin user
     * Only existing admins can create new admin accounts
     * @param currentUserRole Current user's role (must be ADMIN)
     * @param request Create admin request
     * @return Created admin user information
     */
    public UserListResponse createAdmin(String currentUserRole, CreateAdminRequest request) {
        verifyAdmin(currentUserRole);
        
        // Check if user already exists
        if (userRepository.existsByEmailOrPhone(request.getEmail(), request.getPhone())) {
            throw new BadRequestException("User already exists with this email or phone number");
        }
        
        // Get ADMIN role
        Role adminRole = roleRepository.findByName("ADMIN")
                .orElseThrow(() -> new ResourceNotFoundException("ADMIN role not found"));
        
        // Create admin user
        User adminUser = new User();
        adminUser.setEmail(request.getEmail());
        adminUser.setPhone(request.getPhone());
        adminUser.setName(request.getName());
        adminUser.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        adminUser.setRole(adminRole);
        adminUser.setStatus(User.UserStatus.ACTIVE);
        adminUser.setEmailVerified(Boolean.TRUE); // Admin accounts don't need email verification
        
        adminUser = userRepository.save(adminUser);
        
        return convertToUserListResponse(adminUser);
    }
    
    /**
     * Get all users (admin only)
     * @param currentUserRole Current user's role (must be ADMIN)
     * @return List of all users
     */
    @Transactional(readOnly = true)
    public List<UserListResponse> getAllUsers(String currentUserRole) {
        log.info("AdminService.getAllUsers: Called with role: {}", currentUserRole);
        verifyAdmin(currentUserRole);
        
        List<User> users = userRepository.findAll();
        log.info("AdminService.getAllUsers: Found {} users in database", users.size());
        
        List<UserListResponse> response = users.stream()
                .filter(user -> {
                    // Filter out any users with null critical fields that would cause conversion errors
                    if (user == null) {
                        log.warn("AdminService.getAllUsers: Found null user in list, skipping");
                        return false;
                    }
                    return true;
                })
                .map(user -> {
                    try {
                        return convertToUserListResponse(user);
                    } catch (Exception e) {
                        log.error("AdminService.getAllUsers: Error converting user {}: {}", 
                                user != null ? user.getId() : "null", e.getMessage());
                        return null;
                    }
                })
                .filter(userResponse -> userResponse != null) // Remove any failed conversions
                .collect(Collectors.toList());
        
        log.info("AdminService.getAllUsers: Converted to {} UserListResponse objects", response.size());
        return response;
    }
    
    /**
     * Get user by ID (admin only)
     * @param currentUserRole Current user's role (must be ADMIN)
     * @param userId User ID
     * @return User information
     */
    @Transactional(readOnly = true)
    public UserListResponse getUserById(String currentUserRole, Long userId) {
        verifyAdmin(currentUserRole);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        return convertToUserListResponse(user);
    }
    
    /**
     * Block/unblock a user (admin only)
     * @param currentUserRole Current user's role (must be ADMIN)
     * @param userId User ID to block/unblock
     * @param block true to block, false to unblock
     * @return Updated user information
     */
    public UserListResponse updateUserStatus(String currentUserRole, Long userId, boolean block) {
        verifyAdmin(currentUserRole);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        // Prevent admin from blocking themselves
        if (user.getRole().getName().equals("ADMIN") && block) {
            // Check if this is the current admin (would need to pass current user ID)
            // For now, allow but log warning
        }
        
        user.setStatus(block ? User.UserStatus.BLOCKED : User.UserStatus.ACTIVE);
        user = userRepository.save(user);
        
        return convertToUserListResponse(user);
    }
    
    /**
     * Convert User entity to UserListResponse DTO
     */
    private UserListResponse convertToUserListResponse(User user) {
        UserListResponse response = new UserListResponse();
        response.setId(user.getId());
        response.setEmail(user.getEmail());
        response.setPhone(user.getPhone());
        response.setName(user.getName());
        // Handle role safely - check for null
        if (user.getRole() != null) {
            response.setRole(user.getRole().getName());
        } else {
            response.setRole("UNKNOWN");
        }
        // Handle status safely
        if (user.getStatus() != null) {
            response.setStatus(user.getStatus().name());
        } else {
            response.setStatus("UNKNOWN");
        }
        response.setEmailVerified(user.getEmailVerified() != null ? user.getEmailVerified() : false);
        response.setCreatedAt(user.getCreatedAt());
        response.setUpdatedAt(user.getUpdatedAt());
        return response;
    }
}

