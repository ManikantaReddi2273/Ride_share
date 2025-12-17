package com.ridesharing.paymentservice.controller;

import com.ridesharing.paymentservice.dto.AdminPaymentStatisticsResponse;
import com.ridesharing.paymentservice.dto.MonthlyPaymentStatisticsResponse;
import com.ridesharing.paymentservice.entity.Payment;
import com.ridesharing.paymentservice.service.AdminPaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Admin Payment Controller
 * Handles admin-only payment endpoints
 * CORS is handled by API Gateway - no need for @CrossOrigin annotation
 */
@RestController
@RequestMapping({"/api/payments/admin", "/payments/admin"})
public class AdminPaymentController {
    
    @Autowired
    private AdminPaymentService adminPaymentService;
    
    /**
     * Get all payments
     * GET /api/payments/admin/payments
     * Requires ADMIN role
     * 
     * @param userRole User role from X-User-Role header (set by API Gateway)
     * @return List of all payments
     */
    @GetMapping("/payments")
    public ResponseEntity<List<Payment>> getAllPayments(
            @RequestHeader("X-User-Role") String userRole) {
        List<Payment> payments = adminPaymentService.getAllPayments(userRole);
        return new ResponseEntity<>(payments, HttpStatus.OK);
    }
    
    /**
     * Get payment statistics
     * GET /api/payments/admin/statistics
     * Requires ADMIN role
     * 
     * @param userRole User role from X-User-Role header (set by API Gateway)
     * @return Statistics response
     */
    @GetMapping("/statistics")
    public ResponseEntity<AdminPaymentStatisticsResponse> getPaymentStatistics(
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        if (userRole == null || userRole.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        try {
            AdminPaymentStatisticsResponse stats = adminPaymentService.getPaymentStatistics(userRole);
            return new ResponseEntity<>(stats, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    /**
     * Get monthly payment statistics
     * GET /api/payments/admin/monthly-statistics
     * Requires ADMIN role
     * 
     * @param userRole User role from X-User-Role header (set by API Gateway)
     * @return Monthly payment statistics response
     */
    @GetMapping("/monthly-statistics")
    public ResponseEntity<MonthlyPaymentStatisticsResponse> getMonthlyPaymentStatistics(
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        if (userRole == null || userRole.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        try {
            MonthlyPaymentStatisticsResponse stats = adminPaymentService.getMonthlyPaymentStatistics(userRole);
            return new ResponseEntity<>(stats, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}

