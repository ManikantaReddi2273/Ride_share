package com.ridesharing.userservice.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web MVC Configuration
 * Prevents API paths from being treated as static resources
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {
    
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Only serve static resources from specific paths, not from /api/**
        registry.addResourceHandler("/static/**")
                .addResourceLocations("classpath:/static/");
        
        // Explicitly disable static resource handling for /api/** paths
        // This ensures API endpoints are not treated as static resources
    }
}

