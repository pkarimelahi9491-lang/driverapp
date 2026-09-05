package com.example.data.auth

import android.content.Context
import android.content.SharedPreferences
import com.example.data.remote.RetrofitClient
import com.example.domain.model.UserRole

class AuthManager(context: Context) {

    private val prefs: SharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    companion object {
        private const val PREFS_NAME = "arman_fleet_auth"
        private const val KEY_TOKEN = "jwt_token"
        private const val KEY_USER_ID = "user_id"
        private const val KEY_USERNAME = "username"
        private const val KEY_ROLE = "user_role"
        private const val KEY_DRIVER_ID = "driver_id"
        private const val KEY_IS_LOGGED_IN = "is_logged_in"
    }

    fun saveAuth(token: String, userId: String, username: String, role: String, driverId: String? = null) {
        prefs.edit()
            .putString(KEY_TOKEN, token)
            .putString(KEY_USER_ID, userId)
            .putString(KEY_USERNAME, username)
            .putString(KEY_ROLE, role)
            .putString(KEY_DRIVER_ID, driverId)
            .putBoolean(KEY_IS_LOGGED_IN, true)
            .apply()
    }

    fun getToken(): String? = prefs.getString(KEY_TOKEN, null)

    fun getUserId(): String? = prefs.getString(KEY_USER_ID, null)

    fun getUsername(): String? = prefs.getString(KEY_USERNAME, null)

    fun getRole(): UserRole {
        return when (prefs.getString(KEY_ROLE, "DRIVER")) {
            "ADMIN" -> UserRole.ADMIN
            "FINANCE" -> UserRole.FINANCE
            else -> UserRole.DRIVER
        }
    }

    fun getRoleString(): String = prefs.getString(KEY_ROLE, "DRIVER") ?: "DRIVER"

    fun getDriverId(): String? = prefs.getString(KEY_DRIVER_ID, null)

    fun isLoggedIn(): Boolean = prefs.getBoolean(KEY_IS_LOGGED_IN, false) && getToken() != null

    fun clearAuth() {
        prefs.edit().clear().apply()
    }

    /**
     * Check if the current user has admin privileges
     */
    fun isAdmin(): Boolean = getRole() == UserRole.ADMIN

    /**
     * Check if the current user can access finance features
     */
    fun isFinanceOrAdmin(): Boolean = getRole() == UserRole.ADMIN || getRole() == UserRole.FINANCE
}
