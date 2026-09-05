const API_BASE = '/api';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'خطای سرور');
    }

    return data;
  }

  // Auth
  async login(username: string, password: string) {
    return this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async getMe() {
    return this.request<any>('/auth/me');
  }

  // Drivers
  async getDrivers(params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<any>(`/drivers${qs}`);
  }

  async getDriver(id: string) {
    return this.request<any>(`/drivers/${id}`);
  }

  async createDriver(data: any) {
    return this.request<any>('/drivers', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateDriver(id: string, data: any) {
    return this.request<any>(`/drivers/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async toggleDriver(id: string) {
    return this.request<any>(`/drivers/${id}/toggle`, { method: 'PATCH' });
  }

  async deleteDriver(id: string) {
    return this.request<any>(`/drivers/${id}`, { method: 'DELETE' });
  }

  async getDriverTrips(id: string, params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<any>(`/drivers/${id}/trips${qs}`);
  }

  async getDriverDailyWork(id: string, params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<any>(`/drivers/${id}/daily-work${qs}`);
  }

  // Locations
  async getLocations(params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<any>(`/locations${qs}`);
  }

  // Routes
  async getRoutes(params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<any>(`/routes${qs}`);
  }

  async createRoute(data: any) {
    return this.request<any>('/routes', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateRoute(id: string, data: any) {
    return this.request<any>(`/routes/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async updateRoutePrice(id: string, price: number) {
    return this.request<any>(`/routes/${id}/price`, { method: 'PUT', body: JSON.stringify({ price }) });
  }

  async toggleRoute(id: string) {
    return this.request<any>(`/routes/${id}/toggle`, { method: 'PATCH' });
  }

  async deleteRoute(id: string) {
    return this.request<any>(`/routes/${id}`, { method: 'DELETE' });
  }

  async getRoutePriceHistory(id: string) {
    return this.request<any>(`/routes/${id}/price-history`);
  }

  async syncCsvRoutes(csvText?: string) {
    return this.request<any>('/routes/sync-csv', { method: 'POST', body: JSON.stringify({ csvText }) });
  }

  // Trips
  async getTrips(params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<any>(`/trips${qs}`);
  }

  // Daily Work
  async getDailyWorks(params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<any>(`/daily-work${qs}`);
  }

  async approveDailyWork(id: string) {
    return this.request<any>(`/daily-work/${id}/approve`, { method: 'POST' });
  }

  async rejectDailyWork(id: string, reason: string) {
    return this.request<any>(`/daily-work/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) });
  }

  async unlockDailyWork(id: string) {
    return this.request<any>(`/daily-work/${id}/unlock`, { method: 'POST' });
  }

  // Finance
  async getMonthlyReport(yearMonth: string) {
    return this.request<any>(`/finance/monthly?yearMonth=${yearMonth}`);
  }

  async updateFinancialStatus(yearMonth: string, status: string) {
    return this.request<any>(`/finance/${yearMonth}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
  }

  async exportCsv(yearMonth: string) {
    const response = await fetch(`${API_BASE}/finance/export/csv?yearMonth=${yearMonth}`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    return response.text();
  }

  // Roster
  async getRoster(yearMonth: string) {
    return this.request<any>(`/roster/${yearMonth}`);
  }

  async calculateRoster(yearMonth: string, driverIds?: string[]) {
    return this.request<any>('/roster/calculate', {
      method: 'POST',
      body: JSON.stringify({ yearMonth, driverIds }),
    });
  }

  async bulkFinalize(yearMonth: string) {
    return this.request<any>('/roster/bulk-finalize', {
      method: 'POST',
      body: JSON.stringify({ yearMonth }),
    });
  }

  async toggleDriverRoster(yearMonth: string, driverId: string, isActive: boolean) {
    return this.request<any>(`/roster/${yearMonth}/${driverId}/toggle`, {
      method: 'PUT',
      body: JSON.stringify({ isActive }),
    });
  }

  // Audit
  async getAuditLogs(params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<any>(`/audit${qs}`);
  }
}

export const api = new ApiClient();
