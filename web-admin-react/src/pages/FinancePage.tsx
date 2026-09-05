import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import {
  Wallet,
  Download,
  Filter,
  FileText,
  FileSpreadsheet,
  Printer,
  ChevronDown
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const paymentStatusColors: Record<string, string> = {
  CALCULATING: 'bg-gray-100 text-gray-600',
  PENDING_APPROVAL: 'bg-amber-50 text-amber-700',
  APPROVED: 'bg-blue-50 text-blue-700',
  SENT_TO_FINANCE: 'bg-purple-50 text-purple-700',
  PAID: 'bg-green-50 text-green-700',
};

const paymentStatusLabels: Record<string, string> = {
  CALCULATING: 'محاسبه نشده',
  PENDING_APPROVAL: 'در انتظار تأیید',
  APPROVED: 'تأیید شده',
  SENT_TO_FINANCE: 'ارسال به مالی',
  PAID: 'پرداخت شده',
};

const paymentStatusFlow = [
  'PENDING_APPROVAL',
  'APPROVED',
  'SENT_TO_FINANCE',
  'PAID'
];

interface SettlementRow {
  driverId: string;
  driverName: string;
  driverCode: string;
  personnelCode: string;
  workingDaysCount: number;
  totalTripsCount: number;
  finalizedIncome: number;
  draftIncome: number;
  unfinalizedDaysCount: number;
}

export default function FinancePage() {
  const [yearMonth, setYearMonth] = useState(() => {
    const now = new Date();

    return `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, '0')}`;
  });

  const [rows, setRows] = useState<SettlementRow[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [currentStatus, setCurrentStatus] =
    useState('PENDING_APPROVAL');
  const [loading, setLoading] = useState(true);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadReport();
  }, [yearMonth]);

  const loadReport = async () => {
    setLoading(true);

    try {
      const res = await api.getMonthlyReport(yearMonth);

      setRows(res.data?.rows || []);
      setTotalAmount(res.data?.totalAmount || 0);
      setCurrentStatus(
        res.data?.period?.status || 'PENDING_APPROVAL'
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (
      !confirm(
        `آیا مطمئنید وضعیت را به "${paymentStatusLabels[newStatus]}" تغییر دهید؟`
      )
    ) {
      return;
    }

    try {
      await api.updateFinancialStatus(yearMonth, newStatus);
      setCurrentStatus(newStatus);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // ─── CSV Export ───
  const handleExportCsv = async () => {
    try {
      const csv = await api.exportCsv(yearMonth);

      const blob = new Blob(['\uFEFF' + csv], {
        type: 'text/csv;charset=utf-8;'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');

      a.href = url;
      a.download = `گزارش-مالی-${yearMonth}.csv`;
      a.click();

      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // ─── Excel Export ───
  const handleExportExcel = () => {
    const totalFinalized = rows.reduce(
      (sum, r) => sum + r.finalizedIncome,
      0
    );

    const totalDraft = rows.reduce(
      (sum, r) => sum + r.draftIncome,
      0
    );

    // FIX: Excel rows can contain both strings and numbers
    const wsData: (string | number)[][] = [
      ['گزارش کارکرد و تسویه‌حساب مالی رانندگان هلدینگ آرمان انتخاب'],
      [`دوره مالی: ${yearMonth}`],
      [`تاریخ خروجی: ${new Date().toLocaleDateString('fa-IR')}`],
      [],
      [
        'ردیف',
        'نام و نام خانوادگی',
        'کد راننده',
        'کد پرسنلی',
        'روز کاری',
        'تعداد سفر',
        'مبلغ تأیید شده',
        'مبلغ در انتظار',
        'جمع قابل پرداخت'
      ],
    ];

    rows.forEach((r, i) => {
      wsData.push([
        i + 1,
        r.driverName,
        r.driverCode,
        r.personnelCode,
        r.workingDaysCount,
        r.totalTripsCount,
        r.finalizedIncome,
        r.draftIncome,
        r.finalizedIncome + r.draftIncome,
      ]);
    });

    wsData.push([]);

    wsData.push([
      '',
      '',
      '',
      '',
      '',
      'جمع کل',
      totalFinalized,
      totalDraft,
      totalFinalized + totalDraft
    ]);

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    ws['!cols'] = [
      { wch: 6 },
      { wch: 22 },
      { wch: 12 },
      { wch: 14 },
      { wch: 10 },
      { wch: 10 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
    ];

    ws['!merges'] = [
      {
        s: { r: 0, c: 0 },
        e: { r: 0, c: 8 }
      },
      {
        s: { r: 1, c: 0 },
        e: { r: 1, c: 8 }
      },
      {
        s: { r: 2, c: 0 },
        e: { r: 2, c: 8 }
      },
    ];

    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      wb,
      ws,
      'گزارش مالی'
    );

    XLSX.writeFile(
      wb,
      `گزارش-مالی-${yearMonth}.xlsx`
    );
  };

  // ─── PDF Export ───
  const handleExportPdf = () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    doc.setFont('helvetica');

    const totalFinalized = rows.reduce(
      (sum, r) => sum + r.finalizedIncome,
      0
    );

    const totalDraft = rows.reduce(
      (sum, r) => sum + r.draftIncome,
      0
    );

    doc.setFontSize(16);

    doc.text(
      'Arman Entekhab Fleet - Monthly Financial Report',
      148,
      15,
      { align: 'center' }
    );

    doc.setFontSize(11);

    doc.text(
      `Period: ${yearMonth} | Status: ${
        paymentStatusLabels[currentStatus] || currentStatus
      }`,
      148,
      22,
      { align: 'center' }
    );

    doc.text(
      `Generated: ${new Date().toLocaleDateString('en-US')}`,
      148,
      28,
      { align: 'center' }
    );

    const tableData = rows.map((r, i) => [
      String(i + 1),
      r.driverName,
      r.driverCode,
      r.personnelCode,
      String(r.workingDaysCount),
      String(r.totalTripsCount),
      `${r.finalizedIncome.toLocaleString('en-US')} IRR`,
      `${r.draftIncome.toLocaleString('en-US')} IRR`,
      `${(
        r.finalizedIncome + r.draftIncome
      ).toLocaleString('en-US')} IRR`,
    ]);

    tableData.push([
      '',
      '',
      '',
      '',
      '',
      'TOTAL',
      `${totalFinalized.toLocaleString('en-US')} IRR`,
      `${totalDraft.toLocaleString('en-US')} IRR`,
      `${(
        totalFinalized + totalDraft
      ).toLocaleString('en-US')} IRR`,
    ]);

    (doc as any).autoTable({
      startY: 34,
      head: [[
        '#',
        'Driver Name',
        'Code',
        'Personnel',
        'Work Days',
        'Trips',
        'Approved (IRR)',
        'Pending (IRR)',
        'Total Payable'
      ]],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2
      },
      headStyles: {
        fillColor: [30, 64, 175],
        textColor: 255
      },
      footStyles: {
        fillColor: [243, 244, 246],
        textColor: [0, 0, 0],
        fontStyle: 'bold'
      },
      columnStyles: {
        6: { halign: 'right' },
        7: { halign: 'right' },
        8: {
          halign: 'right',
          fontStyle: 'bold'
        },
      },
    });

    doc.save(
      `arman-fleet-report-${yearMonth}.pdf`
    );
  };

  // ─── Print ───
  const handlePrint = () => {
    window.print();
  };

  const totalFinalized = rows.reduce(
    (sum, r) => sum + r.finalizedIncome,
    0
  );

  const totalDraft = rows.reduce(
    (sum, r) => sum + r.draftIncome,
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          گزارش مالی و تسویه‌حساب
        </h1>

        <p className="text-sm text-gray-500 mt-1">
          گزارش کارکرد و پرداخت رانندگان + خروجی چاپ و اکسل
        </p>
      </div>

      {/* Controls */}
      <div className="glass-card p-4 print:hidden">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />

            <label className="text-sm font-medium text-gray-600">
              دوره مالی:
            </label>

            <input
              type="month"
              value={yearMonth}
              onChange={(e) =>
                setYearMonth(e.target.value)
              }
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

          <div className="flex items-center gap-2 mr-auto">
            <span className="text-sm text-gray-500">
              وضعیت:
            </span>

            {paymentStatusFlow.map((status) => (
              <button
                key={status}
                onClick={() =>
                  handleStatusChange(status)
                }
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  currentStatus === status
                    ? paymentStatusColors[status] +
                      ' ring-2 ring-offset-1 ring-blue-400'
                    : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                }`}
              >
                {paymentStatusLabels[status]}
              </button>
            ))}
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
          <span className="text-sm font-medium text-gray-500 self-center ml-2">
            خروجی:
          </span>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-medium transition-colors"
          >
            <FileText size={13} />
            CSV
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-medium transition-colors"
          >
            <FileSpreadsheet size={13} />
            Excel
          </button>

          <button
            onClick={handleExportPdf}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-medium transition-colors"
          >
            <Download size={13} />
            PDF
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-xl text-xs font-medium transition-colors"
          >
            <Printer size={13} />
            پرینت
          </button>
        </div>
      </div>

      {/* Print-only Header */}
      <div className="hidden print:block text-center mb-4">
        <h1
          style={{
            fontSize: '18px',
            fontWeight: 'bold'
          }}
        >
          گزارش کارکرد و تسویه‌حساب مالی رانندگان
        </h1>

        <h2 style={{ fontSize: '14px' }}>
          هلدینگ آرمان انتخاب
        </h2>

        <p style={{ fontSize: '12px' }}>
          دوره مالی: {yearMonth} | تاریخ چاپ:{' '}
          {new Date().toLocaleDateString('fa-IR')}
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:grid-cols-3 print:gap-2">
        <div className="glass-card p-4">
          <p className="text-sm text-gray-500">
            مجموع تأیید شده
          </p>

          <p className="text-xl font-bold text-green-600 mt-1">
            {totalFinalized.toLocaleString('fa-IR')} تومان
          </p>
        </div>

        <div className="glass-card p-4">
          <p className="text-sm text-gray-500">
            مجموع در انتظار
          </p>

          <p className="text-xl font-bold text-amber-600 mt-1">
            {totalDraft.toLocaleString('fa-IR')} تومان
          </p>
        </div>

        <div className="glass-card p-4">
          <p className="text-sm text-gray-500">
            تعداد رانندگان
          </p>

          <p className="text-xl font-bold text-blue-600 mt-1">
            {rows.length} نفر
          </p>
        </div>
      </div>

      {/* Table */}
      <div
        className="glass-card overflow-hidden"
        ref={printRef}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm print:text-xs">
            <thead>
              <tr className="border-b border-gray-100 print:border-gray-400">
                <th className="text-right px-4 py-3 font-medium text-gray-500">
                  راننده
                </th>

                <th className="text-right px-4 py-3 font-medium text-gray-500">
                  کد
                </th>

                <th className="text-right px-4 py-3 font-medium text-gray-500">
                  کد پرسنلی
                </th>

                <th className="text-right px-4 py-3 font-medium text-gray-500">
                  روز کاری
                </th>

                <th className="text-right px-4 py-3 font-medium text-gray-500">
                  تعداد سفر
                </th>

                <th className="text-right px-4 py-3 font-medium text-gray-500">
                  مبلغ تأیید شده
                </th>

                <th className="text-right px-4 py-3 font-medium text-gray-500">
                  مبلغ در انتظار
                </th>

                <th className="text-right px-4 py-3 font-medium text-gray-500 print:hidden">
                  جمع قابل پرداخت
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center py-10 text-gray-400"
                  >
                    در حال بارگذاری...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center py-10 text-gray-400"
                  >
                    داده‌ای موجود نیست
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr
                    key={r.driverId}
                    className="border-b border-gray-50 hover:bg-gray-50/50 print:hover:bg-white"
                  >
                    <td className="px-4 py-3 font-medium">
                      <span className="print:hidden">
                        {r.driverName}
                      </span>

                      <span className="hidden print:inline">
                        {r.driverName}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-mono text-gray-600">
                      {r.driverCode}
                    </td>

                    <td className="px-4 py-3 text-gray-600">
                      {r.personnelCode}
                    </td>

                    <td className="px-4 py-3 text-gray-600">
                      {r.workingDaysCount} روز
                    </td>

                    <td className="px-4 py-3 text-gray-600">
                      {r.totalTripsCount} سفر
                    </td>

                    <td className="px-4 py-3 font-bold text-green-600">
                      {r.finalizedIncome.toLocaleString(
                        'fa-IR'
                      )}{' '}
                      ت
                    </td>

                    <td className="px-4 py-3 font-bold text-amber-600">
                      {r.draftIncome.toLocaleString(
                        'fa-IR'
                      )}{' '}
                      ت
                    </td>

                    <td className="px-4 py-3 font-bold text-blue-700 print:hidden">
                      {(
                        r.finalizedIncome +
                        r.draftIncome
                      ).toLocaleString('fa-IR')}{' '}
                      ت
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {rows.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50 font-bold print:bg-gray-200">
                  <td
                    colSpan={5}
                    className="px-4 py-3 text-right"
                  >
                    جمع کل
                  </td>

                  <td className="px-4 py-3 text-green-600">
                    {totalFinalized.toLocaleString(
                      'fa-IR'
                    )}{' '}
                    ت
                  </td>

                  <td className="px-4 py-3 text-amber-600">
                    {totalDraft.toLocaleString(
                      'fa-IR'
                    )}{' '}
                    ت
                  </td>

                  <td className="px-4 py-3 text-blue-700 print:hidden">
                    {(
                      totalFinalized +
                      totalDraft
                    ).toLocaleString('fa-IR')}{' '}
                    ت
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Print Footer */}
      <div className="hidden print:block mt-8 text-center text-xs text-gray-500 border-t pt-4">
        <p>
          هلدینگ آرمان انتخاب — گزارش مالی دوره {yearMonth}
        </p>

        <p>
          این گزارش به صورت خودکار توسط سیستم مدیریت
          کارکرد تولید شده است.
        </p>
      </div>
    </div>
  );
}
