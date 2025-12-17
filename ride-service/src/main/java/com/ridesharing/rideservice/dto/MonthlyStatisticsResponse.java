package com.ridesharing.rideservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Monthly Statistics Response DTO
 * Contains monthly aggregated statistics for charts
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyStatisticsResponse {
    /**
     * Map of month (format: "YYYY-MM") to count
     * Example: {"2024-01": 10, "2024-02": 15}
     */
    private Map<String, Long> monthlyRides;
    
    /**
     * Map of month (format: "YYYY-MM") to count
     */
    private Map<String, Long> monthlyBookings;
}

