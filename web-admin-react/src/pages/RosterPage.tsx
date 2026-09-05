import { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Users, Calculator, CheckCircle, Filter, TrendingUp,
  ArrowDown, ArrowUp, Clock, Wallet, ChevronDown, ChevronUp
} from 'lucide-react';

interface RosterEntry {
  driverId: string;
  driverCode: string;
  fullName: string;
  personnelCode: string;
  phoneNumber: string;
  carModel: string;
  isActive: boolean;
  username: string;
  monthlyStats: {
    totalTrips: number;
    totalIncome: number;
    workingDays: number;
    finalizedDays: number;
    pendingDays: number;
    draftDays: number;
  };
}

export default function RosterPage() {
  const [yearMonth, setYearMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [summary, setSummary] = useState({ totalDrivers: 0, activeDrivers: 0, totalTrips: 0, totalIncome: 0 });
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => { loadRoster(); }, [yearMonth]);

  const loadRoster = async () => {
    setLoading(true);
    try {
      const res = await api.request(`/roster/${yearMonth}`) as any;
      setRoster(res.data?.roster || []);
      setSummary(res.data?.summary || { totalDrivers: 0, activeDrivers: 0, totalTrips: 0, totalIncome: 0 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoCalculate = async () => {
    if (!confirm(`آیا می‌خواهید کارکرد تمام رانندگان ماه ${yearMonth} را محاسبه کنید؟\n\nتمام کارکردهای پیش‌نویس و در انتظار تأیید، محاسبه و ارسال می‌شوند.`)) return;

    setCalculating(true);
    try {
      const res = await api.request('/roster/calculate', {
        method: 'POST',
        body: JSON.stringify({ yearMonth }),
      }) as any;
      alert(res.message || 'محاسبه انجام شد');
      loadRoster();
    } catch (err: any) {
      alert(err.message || 'خطا در محاسبه');
    } finally {
      setCalculating(false);
    }
  };

  const handleBulkFinalize = async () => {
    if (!confirm(`آیا می‌خواهید تمام کارکردهای در انتظار تأیید ماه ${yearMonth} را نهایی کنید؟`)) return;

    try {
      const res = await api.request('/roster/bulk-finalize', {
        method: 'POST',
        body: JSON.stringify({ yearMonth }),
      }) as any;
      alert(res.message || 'نهایی‌سازی انجام شد');
      loadRoster();
    } catch (err: any) {
      alert(err.message || 'خطا');
    }
  };

  const handleToggleDriver = async (driverId: string, currentStatus: boolean) => {
    try {
      await api.request(`/roster/${yearMonth}/${driverId}/toggle`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      loadRoster();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const activeDrivers = roster.filter(r => r.isActive);
  const inactiveDrivers = roster.filter(r => !r.isActive);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">مدیریت لیست رانندگان و محاسبه خودکار</h1>
          <p className="text-sm text-gray-500 mt-1">افزودن/کم کردن رانندگان و محاسبه خودکار کارکرد ماهانه</p>
        </div>
      </div>

      {/* Controls */}
      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <label className="text-sm font-medium text-gray-600">ماه:</label>
            <input
              type="month" value={yearMonth} onChange={(e) => setYearMonth(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

          <div className="flex items-center gap-2 mr-auto">
            <button
              onClick={handleAutoCalculate}
              disabled={calculating}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
            >
              {calculating ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Calculator size={16} />
              )}
              محاسبه خودکار کارکرد
            </button>
            <button
              onClick={handleBulkFinalize}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition-colors"
            >
              <CheckCircle size={16} />
              نهایی‌سازی دسته‌جمعی
            </button>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600"><Users size={18} /></div>
            <div>
              <p className="text-xs text-gray-500">رانندگان فعال</p>
              <p className="text-lg font-bold">{summary.activeDrivers} / {summary.totalDrivers}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600"><TrendingUp size={18} /></div>
            <div>
              <p className="text-xs text-gray-500">کل سفرها</p>
              <p className="text-lg font-bold">{summary.totalTrips.toLocaleString('fa-IR')}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600"><Wallet size={18} /></div>
            <div>
              <p className="text-xs text-gray-500">مجموع درآمد</p>
              <p className="text-lg font-bold">{summary.totalIncome.toLocaleString('fa-IR')} ت</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600"><Clock size={18} /></div>
            <div>
              <p className="text-xs text-gray-500">غیرفعال</p>
              <p className="text-lg font-bold text-red-600">{inactiveDrivers.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Roster Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-right px-4 py-3 font-medium text-gray-500">راننده</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">کد</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">خودرو</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">سفر ماه</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">درآمد ماه</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">روزهای کاری</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">وضعیت</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400">در حال بارگذاری...</td></tr>
              ) : roster.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400">راننده‌ای یافت نشد</td></tr>
              ) : roster.map((r) => (
                <tr key={r.driverId} className={`border-b border-gray-50 hover:bg-gray-50/50 ${!r.isActive ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-800">{r.fullName}</p>
                      <p className="text-xs text-gray-400">{r.personnelCode}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-gray-700">{r.driverCode}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{r.carModel}</td>
                  <td className="px-4 py-3 font-bold text-blue-600">{r.monthlyStats.totalTrips}</td>
                  <td className="px-4 py-3 font-bold text-green-600">{r.monthlyStats.totalIncome.toLocaleString('fa-IR')} ت</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {r.monthlyStats.finalizedDays > 0 && <span className="px-1.5 py-0.5 bg-green-50 text-green-600 rounded text-xs">{r.monthlyStats.finalizedDays} نهایی</span>}
                      {r.monthlyStats.pendingDays > 0 && <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded text-xs">{r.monthlyStats.pendingDays} در انتظار</span>}
                      {r.monthlyStats.draftDays > 0 && <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{r.monthlyStats.draftDays} پیش‌نویس</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${r.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {r.isActive ? 'فعال' : 'غیرفعال'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleDriver(r.driverId, r.isActive)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        r.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                    >
                      {r.isActive ? 'غیرفعال‌سازی' : 'فعال‌سازی'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            {roster.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50 font-bold">
                  <td colSpan={3} className="px-4 py-3 text-right">جمع کل</td>
                  <td className="px-4 py-3 text-blue-600">{summary.totalTrips}</td>
                  <td className="px-4 py-3 text-green-600">{summary.totalIncome.toLocaleString('fa-IR')} ت</td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Info Box */}
      <div className="glass-card p-4 bg-blue-50 border border-blue-200">
        <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2"><Calculator size={16} /> راهنمای محاسبه خودکار</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>محاسبه خودکار:</strong> تمام کارکردهای پیش‌نویس و در انتظار تأیید را محاسبه و ارسال می‌کند</li>
          <li>• <strong>نهایی‌سازی دسته‌جمعی:</strong> تمام کارکردهای در انتظار تأیید را تأیید و نهایی می‌کند</li>
          <li>• <strong>فعال/غیرفعال:</strong> با غیرفعال کردن راننده، دیگر امکان ثبت سفر جدید نخواهد داشت</li>
          <li>• <strong>محاسبه:</strong> ابتدا محاسبه خودکار، سپس نهایی‌سازی دسته‌جمعی را بزنید</li>
        </ul>
      </div>
    </div>
  );
}
