import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import {
  Users, Car, MapPin, Wallet, Clock, CheckCircle,
  AlertTriangle, TrendingUp, ArrowUpLeft
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ drivers: 0, activeDrivers: 0, routes: 0, todayTrips: 0, monthTrips: 0, pendingApprovals: 0 });
  const [recentTrips, setRecentTrips] = useState<any[]>([]);
  const [routeDistribution, setRouteDistribution] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [driversRes, routesRes, tripsRes, dailyWorkRes] = await Promise.all([
        api.getDrivers({ limit: '1000' }),
        api.getRoutes({ limit: '1000' }),
        api.getTrips({ limit: '20' }),
        api.getDailyWorks({ status: 'PENDING_APPROVAL', limit: '100' }),
      ]);

      const drivers = driversRes.data || [];
      const routes = routesRes.data || [];
      const trips = tripsRes.data || [];

      // Calculate today's date in a simple way
      const now = new Date();
      const todayStr = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
      const monthPrefix = todayStr.substring(0, 7);

      const todayTrips = trips.filter((t: any) => t.tripJalaliDate === todayStr);
      const monthTrips = trips.filter((t: any) => t.tripJalaliDate?.startsWith(monthPrefix));

      // Route distribution
      const routeCount: Record<string, number> = {};
      trips.forEach((t: any) => {
        const code = t.routeCode || 'نامشخص';
        routeCount[code] = (routeCount[code] || 0) + 1;
      });
      const distData = Object.entries(routeCount)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 7);

      setStats({
        drivers: drivers.length,
        activeDrivers: drivers.filter((d: any) => d.isActive).length,
        routes: routes.length,
        todayTrips: todayTrips.length,
        monthTrips: monthTrips.length,
        pendingApprovals: (dailyWorkRes.data || []).length,
      });
      setRecentTrips(trips.slice(0, 8));
      setRouteDistribution(distData);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">در حال بارگذاری داشبورد...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'رانندگان فعال', value: stats.activeDrivers, total: stats.drivers, icon: Users, color: 'blue', link: '/drivers' },
    { label: 'مسیرهای تعریف‌شده', value: stats.routes, icon: MapPin, color: 'amber', link: '/routes' },
    { label: 'سفرهای امروز', value: stats.todayTrips, icon: Car, color: 'green', link: '/trips' },
    { label: 'کارکردهای در انتظار', value: stats.pendingApprovals, icon: Clock, color: stats.pendingApprovals > 0 ? 'red' : 'green', link: '/daily-work' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">داشبورد مدیریت</h1>
        <p className="text-sm text-gray-500 mt-1">نمای کلی از وضعیت ناوگان و عملیات روزانه</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          const colorMap: Record<string, string> = {
            blue: 'bg-blue-50 text-blue-600',
            amber: 'bg-amber-50 text-amber-600',
            green: 'bg-green-50 text-green-600',
            red: 'bg-red-50 text-red-600',
          };
          return (
            <button
              key={card.label}
              onClick={() => navigate(card.link)}
              className="glass-card-hover p-5 text-right"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {card.value.toLocaleString('fa-IR')}
                    {card.total !== undefined && (
                      <span className="text-sm font-normal text-gray-400 mr-1">/ {card.total.toLocaleString('fa-IR')}</span>
                    )}
                  </p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[card.color]}`}>
                  <Icon size={20} />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Route Distribution Pie */}
        <div className="glass-card p-5">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-blue-500" />
            توزیع سفرها بر اساس مسیر
          </h3>
          {routeDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={routeDistribution} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                  {routeDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-10">داده‌ای موجود نیست</p>
          )}
        </div>

        {/* Recent Trips */}
        <div className="glass-card p-5">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Car size={18} className="text-green-500" />
            آخرین سفرهای ثبت‌شده
          </h3>
          <div className="space-y-2 max-h-[250px] overflow-y-auto">
            {recentTrips.length === 0 && (
              <p className="text-gray-400 text-center py-10">سفری ثبت نشده</p>
            )}
            {recentTrips.map((trip: any) => (
              <div key={trip.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-xl text-sm">
                <div>
                  <p className="font-medium text-gray-800">{trip.routeCode}</p>
                  <p className="text-xs text-gray-500">{trip.originTitle} ← {trip.destinationTitle}</p>
                </div>
                <div className="text-left">
                  <p className="font-bold text-green-600">{Number(trip.snapshotPrice).toLocaleString('fa-IR')} ت</p>
                  <p className="text-xs text-gray-400">{trip.tripJalaliDate}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="glass-card p-5">
        <h3 className="font-bold text-gray-900 mb-4">دسترسی‌های سریع</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'تأیید کارکرد', icon: CheckCircle, color: 'green', path: '/daily-work' },
            { label: 'گزارش مالی', icon: Wallet, color: 'amber', path: '/finance' },
            { label: 'مدیریت مسیرها', icon: MapPin, color: 'blue', path: '/routes' },
            { label: 'لاگ حسابرسی', icon: AlertTriangle, color: 'red', path: '/audit' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm font-medium text-gray-700 transition-colors"
              >
                <Icon size={16} className={`text-${item.color}-500`} />
                {item.label}
                <ArrowUpLeft size={14} className="mr-auto text-gray-400" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
