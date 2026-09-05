package com.example.data.remote

import com.example.domain.model.DailyStatus
import com.example.domain.model.DailyWorkSummary
import com.example.domain.model.Driver
import com.example.domain.model.LocationItem
import com.example.domain.model.MonthlySettlementRow
import com.example.domain.model.PaymentStatus
import com.example.domain.model.RouteItem
import com.example.domain.model.Trip

fun DriverDto.toDomain(): Driver = Driver(
    id = id,
    userId = userId,
    fullName = fullName,
    driverCode = driverCode,
    personnelCode = personnelCode,
    phoneNumber = phoneNumber,
    nationalId = nationalId ?: "",
    carModel = carModel,
    carPlate = carPlate,
    joinDateJalali = joinDateJalali,
    isActive = isActive,
    description = description
)

fun LocationDto.toDomain(): LocationItem = LocationItem(
    id = id.toLong(),
    name = name,
    city = city,
    isActive = isActive
)

fun RouteDto.toDomain(): RouteItem = RouteItem(
    id = id,
    routeCode = routeCode,
    originId = originId.toLong(),
    originName = origin?.name ?: "",
    destinationId = destinationId.toLong(),
    destinationName = destination?.name ?: "",
    currentPrice = currentPrice,
    currency = currency,
    isActive = isActive,
    description = description,
    updatedAtJalali = ""
)

fun TripDto.toDomain(): Trip = Trip(
    id = id,
    tripCode = tripCode,
    dailyWorkId = dailyWorkId,
    driverId = driverId,
    routeId = routeId,
    originTitle = originTitle,
    destinationTitle = destinationTitle,
    routeCode = routeCode,
    appliedPrice = snapshotPrice,
    tripJalaliDate = tripJalaliDate,
    startTime = startTime,
    endTime = endTime,
    description = description,
    isCancelled = isCancelled
)

fun DailyWorkDto.toDomain(): DailyWorkSummary = DailyWorkSummary(
    id = id,
    driverId = driverId,
    driverName = driverName.ifEmpty { driver?.fullName ?: "" },
    driverCode = driverCode.ifEmpty { driver?.driverCode ?: "" },
    jalaliDate = jalaliDate,
    totalTrips = totalTrips,
    totalIncome = totalIncome,
    status = when (status) {
        "PENDING_APPROVAL" -> DailyStatus.PENDING_APPROVAL
        "FINALIZED" -> DailyStatus.FINALIZED
        "REJECTED" -> DailyStatus.REJECTED
        else -> DailyStatus.DRAFT
    },
    finalizedAt = null,
    approvedBy = approvedBy,
    rejectionReason = rejectionReason,
    notes = notes
)

fun SettlementRowDto.toDomain(): MonthlySettlementRow = MonthlySettlementRow(
    driverId = driverId,
    driverName = driverName,
    driverCode = driverCode,
    personnelCode = personnelCode,
    workingDaysCount = workingDaysCount,
    totalTripsCount = totalTripsCount,
    finalizedIncome = finalizedIncome,
    draftIncome = draftIncome,
    unfinalizedDaysCount = unfinalizedDaysCount,
    paymentStatus = when (paymentStatus) {
        "CALCULATING" -> PaymentStatus.CALCULATING
        "APPROVED" -> PaymentStatus.APPROVED
        "SENT_TO_FINANCE" -> PaymentStatus.SENT_TO_FINANCE
        "PAID" -> PaymentStatus.PAID
        else -> PaymentStatus.PENDING_APPROVAL
    }
)
