package com.ridesharing.paymentservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Admin Payment Statistics Response DTO
 * Contains aggregated payment statistics for admin dashboard
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminPaymentStatisticsResponse {
    private Long totalPayments;
    private Long successfulPayments;
    private Long pendingPayments;
    private Long failedPayments;
    private Double totalEarnings;
    private Double totalPlatformFees;
    private Map<String, Long> paymentsByStatus;
}

