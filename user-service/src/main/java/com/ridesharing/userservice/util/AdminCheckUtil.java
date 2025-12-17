package com.ridesharing.userservice.util;

import com.ridesharing.userservice.exception.ForbiddenException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;

/**
 * Utility class for checking admin access
 */
public class AdminCheckUtil {
    
    /**
     * Check if user is admin and throw exception if they try to access non-admin endpoints
     * Admin users should only access admin dashboard endpoints
     * @param authentication Spring Security authentication object
     * @throws ForbiddenException if user is admin trying to access non-admin endpoint
     */
    public static void preventAdminAccess(Authentication authentication) {
        if (authentication == null) {
            return; // Public endpoint, no check needed
        }
        
        String userRole = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(auth -> auth.startsWith("ROLE_"))
                .findFirst()
                .map(auth -> auth.substring(5)) // Remove "ROLE_" prefix
                .orElse("PASSENGER");
        
        if ("ADMIN".equals(userRole)) {
            throw new ForbiddenException("Admin users can only access admin dashboard. Please use admin endpoints.");
        }
    }
}

