"use client";

import { useCallback, useEffect, useState } from "react";
import Navbar from "@/components/Navbar";

interface Product {
  id: number;
  name: string;
}

interface Transaction {
  id: number;
  sold_at: string;
  product_id: number;
  product_name: string;
  unit: string;
  quantity: number;
  sell_price: string | number;
  buy_price_snapshot: string | number;
  total_sales: string | number;
  total_cost: string | number;
  profit: string | number;
}

function formatRupiah(value: string | number) {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function PenjualanPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [productId, setProductId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProducts = useCallback(async () => {
    const res = await fetch("/api/products");
    const data = await res.json();
    setProducts(data.products || []);
  }, []);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (productId) params.set("product_id", productId);

    const res = await fetch(`/api/transactions?${params.toString()}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Gagal memuat transaksi");
      setTransactions([]);
    } else {
      setTransactions(data.transactions || []);
    }
    setLoading(false);
  }, [from, productId, to]);

  useEffect(() => {
    async function initProducts() {
      await loadProducts();
    }
    initProducts();
  }, [loadProducts]);

  useEffect(() => {
    async function initTransactions() {
      await loadTransactions();
    }
    initTransactions();
  }, [loadTransactions]);

  const totalSales = transactions.reduce((sum, item) => sum + Number(item.total_sales), 0);
  const totalCost = transactions.reduce((sum, item) => sum + Number(item.total_cost), 0);
  const totalProfit = transactions.reduce((sum, item) => sum + Number(item.profit), 0);
  const totalQuantity = transactions.reduce((sum, item) => sum + Number(item.quantity), 0);

  function clearFilters() {
    setFrom("");
    setTo("");
    setProductId("");
  }

  return (
    <main className="workspace-shell min-h-screen px-4 py-6 text-[#123b35] sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <Navbar />
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#df735d]">
              <span className="h-2 w-2 rounded-full bg-[#f4b860]" />
              Ringkasan usaha
            </div>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[#123b35] sm:text-4xl">Riwayat Penjualan</h1>
            <p className="mt-2 text-sm text-slate-500">Pantau omzet, modal, dan keuntungan dari setiap transaksi.</p>
          </div>
          <a href="/produk" className="w-fit rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#123b35] shadow-sm transition hover:-translate-y-0.5 hover:border-[#f4b860] hover:shadow-md">
            Kelola Produk
          </a>
        </header>

        <section className="mb-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_12px_35px_rgba(18,59,53,0.05)]">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Total omzet</p>
            <p className="mt-3 text-xl font-semibold text-[#123b35]">{formatRupiah(totalSales)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_12px_35px_rgba(18,59,53,0.05)]">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Total modal</p>
            <p className="mt-3 text-xl font-semibold text-slate-600">{formatRupiah(totalCost)}</p>
          </div>
          <div className="rounded-2xl border border-[#f4b860]/40 bg-[#fffaf0] p-5 shadow-[0_12px_35px_rgba(244,184,96,0.08)]">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9b681e]">Total profit</p>
            <p className={`mt-3 text-xl font-semibold ${totalProfit < 0 ? "text-[#df514d]" : "text-[#26745a]"}`}>{formatRupiah(totalProfit)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_12px_35px_rgba(18,59,53,0.05)]">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Unit terjual</p>
            <p className="mt-3 text-xl font-semibold text-[#123b35]">{totalQuantity} <span className="text-sm font-medium text-slate-400">unit</span></p>
          </div>
        </section>

        <section className="mb-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_12px_35px_rgba(18,59,53,0.05)] sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#123b35]">Filter laporan</h2>
              <p className="mt-1 text-xs text-slate-400">Persempit data berdasarkan periode atau produk.</p>
            </div>
            <button onClick={clearFilters} className="text-xs font-semibold text-[#df735d] transition hover:text-[#bd4d3c]">Reset filter</button>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_1.4fr]">
            <label className="text-xs font-semibold text-slate-500">
              Dari tanggal
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm font-normal text-slate-700 outline-none transition focus:border-[#123b35] focus:bg-white focus:ring-4 focus:ring-emerald-900/10" />
            </label>
            <label className="text-xs font-semibold text-slate-500">
              Sampai tanggal
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm font-normal text-slate-700 outline-none transition focus:border-[#123b35] focus:bg-white focus:ring-4 focus:ring-emerald-900/10" />
            </label>
            <label className="text-xs font-semibold text-slate-500">
              Produk
              <select value={productId} onChange={(e) => setProductId(e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm font-normal text-slate-700 outline-none transition focus:border-[#123b35] focus:bg-white focus:ring-4 focus:ring-emerald-900/10">
                <option value="">Semua produk</option>
                {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
              </select>
            </label>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_18px_50px_rgba(18,59,53,0.06)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-base font-semibold text-[#123b35]">Detail transaksi</h2>
              <p className="mt-1 text-xs text-slate-400">{transactions.length} transaksi ditemukan</p>
            </div>
            <span className="rounded-full bg-[#f4b860]/15 px-3 py-1 text-xs font-bold text-[#9b681e]">Penjualan</span>
          </div>
          {error ? <p className="p-8 text-sm text-[#df514d]">{error}</p> : loading ? <p className="p-8 text-sm text-slate-500">Memuat transaksi...</p> : transactions.length === 0 ? <p className="p-8 text-sm text-slate-500">Belum ada transaksi pada filter ini.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-[#f8faf9] text-left text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold sm:px-6">Tanggal</th>
                    <th className="px-5 py-4 font-semibold sm:px-6">Produk</th>
                    <th className="px-5 py-4 font-semibold sm:px-6">Jumlah</th>
                    <th className="px-5 py-4 font-semibold sm:px-6">Total penjualan</th>
                    <th className="px-5 py-4 font-semibold sm:px-6">Modal</th>
                    <th className="px-5 py-4 font-semibold sm:px-6">Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="transition hover:bg-[#fffdf7]">
                      <td className="whitespace-nowrap px-5 py-4 text-slate-500 sm:px-6">{formatDate(transaction.sold_at)}</td>
                      <td className="px-5 py-4 font-semibold text-[#123b35] sm:px-6">{transaction.product_name}</td>
                      <td className="px-5 py-4 text-slate-600 sm:px-6">{transaction.quantity} {transaction.unit}</td>
                      <td className="px-5 py-4 font-semibold text-[#123b35] sm:px-6">{formatRupiah(transaction.total_sales)}</td>
                      <td className="px-5 py-4 text-slate-600 sm:px-6">{formatRupiah(transaction.total_cost)}</td>
                      <td className={`px-5 py-4 font-semibold sm:px-6 ${Number(transaction.profit) < 0 ? "text-[#df514d]" : "text-[#26745a]"}`}>{formatRupiah(transaction.profit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}