import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Search, Plus, Edit2, DollarSign, Upload, Trash2, Power, History, X } from 'lucide-react';

interface RouteItem {
  id: string;
  routeCode: string;
  originId: number;
  destinationId: number;
  currentPrice: number;
  distanceKm: number;
  isActive: boolean;
  description: string;
  origin?: { id: number; name: string; city: string };
  destination?: { id: number; name: string; city: string };
}

interface Location {
  id: number;
  name: string;
  city: string;
}

export default function RoutesPage() {
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);

  const [selectedRoute, setSelectedRoute] = useState<RouteItem | null>(null);
  const [newPrice, setNewPrice] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [csvText, setCsvText] = useState('');

  // Add form
  const [addForm, setAddForm] = useState({
    routeCode: '', originId: '', destinationId: '', currentPrice: '', distanceKm: '', ratePerKm: '', description: ''
  });

  useEffect(() => { loadRoutes(); loadLocations(); }, []);

  const loadRoutes = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: '1000' };
      if (search) params.search = search;
      const res = await api.getRoutes(params);
      setRoutes(res.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadLocations = async () => {
    try {
      const res = await api.getLocations({ limit: '1000' });
      setLocations(res.data || []);
    } catch (err) { console.error(err); }
  };

  // ─── Price Update ───
  const openPriceModal = (route: RouteItem) => {
    setSelectedRoute(route);
    setNewPrice(String(route.currentPrice));
    setShowPriceModal(true);
  };

  const handlePriceUpdate = async () => {
    if (!selectedRoute || !newPrice) return;
    try {
      await api.updateRoutePrice(selectedRoute.id, parseInt(newPrice));
      setShowPriceModal(false);
      loadRoutes();
    } catch (err: any) { alert(err.message); }
  };

  // ─── Toggle ───
  const handleToggle = async (route: RouteItem) => {
    try {
      await api.toggleRoute(route.id);
      loadRoutes();
    } catch (err: any) { alert(err.message); }
  };

  // ─── Delete ───
  const openDeleteModal = (route: RouteItem) => {
    setSelectedRoute(route);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!selectedRoute) return;
    setDeleting(true);
    try {
      const res = await api.deleteRoute(selectedRoute.id);
      alert(res.message || 'مسیر حذف شد');
      setShowDeleteModal(false);
      loadRoutes();
    } catch (err: any) {
      alert(err.message || 'خطا در حذف مسیر');
    } finally {
      setDeleting(false);
    }
  };

  // ─── Price History ───
  const openHistoryModal = async (route: RouteItem) => {
    setSelectedRoute(route);
    try {
      const res = await api.getRoutePriceHistory(route.id);
      setPriceHistory(res.data || []);
    } catch (err: any) { setPriceHistory([]); }
    setShowHistoryModal(true);
  };

  // ─── Add Route ───
  const openAddModal = () => {
    setAddForm({ routeCode: '', originId: '', destinationId: '', currentPrice: '', distanceKm: '', ratePerKm: '', description: '' });
    setShowAddModal(true);
  };

  const handleAddRoute = async () => {
    try {
      if (!addForm.routeCode || !addForm.originId || !addForm.destinationId || !addForm.currentPrice) {
        alert('فیلدهای کد مسیر، مبدأ، مقصد و نرخ الزامی هستند');
        return;
      }
      await api.createRoute(addForm);
      setShowAddModal(false);
      loadRoutes();
    } catch (err: any) { alert(err.message); }
  };

  // ─── CSV Sync ───
  const handleSyncCsv = async () => {
    try {
      const res = await api.syncCsvRoutes(csvText || undefined);
      alert(res.message || 'همگام‌سازی انجام شد');
      setShowCsvModal(false);
      loadRoutes();
    } catch (err: any) { alert(err.message); }
  };

  const totalRoutes = routes.length;
  const activeRoutes = routes.filter(r => r.isActive).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">مدیریت مسیرها و نرخ‌ها</h1>
          <p className="text-sm text-gray-500 mt-1">{activeRoutes} مسیر فعال از {totalRoutes} مسیر</p>
        </div>
        <div className="flex gap-2">
          <button onClick={openAddModal} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors">
            <Plus size={16} /> افزودن مسیر
          </button>
          <button onClick={() => setShowCsvModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium transition-colors">
            <Upload size={16} /> همگام‌سازی CSV
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="glass-card p-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadRoutes()}
              className="w-full pr-10 pl-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400"
              placeholder="جستجو بر اساس کد مسیر، مبدأ یا مقصد..."
            />
          </div>
          <button onClick={loadRoutes} className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium transition-colors">جستجو</button>
        </div>
      </div>

      {/* Routes Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-right px-4 py-3 font-medium text-gray-500">کد مسیر</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">مبدأ</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">مقصد</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">مسافت</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">نرخ (تومان)</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">وضعیت</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">در حال بارگذاری...</td></tr>
              ) : routes.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">مسیری یافت نشد</td></tr>
              ) : routes.slice(0, 200).map((r) => (
                <tr key={r.id} className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${!r.isActive ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3 font-mono font-bold text-gray-800">{r.routeCode}</td>
                  <td className="px-4 py-3 text-gray-700">{r.origin?.name || `#${r.originId}`}</td>
                  <td className="px-4 py-3 text-gray-700">{r.destination?.name || `#${r.destinationId}`}</td>
                  <td className="px-4 py-3 text-gray-500">{r.distanceKm} کیلومتر</td>
                  <td className="px-4 py-3 font-bold text-green-600">{Number(r.currentPrice).toLocaleString('fa-IR')}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${r.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {r.isActive ? 'فعال' : 'غیرفعال'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openPriceModal(r)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600" title="تغییر نرخ">
                        <DollarSign size={15} />
                      </button>
                      <button onClick={() => openHistoryModal(r)} className="p-1.5 hover:bg-purple-50 rounded-lg text-purple-600" title="تاریخچه نرخ">
                        <History size={15} />
                      </button>
                      <button onClick={() => handleToggle(r)} className={`p-1.5 hover:bg-gray-100 rounded-lg ${r.isActive ? 'text-red-500' : 'text-green-500'}`} title={r.isActive ? 'غیرفعال‌سازی' : 'فعال‌سازی'}>
                        <Power size={15} />
                      </button>
                      <button onClick={() => openDeleteModal(r)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500" title="حذف مسیر">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══ Add Route Modal ═══ */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Plus size={18} className="text-blue-600" /> افزودن مسیر جدید</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">کد مسیر (مثال: AR-16-01)</label>
                <input value={addForm.routeCode} onChange={(e) => setAddForm({ ...addForm, routeCode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 font-mono" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">مبدأ</label>
                <select value={addForm.originId} onChange={(e) => setAddForm({ ...addForm, originId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 bg-white">
                  <option value="">انتخاب مبدأ...</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">مقصد</label>
                <select value={addForm.destinationId} onChange={(e) => setAddForm({ ...addForm, destinationId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 bg-white">
                  <option value="">انتخاب مقصد...</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">نرخ (تومان)</label>
                <input type="number" value={addForm.currentPrice} onChange={(e) => setAddForm({ ...addForm, currentPrice: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400" placeholder="مثال: 250000" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">مسافت (کیلومتر)</label>
                <input type="number" value={addForm.distanceKm} onChange={(e) => setAddForm({ ...addForm, distanceKm: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400" placeholder="اختیاری" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">توضیحات</label>
                <input value={addForm.description} onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400" placeholder="اختیاری" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl">انصراف</button>
              <button onClick={handleAddRoute} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-2">
                <Plus size={14} /> افزودن مسیر
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Price Modal ═══ */}
      {showPriceModal && selectedRoute && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowPriceModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">تغییر نرخ مصوب مسیر</h3>
            <div className="bg-gray-50 rounded-xl p-4 mb-4 text-sm">
              <p><span className="text-gray-500">کد مسیر:</span> <span className="font-bold">{selectedRoute.routeCode}</span></p>
              <p><span className="text-gray-500">مسیر:</span> {selectedRoute.origin?.name} ← {selectedRoute.destination?.name}</p>
              <p><span className="text-gray-500">نرخ فعلی:</span> <span className="font-bold text-green-600">{Number(selectedRoute.currentPrice).toLocaleString('fa-IR')} تومان</span></p>
            </div>
            <label className="block text-sm font-medium text-gray-600 mb-1">نرخ جدید (تومان)</label>
            <input
              type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-lg font-bold focus:outline-none focus:border-blue-400"
            />
            <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">⚠️ تغییر نرخ روی سفرهای قبلی تأثیری ندارد (Price Snapshot)</p>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowPriceModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl">انصراف</button>
              <button onClick={handlePriceUpdate} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-xl">ذخیره نرخ جدید</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Delete Confirmation Modal ═══ */}
      {showDeleteModal && selectedRoute && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => !deleting && setShowDeleteModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                <Trash2 size={24} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">حذف مسیر</h3>
                <p className="text-sm text-gray-500">این عمل غیرقابل بازگشت است</p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-red-700">
                آیا مطمئنید مسیر <strong>{selectedRoute.routeCode}</strong> را حذف کنید؟
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {selectedRoute.origin?.name} ← {selectedRoute.destination?.name}
              </p>
              <p className="text-sm text-gray-600">
                نرخ: {Number(selectedRoute.currentPrice).toLocaleString('fa-IR')} تومان
              </p>
              <p className="text-xs text-red-600 mt-2">
                ⚠️ اگر مسیر سفر ثبت‌شده داشته باشد، حذف امکان‌پذیر نخواهد بود. در این صورت مسیر را غیرفعال کنید.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowDeleteModal(false)} disabled={deleting} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl">انصراف</button>
              <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-xl disabled:opacity-50 flex items-center gap-2">
                {deleting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Trash2 size={14} />}
                {deleting ? 'در حال حذف...' : 'حذف مسیر'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Price History Modal ═══ */}
      {showHistoryModal && selectedRoute && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowHistoryModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2"><History size={18} className="text-purple-600" /> تاریخچه نرخ مصوب</h3>
              <button onClick={() => setShowHistoryModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm">
              <p><span className="text-gray-500">کد مسیر:</span> <span className="font-bold">{selectedRoute.routeCode}</span></p>
              <p><span className="text-gray-500">مسیر:</span> {selectedRoute.origin?.name} ← {selectedRoute.destination?.name}</p>
            </div>

            {priceHistory.length === 0 ? (
              <p className="text-center py-6 text-gray-400">تاریخچه‌ای موجود نیست</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-right px-3 py-2 font-medium text-gray-500">نرخ قبلی</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-500">نرخ جدید</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-500">تاریخ اثرگذاری</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-500">تغییردهنده</th>
                  </tr>
                </thead>
                <tbody>
                  {priceHistory.map((h, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="px-3 py-2 text-red-500 line-through">{Number(h.oldPrice).toLocaleString('fa-IR')}</td>
                      <td className="px-3 py-2 font-bold text-green-600">{Number(h.newPrice).toLocaleString('fa-IR')}</td>
                      <td className="px-3 py-2 text-gray-600">{h.effectiveDate}</td>
                      <td className="px-3 py-2 text-gray-500">{h.changedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ═══ CSV Modal ═══ */}
      {showCsvModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCsvModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">همگام‌سازی مسیرها از CSV</h3>
            <p className="text-sm text-gray-500 mb-3">در صورت خالی گذاشتن فیلد، دیتای پیش‌فرض هلدینگ اعمال می‌شود.</p>
            <textarea
              value={csvText} onChange={(e) => setCsvText(e.target.value)}
              rows={6} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:border-blue-400"
              placeholder="متن CSV را اینجا وارد کنید..."
            />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowCsvModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl">انصراف</button>
              <button onClick={handleSyncCsv} className="px-4 py-2 text-sm bg-amber-500 hover:bg-amber-600 text-white rounded-xl">همگام‌سازی</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
