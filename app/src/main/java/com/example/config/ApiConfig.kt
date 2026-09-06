package com.example.config

/**
 * API Configuration for Arman Fleet Android App
 *
 * Backend is deployed on Darkube.
 */
object ApiConfig {

    // ── Production Backend ──────────────────────────────────────
    const val BASE_URL = "https://armanlogestic.darkube.ir/api/"

    // ── Supabase Configuration ──────────────────────────────────
    // The Android app connects through our backend API.
    const val SUPABASE_URL = ""
    const val SUPABASE_ANON_KEY = ""

    // ── Timeout Configuration ───────────────────────────────────
    const val CONNECT_TIMEOUT_SECONDS = 30L
    const val READ_TIMEOUT_SECONDS = 30L
    const val WRITE_TIMEOUT_SECONDS = 30L

    // ── Debug Configuration ─────────────────────────────────────
    const val ENABLE_LOGGING = true
}
