package com.ridesharing.paymentservice.service;

import com.ridesharing.paymentservice.dto.AdminPaymentStatisticsResponse;
import com.ridesharing.paymentservice.dto.MonthlyPaymentStatisticsResponse;
import com.ridesharing.paymentservice.entity.Payment;
import com.ridesharing.paymentservice.entity.PaymentStatus;
import com.ridesharing.paymentservice.exception.ForbiddenException;
import com.ridesharing.paymentservice.repository.PaymentRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Admin Payment Service
 * Handles admin-only payment operations
 */
@Service
@Transactional
@Slf4j
public class AdminPaymentService {
    
    @Autowired
    private PaymentRepository paymentRepository;
    
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
     * Get all payments (admin only)
     * @param userRole Current user's role (must be ADMIN)
     * @return List of all payments
     */
    @Transactional(readOnly = true)
    public List<Payment> getAllPayments(String userRole) {
        verifyAdmin(userRole);
        return paymentRepository.findAll();
    }
    
    /**
     * Get payment statistics (admin only)
     * @param userRole Current user's role (must be ADMIN)
     * @return Statistics response
     */
    @Transactional(readOnly = true)
    public AdminPaymentStatisticsResponse getPaymentStatistics(String userRole) {
        log.info("AdminPaymentService.getPaymentStatistics: Called with role: {}", userRole);
        verifyAdmin(userRole);
        
        try {
            List<Payment> allPayments = paymentRepository.findAll();
            log.info("AdminPaymentService.getPaymentStatistics: Found {} payments", allPayments.size());
            
            AdminPaymentStatisticsResponse stats = new AdminPaymentStatisticsResponse();
            stats.setTotalPayments((long) allPayments.size());
            
            // Count payments by status - handle null status
            Map<String, Long> paymentsByStatus = allPayments.stream()
                    .filter(p -> p.getStatus() != null)
                    .collect(Collectors.groupingBy(
                            payment -> payment.getStatus().name(),
                            Collectors.counting()
                    ));
            stats.setPaymentsByStatus(paymentsByStatus);
            
            // Specific counts
            stats.setSuccessfulPayments(paymentsByStatus.getOrDefault(PaymentStatus.SUCCESS.name(), 0L));
            stats.setPendingPayments(paymentsByStatus.getOrDefault(PaymentStatus.PENDING.name(), 0L));
            stats.setFailedPayments(paymentsByStatus.getOrDefault(PaymentStatus.FAILED.name(), 0L));
            
            // Calculate totals - handle null values
            double totalEarnings = allPayments.stream()
                    .filter(p -> p.getStatus() == PaymentStatus.SUCCESS && p.getFare() != null)
                    .mapToDouble(Payment::getFare)
                    .sum();
            stats.setTotalEarnings(totalEarnings);
            
            double totalPlatformFees = allPayments.stream()
                    .filter(p -> p.getStatus() == PaymentStatus.SUCCESS && p.getPlatformFee() != null)
                    .mapToDouble(Payment::getPlatformFee)
                    .sum();
            stats.setTotalPlatformFees(totalPlatformFees);
            
            log.info("AdminPaymentService.getPaymentStatistics: Returning stats - Total: {}, Earnings: {}", 
                    stats.getTotalPayments(), stats.getTotalEarnings());
            return stats;
        } catch (Exception e) {
            log.error("AdminPaymentService.getPaymentStatistics: Error", e);
            throw e;
        }
    }
    
    /**
     * Get monthly payment statistics (admin only)
     * @param userRole Current user's role (must be ADMIN)
     * @return Monthly payment statistics response
     */
    @Transactional(readOnly = true)
    public MonthlyPaymentStatisticsResponse getMonthlyPaymentStatistics(String userRole) {
        log.info("AdminPaymentService.getMonthlyPaymentStatistics: Called with role: {}", userRole);
        verifyAdmin(userRole);
        
        try {
            List<Payment> allPayments = paymentRepository.findAll();
            log.info("AdminPaymentService.getMonthlyPaymentStatistics: Found {} payments", allPayments.size());
            
            // Group successful payments by month (YYYY-MM format) for earnings
            Map<String, Double> monthlyEarnings = allPayments.stream()
                    .filter(p -> p.getStatus() == PaymentStatus.SUCCESS && p.getCreatedAt() != null)
                    .collect(Collectors.groupingBy(
                            payment -> {
                                try {
                                    return payment.getCreatedAt().toLocalDate()
                                            .format(DateTimeFormatter.ofPattern("yyyy-MM"));
                                } catch (Exception e) {
                                    log.warn("Error formatting date for payment {}: {}", payment.getId(), e.getMessage());
                                    return "unknown";
                                }
                            },
                            Collectors.summingDouble(p -> p.getFare() != null ? p.getFare() : 0.0)
                    ));
            
            // Group successful payments by month for platform fees
            Map<String, Double> monthlyPlatformFees = allPayments.stream()
                    .filter(p -> p.getStatus() == PaymentStatus.SUCCESS && p.getCreatedAt() != null)
                    .collect(Collectors.groupingBy(
                            payment -> {
                                try {
                                    return payment.getCreatedAt().toLocalDate()
                                            .format(DateTimeFormatter.ofPattern("yyyy-MM"));
                                } catch (Exception e) {
                                    log.warn("Error formatting date for payment {}: {}", payment.getId(), e.getMessage());
                                    return "unknown";
                                }
                            },
                            Collectors.summingDouble(p -> p.getPlatformFee() != null ? p.getPlatformFee() : 0.0)
                    ));
            
            // Sort by month (ascending) - filter out "unknown"
            monthlyEarnings = monthlyEarnings.entrySet().stream()
                    .filter(e -> !"unknown".equals(e.getKey()))
                    .sorted(Map.Entry.comparingByKey())
                    .collect(Collectors.toMap(
                            Map.Entry::getKey,
                            Map.Entry::getValue,
                            (e1, e2) -> e1,
                            LinkedHashMap::new
                    ));
            
            monthlyPlatformFees = monthlyPlatformFees.entrySet().stream()
                    .filter(e -> !"unknown".equals(e.getKey()))
                    .sorted(Map.Entry.comparingByKey())
                    .collect(Collectors.toMap(
                            Map.Entry::getKey,
                            Map.Entry::getValue,
                            (e1, e2) -> e1,
                            LinkedHashMap::new
                    ));
            
            MonthlyPaymentStatisticsResponse response = new MonthlyPaymentStatisticsResponse();
            response.setMonthlyEarnings(monthlyEarnings);
            response.setMonthlyPlatformFees(monthlyPlatformFees);
            
            log.info("AdminPaymentService.getMonthlyPaymentStatistics: Returning {} months of earnings data", 
                    monthlyEarnings.size());
            return response;
        } catch (Exception e) {
            log.error("AdminPaymentService.getMonthlyPaymentStatistics: Error", e);
            throw e;
        }
    }
}

