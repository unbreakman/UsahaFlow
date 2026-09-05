"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

interface TargetData {
  month: number;
  year: number;
  target_qty: number | null;
  achieved_qty: number;
  total_profit: number;
  total_omzet: number;
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

export default function TargetPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState<TargetData | null>(null);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [targetInput, setTargetInput] = useState("");

  const loadTarget = useCallback(async (m: number, y: number) => {
    setLoading(true);
    const res = await fetch(`/api/targets?month=${m}&year=${y}`);
    const result = await res.json();
    setData(result);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadTarget(month, year);
  }, [month, year, loadTarget]);

  function openSetTarget() {
    setTargetInput(data?.target_qty ? String(data.target_qty) : "");
    setShowModal(true);
  }

  async function handleSaveTarget(e: React.FormEvent) {
    e.preventDefault();
    if (!targetInput || Number(targetInput) <= 0) return;

    await fetch("/api/targets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month, year, target_qty: Number(targetInput) }),
    });

    setShowModal(false);
    await loadTarget(month, year);
  }

  const progress =
    data?.target_qty && data.target_qty > 0
      ? Math.min(100, Math.round((data.achieved_qty / data.target_qty) * 100))
      : 0;
  const isAchieved = data?.target_qty ? data.achieved_qty >= data.target_qty : false;
  const remaining = data?.target_qty ? Math.max(0, data.target_qty - data.achieved_qty) : 0;

  const yearOptions = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  return (
    <main className="workspace-shell min-h-screen px-4 py-6 text-[#123b35] sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#df735d]">
              <span className="h-2 w-2 rounded-full bg-[#f4b860]" />
              Target Usaha
            </div>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[#123b35] sm:text-4xl">
              Target Bulanan
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Pantau progres penjualanmu dibanding target yang kamu tetapkan.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/produk"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#123b35] shadow-sm transition hover:-translate-y-0.5 hover:border-[#f4b860] hover:shadow-md"
            >
              Kelola Produk
            </Link>
            <button
              onClick={openSetTarget}
              className="rounded-xl bg-[#123b35] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-950/15 transition hover:-translate-y-0.5 hover:bg-[#0d2f2a]"
            >
              {data?.target_qty ? "Ubah Target" : "+ Set Target"}
            </button>
          </div>
        </header>

        <section className="mb-6 flex flex-wrap items-center gap-3">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-[#123b35] outline-none focus:border-[#123b35]"
          >
            {MONTH_NAMES.map((name, idx) => (
              <option key={name} value={idx + 1}>
                {name}
              </option>
            ))}
          </select>
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
        </section>

        {loading ? (
          <p className="text-sm text-slate-500">Memuat...</p>
        ) : !data?.target_qty ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-10 text-center">
            <p className="text-sm text-slate-500">
              Belum ada target untuk {MONTH_NAMES[month - 1]} {year}.
            </p>
            <button
              onClick={openSetTarget}
              className="mt-4 rounded-xl bg-[#123b35] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0d2f2a]"
            >
              + Set Target Sekarang
            </button>
          </div>
        ) : (
          <>
            {/* Progress card utama */}
            <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_18px_50px_rgba(18,59,53,0.06)] sm:p-8">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                    Progres {MONTH_NAMES[month - 1]} {year}
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-[#123b35]">
                    {data.achieved_qty} / {data.target_qty} penjualan
                  </p>
                </div>
                <span
                  className={`rounded-full px-4 py-1.5 text-sm font-bold ${
                    isAchieved
                      ? "bg-emerald-50 text-[#26745a]"
                      : "bg-[#f4b860]/15 text-[#9b681e]"
                  }`}
                >
                  {isAchieved ? "🎉 Tercapai!" : `${progress}%`}
                </span>
              </div>

              <div className="h-4 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all ${
                    isAchieved ? "bg-[#26745a]" : "bg-[#f4b860]"
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              <p className="mt-3 text-sm text-slate-500">
                {isAchieved
                  ? "Mantap, target bulan ini sudah tercapai!"
                  : `Kurang ${remaining} penjualan lagi untuk mencapai target.`}
              </p>
            </div>

            {/* Ringkasan angka */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_18px_50px_rgba(18,59,53,0.06)]">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                  Total Omzet
                </p>
                <p className="mt-2 text-xl font-semibold text-[#123b35]">
                  {formatRupiah(data.total_omzet)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_18px_50px_rgba(18,59,53,0.06)]">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                  Total Profit
                </p>
                <p className="mt-2 text-xl font-semibold text-[#26745a]">
                  {formatRupiah(data.total_profit)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_18px_50px_rgba(18,59,53,0.06)]">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                  Sisa Target
                </p>
                <p className="mt-2 text-xl font-semibold text-[#123b35]">
                  {remaining} penjualan
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#123b35]/55 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/70 bg-white p-6 shadow-2xl shadow-emerald-950/20">
            <h2 className="mb-1 text-xl font-semibold tracking-[-0.03em] text-[#123b35]">
              Set Target
            </h2>
            <p className="mb-5 text-sm text-slate-500">
              {MONTH_NAMES[month - 1]} {year}
            </p>
            <form onSubmit={handleSaveTarget} className="space-y-3">
              <input
                type="number"
                placeholder="Contoh: 1000"
                value={targetInput}
                onChange={(e) => setTargetInput(e.target.value)}
                required
                min="1"
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#123b35] focus:bg-white focus:ring-4 focus:ring-emerald-900/10"
              />
              <p className="text-xs text-slate-400">
                Target dalam jumlah total penjualan (gabungan semua produk).
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#123b35] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d2f2a]"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
