package com.example.data.remote

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

// ── Generic Wrappers ──────────────────────────────────────────────

@JsonClass(generateAdapter = true)
data class ApiResponse<T>(
    val success: Boolean,
    val data: T,
    val message: String? = null
)

@JsonClass(generateAdapter = true)
data class PaginatedResponse<T>(
    val success: Boolean,
    val data: List<T>,
    val pagination: Pagination
)

@JsonClass(generateAdapter = true)
data class Pagination(
    val page: Int,
    val limit: Int,
    val total: Int,
    val pages: Int
)

// ── Auth ──────────────────────────────────────────────────────────

@JsonClass(generateAdapter = true)
data class LoginRequest(
    val username: String,
    val password: String
)

@JsonClass(generateAdapter = true)
data class LoginResponse(
    val token: String,
    val user: UserDto
)

@JsonClass(generateAdapter = true)
data class UserDto(
    val id: String,
    val username: String,
    val role: String,
    val driver: DriverDto? = null
)

// ── Driver ────────────────────────────────────────────────────────

@JsonClass(generateAdapter = true)
data class DriverDto(
    val id: String,
    val userId: String = "",
    val fullName: String = "",
    val driverCode: String = "",
    val personnelCode: String = "",
    val phoneNumber: String = "",
    val nationalId: String? = null,
    val carModel: String = "",
    val carPlate: String = "",
    val joinDateJalali: String = "",
    val isActive: Boolean = true,
    val description: String = "",
    val createdAt: String = "",
    val stats: DriverStats? = null,
    val user: UserInfoDto? = null
)

@JsonClass(generateAdapter = true)
data class DriverStats(
    val todayTrips: Int = 0,
    val todayIncome: Long = 0,
    val monthlyTrips: Int = 0,
    val monthlyIncome: Long = 0
)

@JsonClass(generateAdapter = true)
data class UserInfoDto(
    val id: String,
    val username: String,
    val role: String
)

// ── Location ──────────────────────────────────────────────────────

@JsonClass(generateAdapter = true)
data class LocationDto(
    val id: Int,
    val name: String,
    val city: String,
    val isActive: Boolean = true
)

// ── Route ─────────────────────────────────────────────────────────

@JsonClass(generateAdapter = true)
data class RouteDto(
    val id: String,
    val routeCode: String,
    val originId: Int,
    val destinationId: Int,
    val currentPrice: Long,
    val currency: String = "TOMAN",
    val distanceKm: Int = 0,
    val ratePerKm: Long = 0,
    val isActive: Boolean = true,
    val description: String = "",
    val origin: LocationDto? = null,
    val destination: LocationDto? = null
)

// ── Trip ──────────────────────────────────────────────────────────

@JsonClass(generateAdapter = true)
data class TripDto(
    val id: String,
    val tripCode: String,
    val dailyWorkId: String,
    val driverId: String,
    val routeId: String,
    val originTitle: String,
    val destinationTitle: String,
    val routeCode: String,
    val snapshotPrice: Long,
    val currency: String = "TOMAN",
    val tripJalaliDate: String,
    val startTime: String,
    val endTime: String? = null,
    val description: String = "",
    val isCancelled: Boolean = false,
    val createdAt: String = "",
    val route: RouteDto? = null
)

// ── Daily Work ────────────────────────────────────────────────────

@JsonClass(generateAdapter = true)
data class DailyWorkDto(
    val id: String,
    val driverId: String,
    val jalaliDate: String,
    val totalTrips: Int = 0,
    val totalIncome: Long = 0,
    val status: String = "DRAFT",
    val finalizedAt: String? = null,
    val approvedBy: String? = null,
    val rejectionReason: String? = null,
    val notes: String = "",
    val driver: DriverDto? = null,
    val trips: List<TripDto>? = null,
    val driverName: String = "",
    val driverCode: String = "",
    val personnelCode: String = ""
)

// ── Finance ───────────────────────────────────────────────────────

@JsonClass(generateAdapter = true)
data class MonthlyReportResponse(
    val yearMonth: String,
    val period: FinancialPeriodDto,
    val rows: List<SettlementRowDto>,
    val totalAmount: Long
)

@JsonClass(generateAdapter = true)
data class FinancialPeriodDto(
    val status: String,
    val totalAmount: Long,
    val notes: String = ""
)

@JsonClass(generateAdapter = true)
data class SettlementRowDto(
    val driverId: String,
    val driverName: String,
    val driverCode: String,
    val personnelCode: String,
    val workingDaysCount: Int,
    val totalTripsCount: Int,
    val finalizedIncome: Long,
    val draftIncome: Long,
    val unfinalizedDaysCount: Int,
    val paymentStatus: String
)

// ── Audit ─────────────────────────────────────────────────────────

@JsonClass(generateAdapter = true)
data class AuditLogDto(
    val id: Long,
    val userId: String? = null,
    val operatorName: String,
    val operatorRole: String,
    val action: String,
    val entityTitle: String,
    val details: String,
    val jalaliTimestamp: String,
    val createdAt: String
)

// ── Request Bodies ────────────────────────────────────────────────

@JsonClass(generateAdapter = true)
data class RegisterTripRequest(
    val routeId: String,
    val tripJalaliDate: String,
    val startTime: String,
    val endTime: String? = null,
    val description: String = ""
)

@JsonClass(generateAdapter = true)
data class CreateDriverRequest(
    val fullName: String,
    val driverCode: String,
    val personnelCode: String,
    val phoneNumber: String,
    val nationalId: String? = null,
    val carModel: String,
    val carPlate: String,
    val joinDateJalali: String = "",
    val description: String = ""
)

@JsonClass(generateAdapter = true)
data class UpdateDriverRequest(
    val fullName: String? = null,
    val phoneNumber: String? = null,
    val nationalId: String? = null,
    val carModel: String? = null,
    val carPlate: String? = null,
    val description: String? = null
)

@JsonClass(generateAdapter = true)
data class UpdatePriceRequest(
    val price: Long
)

@JsonClass(generateAdapter = true)
data class RejectReasonRequest(
    val reason: String
)

@JsonClass(generateAdapter = true)
data class SyncCsvRequest(
    val csvText: String? = null
)
