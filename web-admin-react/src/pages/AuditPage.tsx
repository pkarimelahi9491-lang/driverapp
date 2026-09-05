import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ClipboardList, Filter } from 'lucide-react';
import type { AuditLog } from '../types';

const actionColors: Record<string, string> = {
  LOGIN: 'bg-blue-100 text-blue-700',
  CREATE_DRIVER: 'bg-green-100 text-green-700',
  UPDATE_DRIVER: 'bg-amber-100 text-amber-700',
  TOGGLE_DRIVER_STATUS: 'bg-red-100 text-red-700',
  CREATE_ROUTE: 'bg-blue-100 text-blue-700',
  UPDATE_ROUTE_PRICE: 'bg-purple-100 text-purple-700',
  IMPORT_CSV_ROUTES: 'bg-cyan-100 text-cyan-700',
  REGISTER_TRIP: 'bg-green-100 text-green-700',
  DELETE_TRIP: 'bg-red-100 text-red-700',
  SUBMIT_FOR_APPROVAL: 'bg-amber-100 text-amber-700',
  APPROVE_DAILY_WORK: 'bg-green-100 text-green-700',
  REJECT_DAILY_WORK: 'bg-red-100 text-red-700',
  UNLOCK_DAILY_WORK: 'bg-orange-100 text-orange-700',
  UPDATE_FINANCIAL_STATUS: 'bg-purple-100 text-purple-700',
  INITIAL_SYSTEM_SETUP: 'bg-gray-100 text-gray-700',
};

const actionLabels: Record<string, string> = {
  LOGIN: 'ورود',
  CREATE_DRIVER: 'ایجاد راننده',
  UPDATE_DRIVER: 'ویرایش راننده',
  TOGGLE_DRIVER_STATUS: 'تغییر وضعیت راننده',
  CREATE_ROUTE: 'ایجاد مسیر',
  UPDATE_ROUTE_PRICE: 'تغییر نرخ مسیر',
  IMPORT_CSV_ROUTES: 'واردات CSV',
  REGISTER_TRIP: 'ثبت سفر',
  DELETE_TRIP: 'حذف سفر',
  SUBMIT_FOR_APPROVAL: 'ارسال جهت تأیید',
  APPROVE_DAILY_WORK: 'تأیید کارکرد',
  REJECT_DAILY_WORK: 'رد کارکرد',
  UNLOCK_DAILY_WORK: 'بازگشایی کارکرد',
  UPDATE_FINANCIAL_STATUS: 'تغییر وضعیت مالی',
  INITIAL_SYSTEM_SETUP: 'راه‌اندازی سیستم',
};

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => { loadLogs(); }, [actionFilter, roleFilter]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: '200' };
      if (actionFilter) params.action = actionFilter;
      if (roleFilter) params.operatorRole = roleFilter;
      const res = await api.getAuditLogs(params);
      setLogs(res.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">لاگ حسابرسی</h1>
        <p className="text-sm text-gray-500 mt-1">تمام عملیات حساس سیستم ثبت می‌شوند</p>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <Filter size={16} className="text-gray-400" />
          <select
            value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400"
          >
            <option value="">همه عملیات</option>
            {Object.entries(actionLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select
            value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400"
          >
            <option value="">همه نقش‌ها</option>
            <option value="ADMIN">مدیر</option>
            <option value="DRIVER">راننده</option>
            <option value="FINANCE">مالی</option>
          </select>
          {(actionFilter || roleFilter) && (
            <button onClick={() => { setActionFilter(''); setRoleFilter(''); }} className="px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-xl">پاک کردن</button>
          )}
        </div>
      </div>

      {/* Logs */}
      <div className="space-y-2">
        {loading ? (
          <div className="text-center py-10 text-gray-400">در حال بارگذاری...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-10 text-gray-400">لاگی یافت نشد</div>
        ) : logs.map((log) => (
          <div key={log.id} className="glass-card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                <ClipboardList size={16} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${actionColors[log.action] || 'bg-gray-100 text-gray-600'}`}>
                    {actionLabels[log.action] || log.action}
                  </span>
                  <span className="font-medium text-gray-800 text-sm">{log.entityTitle}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1 truncate">{log.details}</p>
              </div>
            </div>
            <div className="text-left shrink-0 sm:w-48">
              <p className="text-xs text-gray-500">{log.jalaliTimestamp}</p>
              <p className="text-xs text-gray-400 mt-0.5">{log.operatorName} ({log.operatorRole})</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
