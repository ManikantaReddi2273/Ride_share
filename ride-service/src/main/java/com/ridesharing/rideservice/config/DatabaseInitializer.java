package com.ridesharing.rideservice.config;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Database Initializer
 * Ensures the reviews table exists on startup (PostgreSQL).
 * Prefer Hibernate ddl-auto=update for normal schema management;
 * this is a safety net if the reviews table is missing.
 */
@Component
@Slf4j
public class DatabaseInitializer {

    @Autowired(required = false)
    private JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void initializeDatabase() {
        if (jdbcTemplate == null) {
            log.warn("JdbcTemplate not available, skipping database initialization");
            return;
        }

        try {
            String checkTableSql =
                    "SELECT COUNT(*) FROM information_schema.tables "
                            + "WHERE table_schema = 'public' AND table_name = 'reviews'";

            Integer tableCount = jdbcTemplate.queryForObject(checkTableSql, Integer.class);

            if (tableCount == null || tableCount == 0) {
                log.warn("⚠️ Reviews table does not exist. Creating it now...");
                createReviewsTable();
            } else {
                log.info("✅ Reviews table exists in database");
            }
        } catch (Exception e) {
            log.error("Error checking/creating reviews table: {}", e.getMessage(), e);
            try {
                createReviewsTable();
            } catch (Exception createEx) {
                log.error("Failed to create reviews table: {}", createEx.getMessage());
            }
        }
    }

    private void createReviewsTable() {
        try {
            String createTableSql = """
                CREATE TABLE IF NOT EXISTS reviews (
                    id BIGSERIAL PRIMARY KEY,
                    booking_id BIGINT NOT NULL,
                    reviewer_id BIGINT NOT NULL,
                    reviewee_id BIGINT NOT NULL,
                    rating INT NOT NULL,
                    comment TEXT,
                    review_type VARCHAR(30) NOT NULL,
                    created_at TIMESTAMP NOT NULL,
                    updated_at TIMESTAMP,
                    CONSTRAINT fk_reviews_booking FOREIGN KEY (booking_id)
                        REFERENCES bookings(id) ON DELETE CASCADE
                )
                """;

            jdbcTemplate.execute(createTableSql);
            jdbcTemplate.execute(
                    "CREATE INDEX IF NOT EXISTS idx_booking_id ON reviews (booking_id)");
            jdbcTemplate.execute(
                    "CREATE INDEX IF NOT EXISTS idx_reviewer_id ON reviews (reviewer_id)");
            jdbcTemplate.execute(
                    "CREATE INDEX IF NOT EXISTS idx_reviewee_id ON reviews (reviewee_id)");
            jdbcTemplate.execute(
                    "CREATE UNIQUE INDEX IF NOT EXISTS idx_booking_reviewer "
                            + "ON reviews (booking_id, reviewer_id)");
            log.info("✅ Successfully created reviews table");
        } catch (Exception e) {
            log.error("Failed to create reviews table: {}", e.getMessage(), e);
            throw e;
        }
    }
}
