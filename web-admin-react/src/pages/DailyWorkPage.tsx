import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { CheckCircle, XCircle, Unlock, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import type { DailyWorkLog } from '../types';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  PENDING_APPROVAL: 'bg-amber-50 text-amber-700 border border-amber-200',
  FINALIZED: 'bg-green-50 text-green-700 border border-green-200',
  REJECTED: 'bg-red-50 text-red-700 border border-red-200',
};

const statusLabels: Record<string, string> = {
  DRAFT: 'پیش‌نویس',
  PENDING_APPROVAL: 'در انتظار تأیید',
  FINALIZED: 'تأیید شده',
  REJECTED: 'رد شده',
};

export default function DailyWorkPage() {
  const [works, setWorks] = useState<DailyWorkLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING_APPROVAL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string; reason: string } | null>(null);

  useEffect(() => { loadWorks(); }, [statusFilter]);

  const loadWorks = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: '200' };
      if (statusFilter) params.status = statusFilter;
      const res = await api.getDailyWorks(params);
      setWorks(res.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleApprove = async (id: string) => {
    if (!confirm('آیا از تأیید این کارکرد اطمینان دارید؟')) return;
    try { await api.approveDailyWork(id); loadWorks(); }
    catch (err: any) { alert(err.message); }
  };

  const handleReject = async () => {
    if (!rejectModal || !rejectModal.reason) return;
    try { await api.rejectDailyWork(rejectModal.id, rejectModal.reason); setRejectModal(null); loadWorks(); }
    catch (err: any) { alert(err.message); }
  };

  const handleUnlock = async (id: string) => {
    if (!confirm('آیا می‌خواهید این کارکرد را بازگشایی کنید؟')) return;
    try { await api.unlockDailyWork(id); loadWorks(); }
    catch (err: any) { alert(err.message); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">تأیید کارکرد روزانه</h1>
        <p className="text-sm text-gray-500 mt-1">بررسی و تأیید/رد کارکرد روزانه رانندگان</p>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { value: 'PENDING_APPROVAL', label: 'در انتظار تأیید', icon: Clock },
          { value: '', label: 'همه', icon: null },
          { value: 'FINALIZED', label: 'تأیید شده', icon: CheckCircle },
          { value: 'REJECTED', label: 'رد شده', icon: XCircle },
          { value: 'DRAFT', label: 'پیش‌نویس', icon: null },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                statusFilter === tab.value ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {Icon && <Icon size={14} />}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Work logs */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-10 text-gray-400">در حال بارگذاری...</div>
        ) : works.length === 0 ? (
          <div className="text-center py-10 text-gray-400">موردی یافت نشد</div>
        ) : works.map((w) => (
          <div key={w.id} className="glass-card overflow-hidden">
            {/* Header */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => setExpandedId(expandedId === w.id ? null : w.id)} className="text-gray-400 hover:text-gray-600">
                  {expandedId === w.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                <div>
                  <p className="font-bold text-gray-800">{w.driverName || w.driverCode} <span className="text-sm font-normal text-gray-400">({w.driverCode})</span></p>
                  <p className="text-xs text-gray-500 mt-0.5">{w.jalaliDate}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-left">
                  <p className="font-bold text-green-600">{Number(w.totalIncome).toLocaleString('fa-IR')} تومان</p>
                  <p className="text-xs text-gray-500">{w.totalTrips} سفر</p>
                </div>
                <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${statusColors[w.status]}`}>
                  {statusLabels[w.status]}
                </span>
              </div>
            </div>

            {/* Expanded details */}
            {expandedId === w.id && (
              <div className="border-t border-gray-100 p-4 bg-gray-50/50">
                {w.trips && w.trips.length > 0 ? (
                  <div className="space-y-2 mb-4">
                    {w.trips.map((trip: any) => (
                      <div key={trip.id} className="flex items-center justify-between py-2 px-3 bg-white rounded-xl text-sm">
                        <div>
                          <span className="font-mono text-xs text-gray-500">{trip.routeCode}</span>
                          <span className="mx-2 text-gray-300">|</span>
                          <span>{trip.originTitle} ← {trip.destinationTitle}</span>
                        </div>
                        <span className="font-bold text-green-600">{Number(trip.snapshotPrice).toLocaleString('fa-IR')} ت</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 mb-4">سفری ثبت نشده</p>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  {w.status === 'PENDING_APPROVAL' && (
                    <>
                      <button onClick={() => handleApprove(w.id)} className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition-colors">
                        <CheckCircle size={14} /> تأیید
                      </button>
                      <button onClick={() => setRejectModal({ id: w.id, reason: '' })} className="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-medium transition-colors">
                        <XCircle size={14} /> رد
                      </button>
                    </>
                  )}
                  {(w.status === 'FINALIZED' || w.status === 'REJECTED') && (
                    <button onClick={() => handleUnlock(w.id)} className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-xl text-sm font-medium transition-colors">
                      <Unlock size={14} /> بازگشایی
                    </button>
                  )}
                </div>

                {w.rejectionReason && (
                  <div className="mt-3 px-3 py-2 bg-red-50 rounded-xl text-sm text-red-600">
                    <span className="font-medium">دلیل رد:</span> {w.rejectionReason}
                  </div>
                )}
                {w.approvedBy && (
                  <p className="mt-2 text-xs text-gray-400">تأیید/رد شده توسط: {w.approvedBy}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setRejectModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4 text-red-600">رد کارکرد</h3>
            <label className="block text-sm font-medium text-gray-600 mb-1">دلیل رد</label>
            <textarea
              value={rejectModal.reason} onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
              rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400"
              placeholder="دلیل رد کارکرد را بنویسید..."
            />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setRejectModal(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl">انصراف</button>
              <button onClick={handleReject} disabled={!rejectModal.reason} className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-xl disabled:opacity-50">رد کارکرد</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
