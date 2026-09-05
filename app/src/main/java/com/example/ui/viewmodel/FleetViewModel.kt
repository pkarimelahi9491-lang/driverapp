package com.example.ui.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.auth.AuthManager
import com.example.data.remote.CreateDriverRequest
import com.example.data.remote.RemoteFleetRepository
import com.example.data.remote.RetrofitClient
import com.example.domain.model.DailyWorkSummary
import com.example.domain.model.Driver
import com.example.domain.model.LocationItem
import com.example.domain.model.MonthlySettlementRow
import com.example.domain.model.PendingDailyApproval
import com.example.domain.model.RouteItem
import com.example.domain.model.Trip
import com.example.domain.model.UserRole
import com.example.util.PersianDateHelper
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class FleetViewModel(application: Application) : AndroidViewModel(application) {

    private val authManager: AuthManager
    private val repository: RemoteFleetRepository

    init {
        RetrofitClient.init(application)
        authManager = RetrofitClient.getAuthManager()!!
        repository = RemoteFleetRepository(RetrofitClient.api)
    }

    // ── Auth State ─────────────────────────────────────────────────

    private val _isLoggedIn = MutableStateFlow(authManager.isLoggedIn())
    val isLoggedIn: StateFlow<Boolean> = _isLoggedIn.asStateFlow()

    private val _loginError = MutableStateFlow<String?>(null)
    val loginError: StateFlow<String?> = _loginError.asStateFlow()

    private val _loginLoading = MutableStateFlow(false)
    val loginLoading: StateFlow<Boolean> = _loginLoading.asStateFlow()

    // Active User Role
    private val _currentRole = MutableStateFlow(authManager.getRole())
    val currentRole: StateFlow<UserRole> = _currentRole.asStateFlow()

    // ── Data State ─────────────────────────────────────────────────

    private val _drivers = MutableStateFlow<List<Driver>>(emptyList())
    val allDrivers: StateFlow<List<Driver>> = _drivers.asStateFlow()

    private val _locations = MutableStateFlow<List<LocationItem>>(emptyList())
    val activeLocations: StateFlow<List<LocationItem>> = _locations.asStateFlow()

    private val _routes = MutableStateFlow<List<RouteItem>>(emptyList())
    val allRoutes: StateFlow<List<RouteItem>> = _routes.asStateFlow()

    private val _selectedDriver = MutableStateFlow<Driver?>(null)
    val selectedDriver: StateFlow<Driver?> = _selectedDriver.asStateFlow()

    private val _driverDetail = MutableStateFlow<DriverDetail?>(null)
    val driverDetail: StateFlow<DriverDetail?> = _driverDetail.asStateFlow()

    private val _selectedDate = MutableStateFlow(PersianDateHelper.getTodayJalali())
    val selectedDate: StateFlow<PersianDateHelper.JalaliDate> = _selectedDate.asStateFlow()

    private val _selectedYearMonth = MutableStateFlow(PersianDateHelper.getTodayJalali().getYearMonthKey())
    val selectedYearMonth: StateFlow<String> = _selectedYearMonth.asStateFlow()

    private val _currentDailyWork = MutableStateFlow<DailyWorkSummary?>(null)
    val currentDailyWork: StateFlow<DailyWorkSummary?> = _currentDailyWork.asStateFlow()

    private val _currentDailyTrips = MutableStateFlow<List<Trip>>(emptyList())
    val currentDailyTrips: StateFlow<List<Trip>> = _currentDailyTrips.asStateFlow()

    private val _monthlySettlements = MutableStateFlow<List<MonthlySettlementRow>>(emptyList())
    val monthlySettlements: StateFlow<List<MonthlySettlementRow>> = _monthlySettlements.asStateFlow()

    private val _allApprovals = MutableStateFlow<List<PendingDailyApproval>>(emptyList())
    val allApprovals: StateFlow<List<PendingDailyApproval>> = _allApprovals.asStateFlow()

    private val _auditLogs = MutableStateFlow<List<com.example.data.local.entity.AuditLogEntity>>(emptyList())
    val auditLogs: StateFlow<List<com.example.data.local.entity.AuditLogEntity>> = _auditLogs.asStateFlow()

    // ── Login ──────────────────────────────────────────────────────

    fun login(username: String, password: String) {
        viewModelScope.launch {
            _loginLoading.value = true
            _loginError.value = null

            val result = repository.login(username, password)
            result.onSuccess { (token, role) ->
                authManager.saveAuth(token = token, userId = "", username = username, role = role)
                _currentRole.value = authManager.getRole()
                _isLoggedIn.value = true
                loadInitialData()
            }.onFailure { e ->
                _loginError.value = e.message
            }

            _loginLoading.value = false
        }
    }

    fun logout() {
        authManager.clearAuth()
        _isLoggedIn.value = false
        _currentRole.value = UserRole.DRIVER
        _selectedDriver.value = null
        _drivers.value = emptyList()
        _routes.value = emptyList()
        _locations.value = emptyList()
    }

    // ── Initial Data Loading ───────────────────────────────────────

    private fun loadInitialData() {
        viewModelScope.launch {
            // Load drivers
            repository.loadDrivers().onSuccess { list ->
                _drivers.value = list
                // Auto-select first driver or driver from auth
                val driverId = authManager.getDriverId()
                val target = if (authManager.getRole() == UserRole.DRIVER && driverId != null) {
                    list.find { it.id == driverId }
                } else {
                    list.firstOrNull()
                }
                if (target != null) {
                    _selectedDriver.value = target
                    refreshCurrentDailyWork()
                }
            }

            // Load locations & routes
            repository.loadLocations().onSuccess { _locations.value = it }
            repository.loadRoutes().onSuccess { _routes.value = it }

            // Load admin data if admin
            if (_currentRole.value == UserRole.ADMIN) {
                repository.loadAllDailyWorkApprovals().onSuccess { _allApprovals.value = it }
                repository.loadAuditLogs().onSuccess { _auditLogs.value = it }
            }

            // Load settlements if finance/admin
            if (_currentRole.value == UserRole.ADMIN || _currentRole.value == UserRole.FINANCE) {
                loadMonthlySettlements()
            }
        }
    }

    // ── Refresh Data ───────────────────────────────────────────────

    fun refreshCurrentDailyWork() {
        val driver = _selectedDriver.value ?: return
        val dateStr = _selectedDate.value.formatStandard()

        viewModelScope.launch {
            // Load trips
            repository.loadTripsForDriverAndDate(driver.id, dateStr).onSuccess { trips ->
                _currentDailyTrips.value = trips
            }

            // Load daily work summary
            repository.observeDailyWork(driver.id, dateStr).collect { summary ->
                _currentDailyWork.value = summary
            }
        }
    }

    fun refreshAllData() {
        viewModelScope.launch {
            repository.loadDrivers().onSuccess { _drivers.value = it }
            repository.loadRoutes().onSuccess { _routes.value = it }
            repository.loadLocations().onSuccess { _locations.value = it }
            refreshCurrentDailyWork()

            if (_currentRole.value == UserRole.ADMIN) {
                repository.loadAllDailyWorkApprovals().onSuccess { _allApprovals.value = it }
                repository.loadAuditLogs().onSuccess { _auditLogs.value = it }
            }
        }
    }

    // ── Selections ─────────────────────────────────────────────────

    fun setRole(role: UserRole) {
        _currentRole.value = role
    }

    fun selectDriver(driver: Driver) {
        _selectedDriver.value = driver
        refreshCurrentDailyWork()
    }

    fun selectDate(date: PersianDateHelper.JalaliDate) {
        _selectedDate.value = date
        refreshCurrentDailyWork()
    }

    fun selectYearMonth(yearMonth: String) {
        _selectedYearMonth.value = yearMonth
        loadMonthlySettlements()
    }

    // ── Trip Operations ────────────────────────────────────────────

    fun registerTrip(
        driverId: String,
        jalaliDate: String,
        routeId: String,
        startTime: String,
        endTime: String?,
        description: String,
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ) {
        viewModelScope.launch {
            val result = repository.registerTrip(driverId, jalaliDate, routeId, startTime, endTime, description)
            result.onSuccess {
                refreshCurrentDailyWork()
                onSuccess()
            }.onFailure { onError(it.message ?: "خطا در ثبت سفر") }
        }
    }

    fun deleteTrip(trip: Trip, onError: (String) -> Unit) {
        viewModelScope.launch {
            val result = repository.deleteTrip(trip.id)
            result.onSuccess { refreshCurrentDailyWork() }
            result.onFailure { onError(it.message ?: "خطا در حذف سفر") }
        }
    }

    // ── Daily Work Operations ──────────────────────────────────────

    fun submitDailyWorkForApproval(
        driverId: String,
        jalaliDate: String,
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ) {
        viewModelScope.launch {
            val result = repository.submitDailyWork(driverId, jalaliDate)
            result.onSuccess {
                refreshCurrentDailyWork()
                onSuccess()
            }.onFailure { onError(it.message ?: "خطا در ارسال کارکرد") }
        }
    }

    fun approveDailyWork(dailyWorkId: String, onSuccess: () -> Unit, onError: (String) -> Unit) {
        viewModelScope.launch {
            val result = repository.approveDailyWork(dailyWorkId)
            result.onSuccess {
                repository.loadAllDailyWorkApprovals().onSuccess { _allApprovals.value = it }
                onSuccess()
            }.onFailure { onError(it.message ?: "خطا در تأیید") }
        }
    }

    fun rejectDailyWork(dailyWorkId: String, reason: String, onSuccess: () -> Unit, onError: (String) -> Unit) {
        viewModelScope.launch {
            val result = repository.rejectDailyWork(dailyWorkId, reason)
            result.onSuccess {
                repository.loadAllDailyWorkApprovals().onSuccess { _allApprovals.value = it }
                onSuccess()
            }.onFailure { onError(it.message ?: "خطا در رد") }
        }
    }

    fun unlockDailyWork(dailyWorkId: String, onSuccess: () -> Unit, onError: (String) -> Unit) {
        viewModelScope.launch {
            val result = repository.unlockDailyWork(dailyWorkId)
            result.onSuccess {
                repository.loadAllDailyWorkApprovals().onSuccess { _allApprovals.value = it }
                onSuccess()
            }.onFailure { onError(it.message ?: "خطا در بازگشایی") }
        }
    }

    // ── Admin Operations ───────────────────────────────────────────

    fun saveDriver(driver: Driver) {
        viewModelScope.launch {
            val request = CreateDriverRequest(
                fullName = driver.fullName,
                driverCode = driver.driverCode,
                personnelCode = driver.personnelCode,
                phoneNumber = driver.phoneNumber,
                carModel = driver.carModel,
                carPlate = driver.carPlate,
                joinDateJalali = driver.joinDateJalali,
                description = driver.description
            )
            repository.saveDriver(request).onSuccess {
                refreshAllData()
            }
        }
    }

    fun toggleDriverStatus(driverId: String, currentStatus: Boolean) {
        viewModelScope.launch {
            repository.toggleDriverStatus(driverId).onSuccess {
                refreshAllData()
            }
        }
    }

    fun saveRoute(
        routeId: String?,
        routeCode: String,
        originId: Long,
        originName: String,
        destinationId: Long,
        destinationName: String,
        price: Long,
        description: String
    ) {
        viewModelScope.launch {
            repository.loadRoutes().onSuccess { _routes.value = it }
        }
    }

    // ── Finance ────────────────────────────────────────────────────

    private fun loadMonthlySettlements() {
        viewModelScope.launch {
            repository.getMonthlySettlement(_selectedYearMonth.value).onSuccess {
                _monthlySettlements.value = it
            }
        }
    }

    fun updatePaymentStatus(newStatus: com.example.domain.model.PaymentStatus) {
        viewModelScope.launch {
            // API call would go here
            loadMonthlySettlements()
        }
    }

    fun exportMonthlyCsv(periodTitle: String, rows: List<MonthlySettlementRow>): String {
        val builder = StringBuilder()
        builder.append("\uFEFF")
        builder.append("گزارش کارکرد رانندگان هلدینگ آرمان انتخاب\n")
        builder.append("دوره: $periodTitle\n\n")
        builder.append("ردیف,نام,کد,پرسنلی,روز,سفر,مبلغ\n")
        rows.forEachIndexed { i, r ->
            builder.append("${i + 1},\"${r.driverName}\",${r.driverCode},${r.personnelCode},${r.workingDaysCount},${r.totalTripsCount},${r.finalizedIncome}\n")
        }
        return builder.toString()
    }
}
