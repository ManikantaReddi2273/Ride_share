package com.ridesharing.rideservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Admin Ride Statistics Response DTO
 * Contains aggregated statistics for admin dashboard
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminRideStatisticsResponse {
    private Long totalRides;
    private Long totalBookings;
    private Long cancelledRides;
    private Long completedRides;
    private Long activeRides;
    private Map<String, Long> ridesByStatus;
    private Map<String, Long> bookingsByStatus;
}

