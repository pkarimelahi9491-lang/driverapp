package com.example.data.remote

import com.example.domain.model.DailyWorkSummary
import com.example.domain.model.Driver
import com.example.domain.model.LocationItem
import com.example.domain.model.MonthlySettlementRow
import com.example.domain.model.PendingDailyApproval
import com.example.domain.model.RouteItem
import com.example.domain.model.Trip
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn
import kotlinx.coroutines.withContext

class RemoteFleetRepository(private val api: ApiService) {

    // ── Reactive State Flows ────────────────────────────────────────

    private val _drivers = MutableStateFlow<List<Driver>>(emptyList())
    val drivers: Flow<List<Driver>> = _drivers

    private val _locations = MutableStateFlow<List<LocationItem>>(emptyList())
    val locations: Flow<List<LocationItem>> = _locations

    private val _routes = MutableStateFlow<List<RouteItem>>(emptyList())
    val routes: Flow<List<RouteItem>> = _routes

    // ── Auth ──────────────────────────────────────────────────────

    suspend fun login(username: String, password: String): Result<Pair<String, String>> = withContext(Dispatchers.IO) {
        try {
            val response = api.login(LoginRequest(username, password))
            if (response.isSuccessful && response.body()?.success == true) {
                val data = response.body()!!.data
                Result.success(Pair(data.token, data.user.role))
            } else {
                Result.failure(Exception(response.body()?.message ?: "خطا در ورود"))
            }
        } catch (e: Exception) {
            Result.failure(Exception("ارتباط با سرور برقرار نیست"))
        }
    }

    // ── Drivers ────────────────────────────────────────────────────

    suspend fun loadDrivers(search: String? = null): Result<List<Driver>> = withContext(Dispatchers.IO) {
        try {
            val response = api.getDrivers(search = search, limit = "500")
            if (response.isSuccessful) {
                val data = response.body()?.data?.map { it.toDomain() } ?: emptyList()
                _drivers.value = data
                Result.success(data)
            } else {
                Result.failure(Exception("خطا در دریافت لیست رانندگان"))
            }
        } catch (e: Exception) {
            Result.failure(Exception("ارتباط با سرور برقرار نیست"))
        }
    }

    suspend fun getDriverDetail(id: String): Result<DriverDetail> = withContext(Dispatchers.IO) {
        try {
            val response = api.getDriver(id)
            if (response.isSuccessful && response.body()?.success == true) {
                val dto = response.body()!!.data
                val driver = dto.toDomain()
                val stats = dto.stats
                Result.success(DriverDetail(
                    driver = driver,
                    todayTrips = stats?.todayTrips ?: 0,
                    todayIncome = stats?.todayIncome ?: 0,
                    monthlyTrips = stats?.monthlyTrips ?: 0,
                    monthlyIncome = stats?.monthlyIncome ?: 0
                ))
            } else {
                Result.failure(Exception("راننده یافت نشد"))
            }
        } catch (e: Exception) {
            Result.failure(Exception("ارتباط با سرور برقرار نیست"))
        }
    }

    // ── Locations ──────────────────────────────────────────────────

    suspend fun loadLocations(): Result<List<LocationItem>> = withContext(Dispatchers.IO) {
        try {
            val response = api.getLocations()
            if (response.isSuccessful) {
                val data = response.body()?.data?.map { it.toDomain() } ?: emptyList()
                _locations.value = data
                Result.success(data)
            } else {
                Result.failure(Exception("خطا در دریافت مکان‌ها"))
            }
        } catch (e: Exception) {
            Result.failure(Exception("ارتباط با سرور برقرار نیست"))
        }
    }

    // ── Routes ─────────────────────────────────────────────────────

    suspend fun loadRoutes(): Result<List<RouteItem>> = withContext(Dispatchers.IO) {
        try {
            val response = api.getRoutes(limit = "500")
            if (response.isSuccessful) {
                val data = response.body()?.data?.map { it.toDomain() } ?: emptyList()
                _routes.value = data
                Result.success(data)
            } else {
                Result.failure(Exception("خطا در دریافت مسیرها"))
            }
        } catch (e: Exception) {
            Result.failure(Exception("ارتباط با سرور برقرار نیست"))
        }
    }

