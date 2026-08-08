-- Run this once in Neon → SQL Editor (connected to any DB on the branch)
-- Creates the three databases required by the microservices

SELECT 'Creating databases if missing...';

-- Neon allows CREATE DATABASE from the SQL editor
CREATE DATABASE user_db;
CREATE DATABASE ride_db;
CREATE DATABASE payment_db;
