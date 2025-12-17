package com.ridesharing.rideservice.service;

import com.ridesharing.rideservice.dto.AdminRideStatisticsResponse;
import com.ridesharing.rideservice.dto.BookingResponse;
import com.ridesharing.rideservice.dto.MonthlyStatisticsResponse;
import com.ridesharing.rideservice.dto.RideResponse;
import com.ridesharing.rideservice.entity.Booking;
import com.ridesharing.rideservice.entity.BookingStatus;
import com.ridesharing.rideservice.entity.Ride;
import com.ridesharing.rideservice.entity.RideStatus;
import com.ridesharing.rideservice.exception.ForbiddenException;
import com.ridesharing.rideservice.repository.BookingRepository;
import com.ridesharing.rideservice.repository.RideRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Admin Ride Service
 * Handles admin-only ride and booking operations
 */
@Service
@Transactional
public class AdminRideService {
    
    @Autowired
    private RideRepository rideRepository;
    
    @Autowired
    private BookingRepository bookingRepository;
    
    @Autowired
    private RideService rideService;
    
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
     * Get all rides (admin only)
     * @param userRole Current user's role (must be ADMIN)
     * @return List of all rides
     */
    @Transactional(readOnly = true)
    public List<RideResponse> getAllRides(String userRole) {
        verifyAdmin(userRole);
        
        List<Ride> rides = rideRepository.findAll();
        return rides.stream()
                .map(ride -> rideService.buildRideResponseWithDetails(ride, null))
                .collect(Collectors.toList());
    }
    
    /**
     * Get all bookings (admin only)
     * @param userRole Current user's role (must be ADMIN)
     * @return List of all bookings
     */
    @Transactional(readOnly = true)
    public List<BookingResponse> getAllBookings(String userRole) {
        verifyAdmin(userRole);
        
        List<Booking> bookings = bookingRepository.findAll();
        return bookings.stream()
                .map(booking -> {
                    Ride ride = booking.getRide();
                    return rideService.buildBookingResponse(booking, null, ride);
                })
                .collect(Collectors.toList());
    }
    
    /**
     * Get ride statistics (admin only)
     * @param userRole Current user's role (must be ADMIN)
     * @return Statistics response
     */
    @Transactional(readOnly = true)
    public AdminRideStatisticsResponse getRideStatistics(String userRole) {
        verifyAdmin(userRole);
        
        List<Ride> allRides = rideRepository.findAll();
        List<Booking> allBookings = bookingRepository.findAll();
        
        AdminRideStatisticsResponse stats = new AdminRideStatisticsResponse();
        stats.setTotalRides((long) allRides.size());
        stats.setTotalBookings((long) allBookings.size());
        
        // Count rides by status
        Map<String, Long> ridesByStatus = allRides.stream()
                .collect(Collectors.groupingBy(
                        ride -> ride.getStatus().name(),
                        Collectors.counting()
                ));
        stats.setRidesByStatus(ridesByStatus);
        
        // Count bookings by status
        Map<String, Long> bookingsByStatus = allBookings.stream()
                .collect(Collectors.groupingBy(
                        booking -> booking.getStatus().name(),
                        Collectors.counting()
                ));
        stats.setBookingsByStatus(bookingsByStatus);
        
        // Specific counts
        stats.setCancelledRides(ridesByStatus.getOrDefault(RideStatus.CANCELLED.name(), 0L));
        stats.setCompletedRides(ridesByStatus.getOrDefault(RideStatus.COMPLETED.name(), 0L));
        stats.setActiveRides(ridesByStatus.getOrDefault(RideStatus.POSTED.name(), 0L) + 
                            ridesByStatus.getOrDefault(RideStatus.BOOKED.name(), 0L));
        
        return stats;
    }
    
    /**
     * Get monthly statistics for rides and bookings (admin only)
     * @param userRole Current user's role (must be ADMIN)
     * @return Monthly statistics response
     */
    @Transactional(readOnly = true)
    public MonthlyStatisticsResponse getMonthlyStatistics(String userRole) {
        verifyAdmin(userRole);
        
        List<Ride> allRides = rideRepository.findAll();
        List<Booking> allBookings = bookingRepository.findAll();
        
        // Group rides by month (YYYY-MM format)
        Map<String, Long> monthlyRides = allRides.stream()
                .collect(Collectors.groupingBy(
                        ride -> {
                            LocalDate rideDate = ride.getRideDate();
                            return rideDate != null ? rideDate.format(DateTimeFormatter.ofPattern("yyyy-MM")) : "unknown";
                        },
                        Collectors.counting()
                ));
        
        // Group bookings by month (YYYY-MM format)
        Map<String, Long> monthlyBookings = allBookings.stream()
                .collect(Collectors.groupingBy(
                        booking -> {
                            LocalDate bookingDate = booking.getCreatedAt() != null 
                                    ? booking.getCreatedAt().toLocalDate() 
                                    : null;
                            return bookingDate != null ? bookingDate.format(DateTimeFormatter.ofPattern("yyyy-MM")) : "unknown";
                        },
                        Collectors.counting()
                ));
        
        // Sort by month (ascending)
        monthlyRides = monthlyRides.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (e1, e2) -> e1,
                        LinkedHashMap::new
                ));
        
        monthlyBookings = monthlyBookings.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (e1, e2) -> e1,
                        LinkedHashMap::new
                ));
        
        MonthlyStatisticsResponse response = new MonthlyStatisticsResponse();
        response.setMonthlyRides(monthlyRides);
        response.setMonthlyBookings(monthlyBookings);
        
        return response;
    }
}

