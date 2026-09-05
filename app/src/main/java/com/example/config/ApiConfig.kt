package com.example.config

/**
 * API Configuration for Arman Fleet Android App
 * 
 * Supports both local development and cloud deployment.
 * Update BASE_URL based on your deployment environment.
 */
object ApiConfig {

    // ── Development (Local Backend) ──────────────────────────────
    // For Android Emulator: http://10.0.2.2:3000/api/
    // For Physical Device: http://YOUR_PC_IP:3000/api/
    private const val LOCAL_BASE_URL = "http://10.0.2.2:3000/api/"

    // ── Production (Cloud Backend) ───────────────────────────────
    // Option 1: Self-hosted backend on cloud (e.g., Railway, Render, Fly.io)
    // private const val CLOUD_BASE_URL = "https://your-backend.railway.app/api/"
    
    // Option 2: Supabase Edge Functions (if using serverless)
    // private const val SUPABASE_EDGE_URL = "https://your-project.supabase.co/functions/v1/"
    
    // Option 3: Direct Supabase (not recommended for production - use backend)
    // private const val SUPABASE_URL = "https://your-project.supabase.co"

    // ── Active Configuration ─────────────────────────────────────
    // Change this to CLOUD_BASE_URL when deploying to production
    val BASE_URL = LOCAL_BASE_URL

    // ── Supabase Configuration (if using direct connection) ──────
    // Only needed if you want to bypass the backend and connect directly
    const val SUPABASE_URL = "" // Leave empty if not using direct connection
    const val SUPABASE_ANON_KEY = "" // Leave empty if not using direct connection

    // ── Timeout Configuration ────────────────────────────────────
    const val CONNECT_TIMEOUT_SECONDS = 30L
    const val READ_TIMEOUT_SECONDS = 30L
    const val WRITE_TIMEOUT_SECONDS = 30L

    // ── Debug Configuration ──────────────────────────────────────
    const val ENABLE_LOGGING = true // Set to false in production
}
