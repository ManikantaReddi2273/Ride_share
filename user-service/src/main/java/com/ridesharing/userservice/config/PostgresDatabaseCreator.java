package com.ridesharing.userservice.config;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

/**
 * Ensures the PostgreSQL database exists before Spring Boot starts.
 * Connects to the default "postgres" database and creates the target DB if missing.
 */
public final class PostgresDatabaseCreator {

    private static final String DEFAULT_HOST = "localhost";
    private static final int DEFAULT_PORT = 5432;
    private static final String DEFAULT_USER = "postgres";
    private static final String DEFAULT_PASSWORD = "reddi2273";

    private PostgresDatabaseCreator() {
    }

    public static void ensureDatabaseExists(String databaseName) {
        // Neon / managed Postgres: create DBs in the console; skip auto-create
        if ("false".equalsIgnoreCase(envOrDefault("POSTGRES_AUTO_CREATE", "true"))) {
            System.out.println("⏭️ Skipping PostgreSQL auto-create for '" + databaseName
                    + "' (POSTGRES_AUTO_CREATE=false)");
            return;
        }

        String host = envOrDefault("POSTGRES_HOST", DEFAULT_HOST);
        int port = Integer.parseInt(envOrDefault("POSTGRES_PORT", String.valueOf(DEFAULT_PORT)));
        String username = envOrDefault("POSTGRES_USER", DEFAULT_USER);
        String password = envOrDefault("POSTGRES_PASSWORD", DEFAULT_PASSWORD);

        ensureDatabaseExists(host, port, databaseName, username, password);
    }

    public static void ensureDatabaseExists(
            String host,
            int port,
            String databaseName,
            String username,
            String password) {

        if (databaseName == null || !databaseName.matches("[a-zA-Z_][a-zA-Z0-9_]*")) {
            throw new IllegalArgumentException("Invalid database name: " + databaseName);
        }

        String adminUrl = String.format("jdbc:postgresql://%s:%d/postgres", host, port);

        try (Connection connection = DriverManager.getConnection(adminUrl, username, password)) {
            boolean exists;
            try (PreparedStatement ps = connection.prepareStatement(
                    "SELECT 1 FROM pg_database WHERE datname = ?")) {
                ps.setString(1, databaseName);
                try (ResultSet rs = ps.executeQuery()) {
                    exists = rs.next();
                }
            }

            if (!exists) {
                // CREATE DATABASE cannot use bound parameters for the DB name
                try (Statement statement = connection.createStatement()) {
                    statement.executeUpdate("CREATE DATABASE " + databaseName);
                }
                System.out.println("✅ Created PostgreSQL database: " + databaseName);
            } else {
                System.out.println("✅ PostgreSQL database already exists: " + databaseName);
            }
        } catch (SQLException e) {
            throw new IllegalStateException(
                    "Failed to ensure PostgreSQL database exists: " + databaseName
                            + ". Is PostgreSQL running on " + host + ":" + port + "?",
                    e);
        }
    }

    private static String envOrDefault(String key, String defaultValue) {
        String value = System.getenv(key);
        return (value == null || value.isBlank()) ? defaultValue : value;
    }
}
