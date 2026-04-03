import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

// url from env
const connectionString = isProduction
  ? process.env.NEON_DATABASE_URL
  : process.env.LOCAL_DATABASE_URL;

if (!connectionString) {
  throw new Error(
    `Missing database URL for ${process.env.NODE_ENV} environment.`,
  );
}

const pool = new Pool({
  connectionString,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});
export const db = drizzle(pool);

export const checkConnection = async () => {
  try {
    // Attempt a simple query
    await pool.query("SELECT 1");
    console.log("✅ Successfully connected to the database!");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1); // Exit if the app cannot connect
  }
};
