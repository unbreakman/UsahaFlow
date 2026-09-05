"use client";

import { useCallback, useEffect, useState } from "react";
import Navbar from "@/components/Navbar";

interface MonthData {
  month: number;
  qty: number;
  omzet: number;
  modal: number;
  profit: number;
  target_qty: number | null;
}

interface YearlyData {
  year: number;
  months: MonthData[];
  summary: {
    total_omzet: number;
    total_modal: number;
    total_profit: number;
    is_profit: boolean;
  };
}

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function LaporanTahunanPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState<YearlyData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async (y: number) => {
    setLoading(true);
    const res = await fetch(`/api/reports/yearly?year=${y}`);
    const result = await res.json();
    setData(result);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData(year);
  }, [year, loadData]);

  const yearOptions = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  return (
    <main className="workspace-shell min-h-screen px-4 py-6 text-[#123b35] sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <Navbar />

        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#df735d]">
              <span className="h-2 w-2 rounded-full bg-[#f4b860]" />
              Laporan Tahunan
            </div>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[#123b35] sm:text-4xl">
              Rekap {year}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Ringkasan modal, omzet, dan profit selama satu tahun.
            </p>
          </div>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-[#123b35] outline-none focus:border-[#123b35]"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </header>

        {loading || !data ? (
          <p className="text-sm text-slate-500">Memuat...</p>
        ) : (
          <>
            {/* Ringkasan tahunan */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_18px_50px_rgba(18,59,53,0.06)]">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Total Omzet</p>
                <p className="mt-2 text-xl font-semibold text-[#123b35]">
                  {formatRupiah(data.summary.total_omzet)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_18px_50px_rgba(18,59,53,0.06)]">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Total Modal</p>
                <p className="mt-2 text-xl font-semibold text-[#123b35]">
                  {formatRupiah(data.summary.total_modal)}
                </p>
              </div>
              <div
                className={`rounded-2xl border p-5 shadow-[0_18px_50px_rgba(18,59,53,0.06)] ${
                  data.summary.is_profit
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Total Profit</p>
                <p
                  className={`mt-2 text-xl font-semibold ${
                    data.summary.is_profit ? "text-[#26745a]" : "text-[#df514d]"
                  }`}
                >
                  {formatRupiah(data.summary.total_profit)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_18px_50px_rgba(18,59,53,0.06)]">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Kesimpulan</p>
                <p
                  className={`mt-2 text-xl font-semibold ${
                    data.summary.is_profit ? "text-[#26745a]" : "text-[#df514d]"
                  }`}
                >
                  {data.summary.total_profit > 0
                    ? "Untung"
                    : data.summary.total_profit < 0
                    ? "Rugi"
                    : "Impas"}
                </p>
              </div>
            </div>

            {/* Tabel per bulan */}
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_18px_50px_rgba(18,59,53,0.06)]">
              <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                <h2 className="text-base font-semibold text-[#123b35]">Rincian per Bulan</h2>
                <p className="mt-1 text-xs text-slate-400">Klik menu Target untuk mengubah target tiap bulan</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="bg-[#f8faf9] text-left text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-semibold sm:px-6">Bulan</th>
                      <th className="px-5 py-3 font-semibold sm:px-6">Terjual</th>
                      <th className="px-5 py-3 font-semibold sm:px-6">Target</th>
                      <th className="px-5 py-3 font-semibold sm:px-6">Omzet</th>
                      <th className="px-5 py-3 font-semibold sm:px-6">Modal</th>
                      <th className="px-5 py-3 font-semibold sm:px-6">Profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.months.map((m) => {
                      const achieved = m.target_qty ? m.qty >= m.target_qty : null;
                      return (
                        <tr key={m.month} className="transition hover:bg-[#fffdf7]">
                          <td className="px-5 py-3 font-semibold text-[#123b35] sm:px-6">
                            {MONTH_NAMES[m.month - 1]}
                          </td>
                          <td className="px-5 py-3 text-slate-600 sm:px-6">{m.qty}</td>
                          <td className="px-5 py-3 sm:px-6">
                            {m.target_qty ? (
                              <span
                                className={`rounded-full px-2 py-1 text-xs font-bold ${
                                  achieved
                                    ? "bg-emerald-50 text-[#26745a]"
                                    : "bg-[#f4b860]/15 text-[#9b681e]"
                                }`}
                              >
                                {m.target_qty} {achieved ? "✓" : ""}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-300">-</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-slate-600 sm:px-6">{formatRupiah(m.omzet)}</td>
                          <td className="px-5 py-3 text-slate-600 sm:px-6">{formatRupiah(m.modal)}</td>
                          <td
                            className={`px-5 py-3 font-semibold sm:px-6 ${
                              m.profit >= 0 ? "text-[#26745a]" : "text-[#df514d]"
                            }`}
                          >
                            {formatRupiah(m.profit)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}