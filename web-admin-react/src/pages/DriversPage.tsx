import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Plus, Search, Edit2, UserCheck, UserX, Eye, Trash2 } from 'lucide-react';
import type { Driver } from '../types';

export default function DriversPage() {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editDriver, setEditDriver] = useState<Driver | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Driver | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ fullName: '', driverCode: '', personnelCode: '', phoneNumber: '', carModel: '', carPlate: '', joinDateJalali: '', description: '' });

  useEffect(() => { loadDrivers(); }, []);

  const loadDrivers = async () => {
    try {
      const res = await api.getDrivers({ limit: '1000', ...(search && { search }) });
      setDrivers(res.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSearch = async () => { setLoading(true); await loadDrivers(); };

  const openAdd = () => { setEditDriver(null); setForm({ fullName: '', driverCode: '', personnelCode: '', phoneNumber: '', carModel: '', carPlate: '', joinDateJalali: '', description: '' }); setShowModal(true); };

  const openEdit = (d: Driver) => {
    setEditDriver(d);
    setForm({ fullName: d.fullName, driverCode: d.driverCode, personnelCode: d.personnelCode, phoneNumber: d.phoneNumber, carModel: d.carModel, carPlate: d.carPlate, joinDateJalali: d.joinDateJalali, description: d.description });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editDriver) { await api.updateDriver(editDriver.id, form); }
      else { await api.createDriver(form); }
      setShowModal(false);
      loadDrivers();
    } catch (err: any) { alert(err.message); }
  };

  const handleToggle = async (id: string) => {
    try { await api.toggleDriver(id); loadDrivers(); }
    catch (err: any) { alert(err.message); }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      const res = await api.deleteDriver(deleteConfirm.id);
      alert(res.message || 'راننده حذف شد');
      setDeleteConfirm(null);
      loadDrivers();
    } catch (err: any) {
      alert(err.message || 'خطا در حذف راننده');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">مدیریت رانندگان</h1>
          <p className="text-sm text-gray-500 mt-1">{drivers.length} راننده در سیستم</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors">
          <Plus size={16} /> افزودن راننده
        </button>
      </div>

      {/* Search */}
      <div className="glass-card p-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pr-10 pl-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400"
              placeholder="جستجو بر اساس نام، کد راننده، کد پرسنلی..."
            />
          </div>
          <button onClick={handleSearch} className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium transition-colors">جستجو</button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-right px-4 py-3 font-medium text-gray-500">کد</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">نام</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">کد پرسنلی</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">خودرو</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">تلفن</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">وضعیت</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">در حال بارگذاری...</td></tr>
              ) : drivers.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">راننده‌ای یافت نشد</td></tr>
              ) : drivers.map((d) => (
                <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 font-bold text-gray-800">{d.driverCode}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => navigate(`/drivers/${d.id}`)} className="font-medium text-blue-600 hover:underline">{d.fullName}</button>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{d.personnelCode}</td>
                  <td className="px-4 py-3 text-gray-600">{d.carModel}</td>
                  <td className="px-4 py-3 text-gray-600">{d.phoneNumber}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${d.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${d.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                      {d.isActive ? 'فعال' : 'غیرفعال'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => navigate(`/drivers/${d.id}`)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600" title="مشاهده"><Eye size={15} /></button>
                      <button onClick={() => openEdit(d)} className="p-1.5 hover:bg-amber-50 rounded-lg text-amber-600" title="ویرایش"><Edit2 size={15} /></button>
                      <button onClick={() => handleToggle(d.id)} className={`p-1.5 hover:bg-gray-100 rounded-lg ${d.isActive ? 'text-red-500' : 'text-green-500'}`} title={d.isActive ? 'غیرفعال‌سازی' : 'فعال‌سازی'}>
                        {d.isActive ? <UserX size={15} /> : <UserCheck size={15} />}
                      </button>
                      <button onClick={() => setDeleteConfirm(d)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500" title="حذف">
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">{editDriver ? 'ویرایش راننده' : 'افزودن راننده جدید'}</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'fullName', label: 'نام و نام خانوادگی', span: 2 },
                { key: 'driverCode', label: 'کد راننده' },
                { key: 'personnelCode', label: 'کد پرسنلی' },
                { key: 'phoneNumber', label: 'تلفن' },
                { key: 'carModel', label: 'خودرو' },
                { key: 'carPlate', label: 'پلاک', span: 2 },
                { key: 'joinDateJalali', label: 'تاریخ شروع' },
                { key: 'description', label: 'توضیحات', span: 2 },
              ].map((field) => (
                <div key={field.key} className={field.span === 2 ? 'col-span-2' : ''}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{field.label}</label>
                  <input
                    value={(form as any)[field.key] || ''}
                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400"
                  />
                </div>
              ))}
            </div>
            {!editDriver && (
              <p className="text-xs text-blue-600 mt-3 flex items-center gap-1">
                ℹ️ نام کاربری خودکار از کد راننده ساخته می‌شود. رمز پیش‌فرض: <code className="bg-blue-50 px-1 rounded">123456</code>
              </p>
            )}
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">انصراف</button>
              <button onClick={handleSave} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors">ذخیره</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => !deleting && setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                <Trash2 size={24} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">حذف راننده</h3>
                <p className="text-sm text-gray-500">این عمل غیرقابل بازگشت است</p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-red-700">
                آیا مطمئنید راننده <strong>{deleteConfirm.fullName}</strong> ({deleteConfirm.driverCode}) را حذف کنید؟
              </p>
              <p className="text-xs text-red-600 mt-2">
                ⚠️ اگر راننده سفر یا کارکرد ثبت‌شده داشته باشد، حذف امکان‌پذیر نخواهد بود. در این صورت ابتدا راننده را غیرفعال کنید.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteConfirm(null)} disabled={deleting} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">انصراف</button>
              <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2">
                {deleting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Trash2 size={14} />}
                {deleting ? 'در حال حذف...' : 'حذف راننده'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
