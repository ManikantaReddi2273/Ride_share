package com.ridesharing.userservice.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Sends OTP emails.
 * Prefer Resend HTTPS API on Render (SMTP ports are often blocked on free hosts).
 * Falls back to SMTP for local development.
 */
@Service
@Slf4j
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String smtpFrom;

    @Value("${resend.api-key:}")
    private String resendApiKey;

    @Value("${resend.from:Smart Ride Sharing <onboarding@resend.dev>}")
    private String resendFrom;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    /**
     * @return true if email was sent, false if delivery failed (caller may reveal OTP)
     */
    public boolean trySendOtpEmail(String to, String otp) {
        String subject = "Smart Ride Sharing - OTP Verification";
        String body = String.format(
                "Dear user,%n%nYour verification code is %s.%nThis code expires in 10 minutes.%n%n"
                        + "If you did not attempt to register, please ignore this email.%n%n"
                        + "Regards,%nSmart Ride Sharing Team",
                otp);
        return send(to, subject, body);
    }

    public boolean trySendPasswordResetEmail(String to, String otp) {
        String subject = "Smart Ride Sharing - Password Reset OTP";
        String body = String.format(
                "Dear user,%n%nYour password reset code is %s.%nThis code expires in 10 minutes.%n%n"
                        + "If you did not request a reset, ignore this email.%n%n"
                        + "Regards,%nSmart Ride Sharing Team",
                otp);
        return send(to, subject, body);
    }

    private boolean send(String to, String subject, String textBody) {
        if (resendApiKey != null && !resendApiKey.isBlank()) {
            try {
                sendViaResend(to, subject, textBody);
                log.info("Email sent via Resend to {}", to);
                return true;
            } catch (Exception ex) {
                log.error("Resend failed for {}: {}", to, ex.getMessage(), ex);
            }
        }

        if (mailSender != null && smtpFrom != null && !smtpFrom.isBlank()) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(smtpFrom);
                message.setTo(to);
                message.setSubject(subject);
                message.setText(textBody);
                mailSender.send(message);
                log.info("Email sent via SMTP to {}", to);
                return true;
            } catch (Exception ex) {
                log.error("SMTP failed for {} (Render free often blocks SMTP): {}", to, ex.getMessage(), ex);
            }
        }

        return false;
    }

    private void sendViaResend(String to, String subject, String textBody) throws Exception {
        Map<String, Object> payload = new HashMap<>();
        payload.put("from", resendFrom);
        payload.put("to", List.of(to));
        payload.put("subject", subject);
        payload.put("text", textBody);

        String json = objectMapper.writeValueAsString(payload);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.resend.com/emails"))
                .timeout(Duration.ofSeconds(20))
                .header("Authorization", "Bearer " + resendApiKey.trim())
                .header("Content-Type", MediaType.APPLICATION_JSON_VALUE)
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IllegalStateException("Resend HTTP " + response.statusCode() + ": " + response.body());
        }
    }
}