    suspend fun lookupRoute(originName: String, destinationName: String): Result<RouteItem> = withContext(Dispatchers.IO) {
        try {
            val response = api.lookupRoute(mapOf("originName" to originName, "destinationName" to destinationName))
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(response.body()!!.data.toDomain())
            } else {
                val msg = response.body()?.message ?: "این مسیر در سیستم تعریف نشده است"
                Result.failure(Exception(msg))
            }
        } catch (e: Exception) {
            Result.failure(Exception("ارتباط با سرور برقرار نیست"))
        }
    }

    // ── Trips ──────────────────────────────────────────────────────

    suspend fun loadTripsForDriverAndDate(driverId: String, jalaliDate: String): Result<List<Trip>> = withContext(Dispatchers.IO) {
        try {
            val response = api.getTrips(driverId = driverId, date = jalaliDate, limit = "100")
            if (response.isSuccessful) {
                Result.success(response.body()?.data?.map { it.toDomain() } ?: emptyList())
            } else {
                Result.failure(Exception("خطا در دریافت سفرها"))
            }
        } catch (e: Exception) {
            Result.failure(Exception("ارتباط با سرور برقرار نیست"))
        }
    }

    suspend fun registerTrip(
        driverId: String,
        jalaliDate: String,
        routeId: String,
        startTime: String,
        endTime: String?,
        description: String
    ): Result<Trip> = withContext(Dispatchers.IO) {
        try {
            val request = RegisterTripRequest(
                routeId = routeId,
                tripJalaliDate = jalaliDate,
                startTime = startTime,
                endTime = endTime,
                description = description
            )
            val response = api.registerTrip(request)
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(response.body()!!.data.toDomain())
            } else {
                Result.failure(Exception(response.body()?.message ?: "خطا در ثبت سفر"))
            }
        } catch (e: Exception) {
            Result.failure(Exception("ارتباط با سرور برقرار نیست"))
        }
    }

    suspend fun deleteTrip(tripId: String): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val response = api.deleteTrip(tripId)
            if (response.isSuccessful) Result.success(Unit)
            else Result.failure(Exception(response.body()?.message ?: "خطا در حذف سفر"))
        } catch (e: Exception) {
            Result.failure(Exception("ارتباط با سرور برقرار نیست"))
        }
    }

    // ── Daily Work ─────────────────────────────────────────────────

    suspend fun observeDailyWork(driverId: String, jalaliDate: String): Flow<DailyWorkSummary?> = flow {
        try {
            val response = api.getDailyWork(driverId, jalaliDate)
            if (response.isSuccessful) {
                emit(response.body()?.data?.toDomain())
            } else {
                emit(null)
            }
        } catch (e: Exception) {
            emit(null)
        }
    }.flowOn(Dispatchers.IO)

    suspend fun submitDailyWork(driverId: String, jalaliDate: String): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val response = api.submitDailyWork(mapOf("driverId" to driverId, "jalaliDate" to jalaliDate))
            if (response.isSuccessful) Result.success(Unit)
            else Result.failure(Exception(response.body()?.message ?: "خطا در ارسال کارکرد"))
        } catch (e: Exception) {
            Result.failure(Exception("ارتباط با سرور برقرار نیست"))
        }
    }

    // ── Admin Operations ───────────────────────────────────────────

    suspend fun loadAllDailyWorkApprovals(): Result<List<PendingDailyApproval>> = withContext(Dispatchers.IO) {
        try {
            val response = api.getDailyWorks(limit = "200")
            if (response.isSuccessful) {
                val dailyWorks = response.body()?.data?.map { it.toDomain() } ?: emptyList()
                val approvals = dailyWorks.map { dw ->
                    PendingDailyApproval(
                        dailyWork = dw,
                        driver = null,
                        trips = emptyList()
                    )
                }
                Result.success(approvals)
            } else {
                Result.failure(Exception("خطا در دریافت کارکردها"))
            }
        } catch (e: Exception) {
            Result.failure(Exception("ارتباط با سرور برقرار نیست"))
        }
    }

    suspend fun approveDailyWork(dailyWorkId: String): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val response = api.approveDailyWork(dailyWorkId)
            if (response.isSuccessful) Result.success(Unit)
            else Result.failure(Exception(response.body()?.message ?: "خطا در تأیید"))
        } catch (e: Exception) {
            Result.failure(Exception("ارتباط با سرور برقرار نیست"))
        }
    }

    suspend fun rejectDailyWork(dailyWorkId: String, reason: String): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val response = api.rejectDailyWork(dailyWorkId, RejectReasonRequest(reason))
            if (response.isSuccessful) Result.success(Unit)
            else Result.failure(Exception(response.body()?.message ?: "خطا در رد"))
        } catch (e: Exception) {
            Result.failure(Exception("ارتباط با سرور برقرار نیست"))
        }
    }

    suspend fun unlockDailyWork(dailyWorkId: String): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val response = api.unlockDailyWork(dailyWorkId)
            if (response.isSuccessful) Result.success(Unit)
            else Result.failure(Exception(response.body()?.message ?: "خطا در بازگشایی"))
        } catch (e: Exception) {
            Result.failure(Exception("ارتباط با سرور برقرار نیست"))
        }
    }

    // ── Finance ────────────────────────────────────────────────────

    suspend fun getMonthlySettlement(yearMonth: String): Result<List<MonthlySettlementRow>> = withContext(Dispatchers.IO) {
        try {
            val response = api.getMonthlyReport(yearMonth)
            if (response.isSuccessful) {
                Result.success(response.body()?.data?.rows?.map { it.toDomain() } ?: emptyList())
            } else {
                Result.failure(Exception("خطا در دریافت گزارش مالی"))
            }
        } catch (e: Exception) {
            Result.failure(Exception("ارتباط با سرور برقرار نیست"))
        }
    }

    // ── Audit ──────────────────────────────────────────────────────

    suspend fun loadAuditLogs(): Result<List<com.example.data.local.entity.AuditLogEntity>> = withContext(Dispatchers.IO) {
        try {
            val response = api.getAuditLogs(limit = "200")
            if (response.isSuccessful) {
                val logs = response.body()?.data?.map { dto ->
                    com.example.data.local.entity.AuditLogEntity(
                        id = dto.id,
                        operatorName = dto.operatorName,
                        operatorRole = dto.operatorRole,
                        action = dto.action,
                        entityTitle = dto.entityTitle,
                        details = dto.details,
                        jalaliTimestamp = dto.jalaliTimestamp,
                        createdAt = System.currentTimeMillis()
                    )
                } ?: emptyList()
                Result.success(logs)
            } else {
                Result.failure(Exception("خطا در دریافت لاگ‌ها"))
            }
        } catch (e: Exception) {
            Result.failure(Exception("ارتباط با سرور برقرار نیست"))
        }
    }

    // ── Admin CRUD ─────────────────────────────────────────────────

    suspend fun saveDriver(request: CreateDriverRequest): Result<Driver> = withContext(Dispatchers.IO) {
        try {
            val response = api.createDriver(request)
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(response.body()!!.data.toDomain())
            } else {
                Result.failure(Exception(response.body()?.message ?: "خطا در ذخیره راننده"))
            }
        } catch (e: Exception) {
            Result.failure(Exception("ارتباط با سرور برقرار نیست"))
        }
    }

    suspend fun toggleDriverStatus(driverId: String): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val response = api.toggleDriver(driverId)
            if (response.isSuccessful) Result.success(Unit)
            else Result.failure(Exception("خطا در تغییر وضعیت"))
        } catch (e: Exception) {
            Result.failure(Exception("ارتباط با سرور برقرار نیست"))
        }
    }
}

data class DriverDetail(
    val driver: Driver,
    val todayTrips: Int,
    val todayIncome: Long,
    val monthlyTrips: Int,
    val monthlyIncome: Long
)
