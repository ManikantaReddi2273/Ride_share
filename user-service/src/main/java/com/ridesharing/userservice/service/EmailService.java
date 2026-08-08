package com.ridesharing.userservice.service;

import com.ridesharing.userservice.exception.BadRequestException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Email Service — sends OTP emails synchronously so registration fails clearly if mail fails.
 */
@Service
@Slf4j
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromAddress;

    public void sendOtpEmail(String to, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(to);
        message.setSubject("Smart Ride Sharing - OTP Verification");
        message.setText(String.format(
                "Dear user,%n%nYour verification code is %s.%nThis code expires in 10 minutes.%n%n"
                        + "If you did not attempt to register, please ignore this email.%n%n"
                        + "Regards,%nSmart Ride Sharing Team",
                otp));

        try {
            mailSender.send(message);
            log.info("OTP email sent successfully to {}", to);
        } catch (Exception ex) {
            log.error("Failed to send OTP email to {}: {}", to, ex.getMessage(), ex);
            throw new BadRequestException(
                    "Could not send OTP email. Please check the email address or try Resend OTP in a minute.");
        }
    }

    public void sendPasswordResetEmail(String to, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(to);
        message.setSubject("Smart Ride Sharing - Password Reset OTP");
        message.setText(String.format(
                "Dear user,%n%nYou requested to reset your password.%n%nYour password reset code is %s.%n"
                        + "This code expires in 10 minutes.%n%n"
                        + "If you did not request a password reset, please ignore this email.%n%n"
                        + "Regards,%nSmart Ride Sharing Team",
                otp));

        try {
            mailSender.send(message);
            log.info("Password reset OTP email sent successfully to {}", to);
        } catch (Exception ex) {
            log.error("Failed to send password reset OTP email to {}: {}", to, ex.getMessage(), ex);
            throw new BadRequestException(
                    "Could not send reset OTP email. Please try again in a minute.");
        }
    }
}
