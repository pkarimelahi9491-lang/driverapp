package com.example.data.remote

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query

interface ApiService {

    // ── Auth ──────────────────────────────────────────────────────

    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<ApiResponse<LoginResponse>>

    @GET("auth/me")
    suspend fun getMe(): Response<ApiResponse<UserDto>>

    // ── Drivers ───────────────────────────────────────────────────

    @GET("drivers")
    suspend fun getDrivers(
        @Query("search") search: String? = null,
        @Query("isActive") isActive: String? = null,
        @Query("page") page: String = "1",
        @Query("limit") limit: String = "100"
    ): Response<PaginatedResponse<DriverDto>>

    @GET("drivers/{id}")
    suspend fun getDriver(@Path("id") id: String): Response<ApiResponse<DriverDto>>

    @POST("drivers")
    suspend fun createDriver(@Body request: CreateDriverRequest): Response<ApiResponse<DriverDto>>

    @PUT("drivers/{id}")
    suspend fun updateDriver(@Path("id") id: String, @Body request: UpdateDriverRequest): Response<ApiResponse<DriverDto>>

    @PATCH("drivers/{id}/toggle")
    suspend fun toggleDriver(@Path("id") id: String): Response<ApiResponse<DriverDto>>

    @GET("drivers/{id}/trips")
    suspend fun getDriverTrips(
        @Path("id") id: String,
        @Query("yearMonth") yearMonth: String? = null,
        @Query("limit") limit: String = "100"
    ): Response<PaginatedResponse<TripDto>>

    @GET("drivers/{id}/daily-work")
    suspend fun getDriverDailyWork(
        @Path("id") id: String,
        @Query("yearMonth") yearMonth: String? = null
    ): Response<ApiResponse<List<DailyWorkDto>>>

    // ── Locations ─────────────────────────────────────────────────

    @GET("locations")
    suspend fun getLocations(
        @Query("search") search: String? = null,
        @Query("includeInactive") includeInactive: String? = null
    ): Response<ApiResponse<List<LocationDto>>>

    // ── Routes ────────────────────────────────────────────────────

    @GET("routes")
    suspend fun getRoutes(
        @Query("search") search: String? = null,
        @Query("isActive") isActive: String? = null,
        @Query("page") page: String = "1",
        @Query("limit") limit: String = "100"
    ): Response<PaginatedResponse<RouteDto>>

    @POST("routes")
    suspend fun createRoute(@Body request: Any): Response<ApiResponse<RouteDto>>

    @PUT("routes/{id}")
    suspend fun updateRoute(@Path("id") id: String, @Body request: Any): Response<ApiResponse<RouteDto>>

    @PUT("routes/{id}/price")
    suspend fun updateRoutePrice(@Path("id") id: String, @Body request: UpdatePriceRequest): Response<ApiResponse<RouteDto>>

    @POST("routes/lookup")
    suspend fun lookupRoute(@Body request: Any): Response<ApiResponse<RouteDto>>

    @POST("routes/sync-csv")
    suspend fun syncCsvRoutes(@Body request: SyncCsvRequest): Response<ApiResponse<Map<String, Any>>>

    // ── Trips ─────────────────────────────────────────────────────

    @GET("trips")
    suspend fun getTrips(
        @Query("driverId") driverId: String? = null,
        @Query("date") date: String? = null,
        @Query("yearMonth") yearMonth: String? = null,
        @Query("page") page: String = "1",
        @Query("limit") limit: String = "100"
    ): Response<PaginatedResponse<TripDto>>

    @POST("trips")
    suspend fun registerTrip(@Body request: RegisterTripRequest): Response<ApiResponse<TripDto>>

    @DELETE("trips/{id}")
    suspend fun deleteTrip(@Path("id") id: String): Response<ApiResponse<Map<String, String>>>

    // ── Daily Work ────────────────────────────────────────────────

    @GET("daily-work")
    suspend fun getDailyWorks(
        @Query("driverId") driverId: String? = null,
        @Query("date") date: String? = null,
        @Query("yearMonth") yearMonth: String? = null,
        @Query("status") status: String? = null,
        @Query("page") page: String = "1",
        @Query("limit") limit: String = "100"
    ): Response<PaginatedResponse<DailyWorkDto>>

    @GET("daily-work/{driverId}/{date}")
    suspend fun getDailyWork(
        @Path("driverId") driverId: String,
        @Path("date") date: String
    ): Response<ApiResponse<DailyWorkDto?>>

    @POST("daily-work/submit")
    suspend fun submitDailyWork(@Body request: Map<String, String>): Response<ApiResponse<DailyWorkDto>>

    @POST("daily-work/{id}/approve")
    suspend fun approveDailyWork(@Path("id") id: String): Response<ApiResponse<DailyWorkDto>>

    @POST("daily-work/{id}/reject")
    suspend fun rejectDailyWork(@Path("id") id: String, @Body request: RejectReasonRequest): Response<ApiResponse<DailyWorkDto>>

    @POST("daily-work/{id}/unlock")
    suspend fun unlockDailyWork(@Path("id") id: String): Response<ApiResponse<DailyWorkDto>>

    // ── Finance ───────────────────────────────────────────────────

    @GET("finance/monthly")
    suspend fun getMonthlyReport(@Query("yearMonth") yearMonth: String): Response<ApiResponse<MonthlyReportResponse>>

    @PUT("finance/{yearMonth}/status")
    suspend fun updateFinancialStatus(
        @Path("yearMonth") yearMonth: String,
        @Body request: Map<String, String>
    ): Response<ApiResponse<FinancialPeriodDto>>

    // ── Audit ─────────────────────────────────────────────────────

    @GET("audit")
    suspend fun getAuditLogs(
        @Query("action") action: String? = null,
        @Query("operatorRole") operatorRole: String? = null,
        @Query("page") page: String = "1",
        @Query("limit") limit: String = "100"
    ): Response<PaginatedResponse<AuditLogDto>>
}
