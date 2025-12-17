package com.ridesharing.userservice.controller;

import com.ridesharing.userservice.dto.CreateAdminRequest;
import com.ridesharing.userservice.dto.UserListResponse;
import com.ridesharing.userservice.service.AdminService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Admin Controller
 * Handles admin-only endpoints
 * CORS is handled by API Gateway - no need for @CrossOrigin annotation
 */
@RestController
@RequestMapping("/api/users/admin")
@Slf4j
public class AdminController {
    
    @Autowired
    private AdminService adminService;
    
    /**
     * Health check endpoint for admin controller
     * GET /api/users/admin/health
     * Used to verify the controller is accessible
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        log.info("AdminController.health: Health check called");
        Map<String, String> response = new HashMap<>();
        response.put("status", "ok");
        response.put("controller", "AdminController");
        response.put("timestamp", java.time.LocalDateTime.now().toString());
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
    
    /**
     * Create a new admin user
     * POST /api/users/admin/create-admin
     * Requires ADMIN role
     * 
     * @param userRole User role from X-User-Role header (set by API Gateway)
     * @param request Create admin request
     * @return Created admin user information
     */
    @PostMapping("/create-admin")
    public ResponseEntity<UserListResponse> createAdmin(
            @RequestHeader("X-User-Role") String userRole,
            @Valid @RequestBody CreateAdminRequest request) {
        UserListResponse response = adminService.createAdmin(userRole, request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
    
    /**
     * Get all users
     * GET /api/users/admin/users
     * Requires ADMIN role
     * 
     * @param userRole User role from X-User-Role header (set by API Gateway)
     * @return List of all users
     */
    @GetMapping(value = {"/users", "/users/"})
    public ResponseEntity<?> getAllUsers(
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        log.info("=== AdminController.getAllUsers: START ===");
        log.info("AdminController.getAllUsers: Called with role: {}", userRole);
        log.info("AdminController.getAllUsers: Request received at /api/users/admin/users");
        
        if (userRole == null || userRole.isEmpty()) {
            log.error("AdminController.getAllUsers: Missing X-User-Role header");
            throw new com.ridesharing.userservice.exception.ForbiddenException("Missing X-User-Role header");
        }
        
        try {
            log.info("AdminController.getAllUsers: Calling adminService.getAllUsers");
            List<UserListResponse> users = adminService.getAllUsers(userRole);
            log.info("AdminController.getAllUsers: Successfully retrieved {} users", users.size());
            if (users != null && !users.isEmpty()) {
                log.info("AdminController.getAllUsers: First user sample: id={}, name={}, email={}", 
                    users.get(0).getId(), users.get(0).getName(), users.get(0).getEmail());
            } else {
                log.warn("AdminController.getAllUsers: No users found in database");
            }
            log.info("=== AdminController.getAllUsers: SUCCESS ===");
            return new ResponseEntity<>(users != null ? users : new java.util.ArrayList<>(), HttpStatus.OK);
        } catch (com.ridesharing.userservice.exception.ForbiddenException e) {
            log.error("AdminController.getAllUsers: Access denied - {}", e.getMessage(), e);
            throw e; // Let GlobalExceptionHandler handle it
        } catch (Exception e) {
            log.error("AdminController.getAllUsers: Error retrieving users", e);
            e.printStackTrace();
            throw new RuntimeException("Error retrieving users: " + e.getMessage(), e);
        }
    }
    
    /**
     * Get user by ID
     * GET /api/users/admin/users/{userId}
     * Requires ADMIN role
     * 
     * @param userRole User role from X-User-Role header (set by API Gateway)
     * @param userId User ID
     * @return User information
     */
    @GetMapping("/users/{userId}")
    public ResponseEntity<UserListResponse> getUserById(
            @RequestHeader("X-User-Role") String userRole,
            @PathVariable Long userId) {
        UserListResponse user = adminService.getUserById(userRole, userId);
        return new ResponseEntity<>(user, HttpStatus.OK);
    }
    
    /**
     * Block a user
     * PUT /api/users/admin/users/{userId}/block
     * Requires ADMIN role
     * 
     * @param userRole User role from X-User-Role header (set by API Gateway)
     * @param userId User ID to block
     * @return Updated user information
     */
    @PutMapping("/users/{userId}/block")
    public ResponseEntity<UserListResponse> blockUser(
            @RequestHeader("X-User-Role") String userRole,
            @PathVariable Long userId) {
        UserListResponse user = adminService.updateUserStatus(userRole, userId, true);
        return new ResponseEntity<>(user, HttpStatus.OK);
    }
    
    /**
     * Unblock a user
     * PUT /api/users/admin/users/{userId}/unblock
     * Requires ADMIN role
     * 
     * @param userRole User role from X-User-Role header (set by API Gateway)
     * @param userId User ID to unblock
     * @return Updated user information
     */
    @PutMapping("/users/{userId}/unblock")
    public ResponseEntity<UserListResponse> unblockUser(
            @RequestHeader("X-User-Role") String userRole,
            @PathVariable Long userId) {
        UserListResponse user = adminService.updateUserStatus(userRole, userId, false);
        return new ResponseEntity<>(user, HttpStatus.OK);
    }
}

