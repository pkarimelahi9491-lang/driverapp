import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Car, Filter } from 'lucide-react';
import type { Trip } from '../types';

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => { loadTrips(); }, []);

  const loadTrips = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: '200' };
      if (dateFilter) params.date = dateFilter;
      const res = await api.getTrips(params);
      const data = res.data || [];
      setTrips(data);
      setTotalAmount(data.reduce((sum: number, t: Trip) => sum + Number(t.snapshotPrice), 0));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">لیست سفرها</h1>
          <p className="text-sm text-gray-500 mt-1">{trips.length} سفر | جمع: {totalAmount.toLocaleString('fa-IR')} تومان</p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex gap-3 items-center">
          <Filter size={16} className="text-gray-400" />
          <input
            type="text" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400"
            placeholder="تاریخ (مثال: 1405/06/01)"
          />
          <button onClick={loadTrips} className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium transition-colors">اعمال فیلتر</button>
          {dateFilter && (
            <button onClick={() => { setDateFilter(''); }} className="px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors">پاک کردن</button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-right px-4 py-3 font-medium text-gray-500">کد سفر</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">تاریخ</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">مسیر</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">کد مسیر</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">ساعت</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">مبلغ (تومان)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">در حال بارگذاری...</td></tr>
              ) : trips.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">سفری یافت نشد</td></tr>
              ) : trips.map((t) => (
                <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{t.tripCode}</td>
                  <td className="px-4 py-3">{t.tripJalaliDate}</td>
                  <td className="px-4 py-3">
                    <span>{t.originTitle}</span>
                    <span className="text-gray-400 mx-1">←</span>
                    <span>{t.destinationTitle}</span>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-blue-600">{t.routeCode}</td>
                  <td className="px-4 py-3 text-gray-600">{t.startTime}{t.endTime ? ` - ${t.endTime}` : ''}</td>
                  <td className="px-4 py-3 font-bold text-green-600">{Number(t.snapshotPrice).toLocaleString('fa-IR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
