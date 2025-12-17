package com.ridesharing.rideservice.controller;

import com.ridesharing.rideservice.dto.AdminRideStatisticsResponse;
import com.ridesharing.rideservice.dto.BookingResponse;
import com.ridesharing.rideservice.dto.MonthlyStatisticsResponse;
import com.ridesharing.rideservice.dto.RideResponse;
import com.ridesharing.rideservice.service.AdminRideService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Admin Ride Controller
 * Handles admin-only ride and booking endpoints
 * CORS is handled by API Gateway - no need for @CrossOrigin annotation
 */
@RestController
@RequestMapping("/api/rides/admin")
public class AdminRideController {
    
    @Autowired
    private AdminRideService adminRideService;
    
    /**
     * Get all rides
     * GET /api/rides/admin/rides
     * Requires ADMIN role
     * 
     * @param userRole User role from X-User-Role header (set by API Gateway)
     * @return List of all rides
     */
    @GetMapping("/rides")
    public ResponseEntity<List<RideResponse>> getAllRides(
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        if (userRole == null || userRole.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        try {
            List<RideResponse> rides = adminRideService.getAllRides(userRole);
            return new ResponseEntity<>(rides, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    /**
     * Get all bookings
     * GET /api/rides/admin/bookings
     * Requires ADMIN role
     * 
     * @param userRole User role from X-User-Role header (set by API Gateway)
     * @return List of all bookings
     */
    @GetMapping("/bookings")
    public ResponseEntity<List<BookingResponse>> getAllBookings(
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        if (userRole == null || userRole.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        try {
            List<BookingResponse> bookings = adminRideService.getAllBookings(userRole);
            return new ResponseEntity<>(bookings, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    /**
     * Get ride statistics
     * GET /api/rides/admin/statistics
     * Requires ADMIN role
     * 
     * @param userRole User role from X-User-Role header (set by API Gateway)
     * @return Statistics response
     */
    @GetMapping("/statistics")
    public ResponseEntity<AdminRideStatisticsResponse> getRideStatistics(
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        if (userRole == null || userRole.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        try {
            AdminRideStatisticsResponse stats = adminRideService.getRideStatistics(userRole);
            return new ResponseEntity<>(stats, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    /**
     * Get monthly statistics for rides and bookings
     * GET /api/rides/admin/monthly-statistics
     * Requires ADMIN role
     * 
     * @param userRole User role from X-User-Role header (set by API Gateway)
     * @return Monthly statistics response
     */
    @GetMapping("/monthly-statistics")
    public ResponseEntity<MonthlyStatisticsResponse> getMonthlyStatistics(
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        if (userRole == null || userRole.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        try {
            MonthlyStatisticsResponse stats = adminRideService.getMonthlyStatistics(userRole);
            return new ResponseEntity<>(stats, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}

