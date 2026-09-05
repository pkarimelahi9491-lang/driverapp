import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { ArrowRight, Car, Wallet, Calendar, MapPin } from 'lucide-react';
import type { Driver, Trip } from '../types';

export default function DriverDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      Promise.all([
        api.getDriver(id),
        api.getDriverTrips(id, { limit: '50' }),
      ]).then(([driverRes, tripsRes]) => {
        setDriver(driverRes.data);
        setTrips(tripsRes.data || []);
      }).catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!driver) return <div className="text-center py-10 text-gray-500">راننده یافت نشد</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/drivers')} className="p-2 hover:bg-gray-100 rounded-xl"><ArrowRight size={20} /></button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{driver.fullName}</h1>
          <p className="text-sm text-gray-500">{driver.driverCode} | {driver.personnelCode}</p>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Car size={16} className="text-blue-500" /> مشخصات خودرو</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">خودرو:</span><span className="font-medium">{driver.carModel}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">پلاک:</span><span className="font-medium">{driver.carPlate}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">تلفن:</span><span className="font-medium">{driver.phoneNumber}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">تاریخ شروع:</span><span className="font-medium">{driver.joinDateJalali}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">وضعیت:</span>
              <span className={`font-medium ${driver.isActive ? 'text-green-600' : 'text-red-600'}`}>{driver.isActive ? 'فعال' : 'غیرفعال'}</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Wallet size={16} className="text-green-500" /> آمار عملکرد</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-blue-700">{driver.stats?.todayTrips || 0}</p>
              <p className="text-xs text-blue-500 mt-1">سفر امروز</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-green-700">{Number(driver.stats?.todayIncome || 0).toLocaleString('fa-IR')}</p>
              <p className="text-xs text-green-500 mt-1">درآمد امروز (تومان)</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-amber-700">{driver.stats?.monthlyTrips || 0}</p>
              <p className="text-xs text-amber-500 mt-1">سفر ماه جاری</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-purple-700">{Number(driver.stats?.monthlyIncome || 0).toLocaleString('fa-IR')}</p>
              <p className="text-xs text-purple-500 mt-1">درآمد ماه (تومان)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Trip History */}
      <div className="glass-card p-5">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><MapPin size={16} className="text-amber-500" /> سابقه سفرها</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-right px-3 py-2 font-medium text-gray-500">کد سفر</th>
                <th className="text-right px-3 py-2 font-medium text-gray-500">تاریخ</th>
                <th className="text-right px-3 py-2 font-medium text-gray-500">مسیر</th>
                <th className="text-right px-3 py-2 font-medium text-gray-500">ساعت</th>
                <th className="text-right px-3 py-2 font-medium text-gray-500">مبلغ</th>
              </tr>
            </thead>
            <tbody>
              {trips.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">سفری ثبت نشده</td></tr>
              ) : trips.map((t) => (
                <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-3 py-2 font-mono text-xs text-gray-600">{t.tripCode}</td>
                  <td className="px-3 py-2">{t.tripJalaliDate}</td>
                  <td className="px-3 py-2">
                    <span className="text-gray-800">{t.originTitle}</span>
                    <span className="text-gray-400 mx-1">←</span>
                    <span className="text-gray-800">{t.destinationTitle}</span>
                  </td>
                  <td className="px-3 py-2 text-gray-600">{t.startTime}{t.endTime ? ` - ${t.endTime}` : ''}</td>
                  <td className="px-3 py-2 font-bold text-green-600">{Number(t.snapshotPrice).toLocaleString('fa-IR')} ت</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
