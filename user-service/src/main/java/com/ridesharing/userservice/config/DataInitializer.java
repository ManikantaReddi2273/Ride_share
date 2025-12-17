package com.ridesharing.userservice.config;

import com.ridesharing.userservice.entity.Role;
import com.ridesharing.userservice.entity.User;
import com.ridesharing.userservice.repository.RoleRepository;
import com.ridesharing.userservice.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Data Initializer
 * Initializes default roles and admin user in the database on application startup
 */
@Component
public class DataInitializer implements CommandLineRunner {
    
    @Autowired
    private RoleRepository roleRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    /**
     * Initialize default roles and admin user if they don't exist
     */
    @Override
    public void run(String... args) throws Exception {
        // Create DRIVER role if it doesn't exist
        Role driverRole;
        if (!roleRepository.existsByName("DRIVER")) {
            driverRole = new Role();
            driverRole.setName("DRIVER");
            driverRole.setDescription("Driver role - can post rides and manage vehicles");
            driverRole = roleRepository.save(driverRole);
            System.out.println("Created DRIVER role");
        } else {
            driverRole = roleRepository.findByName("DRIVER").orElse(null);
        }
        
        // Create PASSENGER role if it doesn't exist
        Role passengerRole;
        if (!roleRepository.existsByName("PASSENGER")) {
            passengerRole = new Role();
            passengerRole.setName("PASSENGER");
            passengerRole.setDescription("Passenger role - can book rides");
            passengerRole = roleRepository.save(passengerRole);
            System.out.println("Created PASSENGER role");
        } else {
            passengerRole = roleRepository.findByName("PASSENGER").orElse(null);
        }
        
        // Create ADMIN role if it doesn't exist
        Role adminRole;
        if (!roleRepository.existsByName("ADMIN")) {
            adminRole = new Role();
            adminRole.setName("ADMIN");
            adminRole.setDescription("Admin role - can manage system and users");
            adminRole = roleRepository.save(adminRole);
            System.out.println("Created ADMIN role");
        } else {
            adminRole = roleRepository.findByName("ADMIN").orElse(null);
        }
        
        // Create default admin user if it doesn't exist
        if (adminRole != null && !userRepository.existsByEmail("admin2273@gmail.com")) {
            User adminUser = new User();
            adminUser.setEmail("admin2273@gmail.com");
            adminUser.setPhone("1234567890");
            adminUser.setName("System Administrator");
            // Hash password: reddi2273
            adminUser.setPasswordHash(passwordEncoder.encode("reddi2273"));
            adminUser.setRole(adminRole);
            adminUser.setStatus(User.UserStatus.ACTIVE);
            adminUser.setEmailVerified(Boolean.TRUE);
            userRepository.save(adminUser);
            System.out.println("Created default admin user: admin2273@gmail.com");
        }
    }
}

