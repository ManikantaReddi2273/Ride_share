package com.ridesharing.rideservice.util;

import com.ridesharing.rideservice.exception.ForbiddenException;

/**
 * Utility class for checking admin access
 */
public class AdminCheckUtil {
    
    /**
     * Check if user is admin and throw exception if they try to access non-admin endpoints
     * Admin users should only access admin dashboard endpoints
     * @param userRole User role from X-User-Role header
     * @throws ForbiddenException if user is admin trying to access non-admin endpoint
     */
    public static void preventAdminAccess(String userRole) {
        if (userRole != null && "ADMIN".equals(userRole)) {
            throw new ForbiddenException("Admin users can only access admin dashboard. Please use admin endpoints.");
        }
    }
}

