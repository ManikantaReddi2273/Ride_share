package com.ridesharing.paymentservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Monthly Payment Statistics Response DTO
 * Contains monthly aggregated payment statistics for charts
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyPaymentStatisticsResponse {
    /**
     * Map of month (format: "YYYY-MM") to total earnings
     * Example: {"2024-01": 10000.50, "2024-02": 15000.75}
     */
    private Map<String, Double> monthlyEarnings;
    
    /**
     * Map of month (format: "YYYY-MM") to total platform fees
     */
    private Map<String, Double> monthlyPlatformFees;
}

