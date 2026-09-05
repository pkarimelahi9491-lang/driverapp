export type UserRole = 'DRIVER' | 'ADMIN' | 'FINANCE';
export type DailyWorkStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'FINALIZED' | 'REJECTED';
export type PaymentStatus = 'CALCULATING' | 'PENDING_APPROVAL' | 'APPROVED' | 'SENT_TO_FINANCE' | 'PAID';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  isActive: boolean;
  driver?: DriverInfo | null;
}

export interface DriverInfo {
  id: string;
  fullName: string;
  driverCode: string;
  personnelCode: string;
  phoneNumber: string;
  carModel: string;
  carPlate: string;
}

export interface Driver {
  id: string;
  userId: string;
  fullName: string;
  driverCode: string;
  personnelCode: string;
  phoneNumber: string;
  nationalId?: string;
  carModel: string;
  carPlate: string;
  joinDateJalali: string;
  isActive: boolean;
  description: string;
  createdAt: string;
  user?: { id: string; username: string; role: string };
  stats?: { todayTrips: number; todayIncome: number; monthlyTrips: number; monthlyIncome: number };
}

export interface Location {
  id: number;
  name: string;
  city: string;
  isActive: boolean;
}

export interface Route {
  id: string;
  routeCode: string;
  originId: number;
  destinationId: number;
  origin?: Location;
  destination?: Location;
  currentPrice: number;
  currency: string;
  distanceKm: number;
  ratePerKm: number;
  isActive: boolean;
  description: string;
}

export interface Trip {
  id: string;
  tripCode: string;
  dailyWorkId: string;
  driverId: string;
  routeId: string;
  originTitle: string;
  destinationTitle: string;
  routeCode: string;
  snapshotPrice: number;
  currency: string;
  tripJalaliDate: string;
  startTime: string;
  endTime?: string;
  description: string;
  isCancelled: boolean;
  createdAt: string;
  route?: Route;
  driver?: Driver;
}

export interface DailyWorkLog {
  id: string;
  driverId: string;
  jalaliDate: string;
  totalTrips: number;
  totalIncome: number;
  status: DailyWorkStatus;
  finalizedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  notes: string;
  driver?: Driver;
  trips?: Trip[];
  driverName?: string;
  driverCode?: string;
  personnelCode?: string;
}

export interface MonthlySettlementRow {
  driverId: string;
  driverName: string;
  driverCode: string;
  personnelCode: string;
  workingDaysCount: number;
  totalTripsCount: number;
  finalizedIncome: number;
  draftIncome: number;
  unfinalizedDaysCount: number;
  paymentStatus: PaymentStatus;
}

export interface AuditLog {
  id: number;
  userId?: string;
  operatorName: string;
  operatorRole: string;
  action: string;
  entityTitle: string;
  details: string;
  jalaliTimestamp: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
