package com.example

import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.domain.model.UserRole
import com.example.ui.components.HoldingBrandHeader
import com.example.ui.screens.AdminDashboardScreen
import com.example.ui.screens.AdminDriversScreen
import com.example.ui.screens.AdminRoutesScreen
import com.example.ui.screens.AuditLogsScreen
import com.example.ui.screens.DriverHomeScreen
import com.example.ui.screens.FinanceReportScreen
import com.example.ui.screens.LoginScreen
import com.example.ui.screens.RegisterTripScreen
import com.example.ui.theme.AmbientGlassBackdrop
import com.example.ui.theme.MyApplicationTheme
import com.example.ui.viewmodel.FleetViewModel

enum class ScreenRoute {
    LOGIN,
    DRIVER_HOME,
    DRIVER_REGISTER_TRIP,
    ADMIN_DASHBOARD,
    ADMIN_ROUTES,
    ADMIN_DRIVERS,
    ADMIN_FINANCE,
    ADMIN_AUDIT_LOGS
}

class MainActivity : ComponentActivity() {

    private val viewModel: FleetViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            MyApplicationTheme {
                CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
                    FleetApp(viewModel = viewModel)
                }
            }
        }
    }
}

@Composable
fun FleetApp(viewModel: FleetViewModel) {
    val context = LocalContext.current

    val isLoggedIn by viewModel.isLoggedIn.collectAsStateWithLifecycle()
    val loginLoading by viewModel.loginLoading.collectAsStateWithLifecycle()
    val loginError by viewModel.loginError.collectAsStateWithLifecycle()
    val currentRole by viewModel.currentRole.collectAsStateWithLifecycle()
    val allDrivers by viewModel.allDrivers.collectAsStateWithLifecycle()
    val selectedDriver by viewModel.selectedDriver.collectAsStateWithLifecycle()
    val selectedDate by viewModel.selectedDate.collectAsStateWithLifecycle()
    val selectedYearMonth by viewModel.selectedYearMonth.collectAsStateWithLifecycle()
    val activeLocations by viewModel.activeLocations.collectAsStateWithLifecycle()
    val allRoutes by viewModel.allRoutes.collectAsStateWithLifecycle()
    val currentDailyWork by viewModel.currentDailyWork.collectAsStateWithLifecycle()
    val currentDailyTrips by viewModel.currentDailyTrips.collectAsStateWithLifecycle()
    val monthlySettlements by viewModel.monthlySettlements.collectAsStateWithLifecycle()
    val auditLogs by viewModel.auditLogs.collectAsStateWithLifecycle()
    val allApprovals by viewModel.allApprovals.collectAsStateWithLifecycle()

    var currentScreen by remember { mutableStateOf(ScreenRoute.LOGIN) }

    // Auto-navigate when logged in
    LaunchedEffect(isLoggedIn) {
        if (isLoggedIn) {
            currentScreen = when (currentRole) {
                UserRole.ADMIN -> ScreenRoute.ADMIN_DASHBOARD
                UserRole.FINANCE -> ScreenRoute.ADMIN_FINANCE
                UserRole.DRIVER -> ScreenRoute.DRIVER_HOME
            }
        } else {
            currentScreen = ScreenRoute.LOGIN
        }
    }

    // Login Screen
    if (!isLoggedIn || currentScreen == ScreenRoute.LOGIN) {
        LoginScreen(
            onLogin = { username, password -> viewModel.login(username, password) },
            isLoading = loginLoading,
            error = loginError
        )
        return
    }

    // Main App
    Scaffold(
        modifier = Modifier.fillMaxSize(),
        topBar = {
            HoldingBrandHeader(
                currentRole = currentRole,
                driverName = selectedDriver?.fullName ?: "راننده هلدینگ",
                onSwitchRole = { newRole ->
                    viewModel.setRole(newRole)
                    when (newRole) {
                        UserRole.DRIVER -> currentScreen = ScreenRoute.DRIVER_HOME
                        UserRole.ADMIN -> currentScreen = ScreenRoute.ADMIN_DASHBOARD
                        UserRole.FINANCE -> currentScreen = ScreenRoute.ADMIN_FINANCE
                    }
                }
            )
        }
    ) { innerPadding ->
        AmbientGlassBackdrop(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            AnimatedContent(
                targetState = currentScreen,
                transitionSpec = { fadeIn() togetherWith fadeOut() },
                label = "ScreenTransition"
            ) { screen ->
                when (screen) {
                    ScreenRoute.LOGIN -> { /* Handled above */ }

                    ScreenRoute.DRIVER_HOME -> {
                        val activeDriver = selectedDriver ?: allDrivers.firstOrNull()
                        if (activeDriver != null) {
                            DriverHomeScreen(
                                driver = activeDriver,
                                selectedDate = selectedDate,
                                dailyWork = currentDailyWork,
                                todayTrips = currentDailyTrips,
                                monthlyIncome = 0L, // Will be loaded from API
                                allDrivers = allDrivers,
                                onSelectDriver = { viewModel.selectDriver(it) },
                                onSelectDate = { viewModel.selectDate(it) },
                                onRegisterNewTripClick = { currentScreen = ScreenRoute.DRIVER_REGISTER_TRIP },
                                onFinalizeDayClick = {
                                    viewModel.submitDailyWorkForApproval(
                                        driverId = activeDriver.id,
                                        jalaliDate = selectedDate.formatStandard(),
                                        onSuccess = {
                                            Toast.makeText(context, "کارکرد ارسال شد.", Toast.LENGTH_SHORT).show()
                                        },
                                        onError = { msg -> Toast.makeText(context, msg, Toast.LENGTH_LONG).show() }
                                    )
                                },
                                onDeleteTripClick = { trip ->
                                    viewModel.deleteTrip(trip) { err ->
                                        Toast.makeText(context, err, Toast.LENGTH_SHORT).show()
                                    }
                                }
                            )
                        }
                    }

                    ScreenRoute.DRIVER_REGISTER_TRIP -> {
                        val activeDriver = selectedDriver ?: allDrivers.firstOrNull()
                        if (activeDriver != null) {
                            RegisterTripScreen(
                                driver = activeDriver,
                                initialDate = selectedDate,
                                locations = activeLocations,
                                allRoutes = allRoutes,
                                onNavigateBack = { currentScreen = ScreenRoute.DRIVER_HOME },
                                onSubmitTrip = { driverId, jalaliDate, routeId, startTime, endTime, description ->
                                    viewModel.registerTrip(
                                        driverId = driverId,
                                        jalaliDate = jalaliDate,
                                        routeId = routeId,
                                        startTime = startTime,
                                        endTime = endTime,
                                        description = description,
                                        onSuccess = {
                                            Toast.makeText(context, "سفر ثبت شد.", Toast.LENGTH_SHORT).show()
                                            currentScreen = ScreenRoute.DRIVER_HOME
                                        },
                                        onError = { msg -> Toast.makeText(context, msg, Toast.LENGTH_LONG).show() }
                                    )
                                }
                            )
                        }
                    }

                    ScreenRoute.ADMIN_DASHBOARD -> {
                        AdminDashboardScreen(
                            drivers = allDrivers,
                            routes = allRoutes,
                            settlementRows = monthlySettlements,
                            allApprovals = allApprovals,
                            onApproveDailyWork = { dailyWorkId, _ ->
                                viewModel.approveDailyWork(dailyWorkId,
                                    onSuccess = { Toast.makeText(context, "تأیید شد.", Toast.LENGTH_SHORT).show() },
                                    onError = { msg -> Toast.makeText(context, msg, Toast.LENGTH_LONG).show() }
                                )
                            },
                            onRejectDailyWork = { dailyWorkId, reason, _ ->
                                viewModel.rejectDailyWork(dailyWorkId, reason,
                                    onSuccess = { Toast.makeText(context, "رد شد.", Toast.LENGTH_SHORT).show() },
                                    onError = { msg -> Toast.makeText(context, msg, Toast.LENGTH_LONG).show() }
                                )
                            },
                            onUnlockDailyWork = { dailyWorkId, _ ->
                                viewModel.unlockDailyWork(dailyWorkId,
                                    onSuccess = { Toast.makeText(context, "بازگشایی شد.", Toast.LENGTH_SHORT).show() },
                                    onError = { msg -> Toast.makeText(context, msg, Toast.LENGTH_LONG).show() }
                                )
                            },
                            onNavigateToRoutes = { currentScreen = ScreenRoute.ADMIN_ROUTES },
                            onNavigateToDrivers = { currentScreen = ScreenRoute.ADMIN_DRIVERS },
                            onNavigateToFinance = { currentScreen = ScreenRoute.ADMIN_FINANCE },
                            onNavigateToAuditLogs = { currentScreen = ScreenRoute.ADMIN_AUDIT_LOGS }
                        )
                    }

                    ScreenRoute.ADMIN_ROUTES -> {
                        AdminRoutesScreen(
                            routes = allRoutes,
                            locations = activeLocations,
                            onNavigateBack = { currentScreen = ScreenRoute.ADMIN_DASHBOARD },
                            onSaveRoute = { routeId, routeCode, originId, originName, destId, destName, price, desc ->
                                viewModel.saveRoute(routeId, routeCode, originId, originName, destId, destName, price, desc)
                                Toast.makeText(context, "ذخیره شد.", Toast.LENGTH_SHORT).show()
                            },
                            onSyncCsv = { }
                        )
                    }

                    ScreenRoute.ADMIN_DRIVERS -> {
                        AdminDriversScreen(
                            drivers = allDrivers,
                            onNavigateBack = { currentScreen = ScreenRoute.ADMIN_DASHBOARD },
                            onSaveDriver = { driver ->
                                viewModel.saveDriver(driver)
                                Toast.makeText(context, "ذخیره شد.", Toast.LENGTH_SHORT).show()
                            },
                            onToggleActive = { driverId, currentStatus ->
                                viewModel.toggleDriverStatus(driverId, currentStatus)
                            }
                        )
                    }

                    ScreenRoute.ADMIN_FINANCE -> {
                        FinanceReportScreen(
                            currentYearMonth = selectedYearMonth,
                            settlementRows = monthlySettlements,
                            onNavigateBack = { currentScreen = ScreenRoute.ADMIN_DASHBOARD },
                            onYearMonthChange = { viewModel.selectYearMonth(it) },
                            onUpdatePaymentStatus = { status ->
                                viewModel.updatePaymentStatus(status)
                                Toast.makeText(context, "وضعیت تغییر کرد.", Toast.LENGTH_SHORT).show()
                            },
                            onExportCsv = { periodTitle, rows ->
                                viewModel.exportMonthlyCsv(periodTitle, rows)
                            }
                        )
                    }

                    ScreenRoute.ADMIN_AUDIT_LOGS -> {
                        AuditLogsScreen(
                            auditLogs = auditLogs,
                            onNavigateBack = { currentScreen = ScreenRoute.ADMIN_DASHBOARD }
                        )
                    }
                }
            }
        }
    }
}
