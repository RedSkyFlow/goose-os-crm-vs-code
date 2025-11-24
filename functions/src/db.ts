import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

// Connect to the Cloud SQL instance
export const pool = new Pool({
  user: process.env.DB_USER,
  host: `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`, // For production
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  // Optional: Add logic here if you want to support local TCP connections for testing
});