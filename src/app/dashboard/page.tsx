"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

interface TargetData {
  target_qty: number | null;
  achieved_qty: number;
  total_profit: number;
  total_omzet: number;
}

interface LowStockProduct {
  id: number;
  name: string;
  unit: string;
  stock_qty: number;
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export default function DashboardPage() {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const [target, setTarget] = useState<TargetData | null>(null);
  const [lowStock, setLowStock] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const [targetRes, lowStockRes] = await Promise.all([
      fetch(`/api/targets?month=${currentMonth}&year=${currentYear}`),
      fetch("/api/products/low-stock"),
    ]);
    const targetData = await targetRes.json();
    const lowStockData = await lowStockRes.json();
    setTarget(targetData);
    setLowStock(lowStockData.products || []);
    setLoading(false);
  }, [currentMonth, currentYear]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const progress =
    target?.target_qty && target.target_qty > 0
      ? Math.min(100, Math.round((target.achieved_qty / target.target_qty) * 100))
      : 0;

  return (
    <main className="workspace-shell min-h-screen px-4 py-6 text-[#123b35] sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <Navbar />
        <header className="mb-8">
          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#df735d]">
            <span className="h-2 w-2 rounded-full bg-[#f4b860]" />
            Ruang kerja usahamu
          </div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[#123b35] sm:text-4xl">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Ringkasan usahamu bulan {MONTH_NAMES[currentMonth - 1]} {currentYear}.
          </p>
        </header>

        {loading ? (
          <p className="text-sm text-slate-500">Memuat...</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {/* Progress target - kolom besar */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_18px_50px_rgba(18,59,53,0.06)] sm:p-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-[#123b35]">Target Bulan Ini</h2>
                <Link href="/target" className="text-xs font-semibold text-[#df735d] hover:underline">
                  Kelola target →
                </Link>
              </div>

              {!target?.target_qty ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center">
                  <p className="text-sm text-slate-500">Belum ada target bulan ini.</p>
                  <Link
                    href="/target"
                    className="mt-3 inline-block rounded-xl bg-[#123b35] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d2f2a]"
                  >
                    + Set Target
                  </Link>
                </div>
              ) : (
                <>
                  <p className="mb-2 text-2xl font-semibold text-[#123b35]">
                    {target.achieved_qty} / {target.target_qty} penjualan
                  </p>
                  <div className="h-4 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all ${
                        progress >= 100 ? "bg-[#26745a]" : "bg-[#f4b860]"
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Omzet</p>
                      <p className="mt-1 text-lg font-semibold text-[#123b35]">
                        {formatRupiah(target.total_omzet)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Profit</p>
                      <p className="mt-1 text-lg font-semibold text-[#26745a]">
                        {formatRupiah(target.total_profit)}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Stok menipis - kolom kecil */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_18px_50px_rgba(18,59,53,0.06)]">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-[#123b35]">Stok Menipis</h2>
                <Link href="/produk" className="text-xs font-semibold text-[#df735d] hover:underline">
                  Kelola →
                </Link>
              </div>

              {lowStock.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Semua stok aman, tidak ada yang menipis.
                </p>
              ) : (
                <ul className="space-y-3">
                  {lowStock.map((p) => (
                    <li key={p.id} className="flex items-center justify-between text-sm">
                      <span className="font-medium text-[#123b35]">{p.name}</span>
                      <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-bold text-[#df514d]">
                        {p.stock_qty} {p.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Quick links */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link
            href="/produk"
            className="rounded-2xl border border-slate-200/80 bg-white p-5 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-[#f4b860] hover:shadow-md"
          >
            <p className="font-semibold text-[#123b35]">Kelola Produk</p>
            <p className="mt-1 text-xs text-slate-400">Kategori & stok</p>
          </Link>
          <Link
            href="/penjualan"
            className="rounded-2xl border border-slate-200/80 bg-white p-5 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-[#f4b860] hover:shadow-md"
          >
            <p className="font-semibold text-[#123b35]">Riwayat Penjualan</p>
            <p className="mt-1 text-xs text-slate-400">Omzet & profit</p>
          </Link>
          <Link
            href="/target"
            className="rounded-2xl border border-slate-200/80 bg-white p-5 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-[#f4b860] hover:shadow-md"
          >
            <p className="font-semibold text-[#123b35]">Target Bulanan</p>
            <p className="mt-1 text-xs text-slate-400">Atur target jualan</p>
          </Link>
        </div>
      </div>
    </main>
  );
}
