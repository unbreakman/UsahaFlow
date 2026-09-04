"use client";

import { useCallback, useEffect, useState } from "react";

interface Category {
  id: number;
  name: string;
}

interface Product {
  id: number;
  category_id: number;
  name: string;
  unit: string;
  sell_price: string;
  stock_qty: number;
}

function formatRupiah(value: string | number) {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
}

export default function ProdukPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    category_id: "",
    name: "",
    unit: "pcs",
    sell_price: "",
  });
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const [stockForm, setStockForm] = useState({ quantity: "", buy_price: "" });

  const loadCategories = useCallback(async () => {
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(data.categories || []);
  }, []);

  const loadProducts = useCallback(async (categoryId: number | null) => {
    const url = categoryId
      ? `/api/products?category_id=${categoryId}`
      : "/api/products";
    const res = await fetch(url);
    const data = await res.json();
    setProducts(data.products || []);
  }, []);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await loadCategories();
      await loadProducts(null);
      setLoading(false);
    }
    init();
  }, [loadCategories, loadProducts]);

  async function handleSelectCategory(id: number | null) {
    setSelectedCategory(id);
    setLoading(true);
    await loadProducts(id);
    setLoading(false);
  }

  function openAddCategory() {
    setEditingCategory(null);
    setCategoryName("");
    setShowCategoryModal(true);
  }

  function openEditCategory(cat: Category) {
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setShowCategoryModal(true);
  }

  async function handleSaveCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryName.trim()) return;

    if (editingCategory) {
      await fetch(`/api/categories/${editingCategory.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: categoryName }),
      });
    } else {
      await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: categoryName }),
      });
    }

    setShowCategoryModal(false);
    await loadCategories();
  }

  async function handleDeleteCategory(id: number) {
    if (
      !confirm(
        "Yakin ingin menghapus kategori ini? Semua produk di dalamnya juga akan ikut terhapus."
      )
    )
      return;

    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (selectedCategory === id) setSelectedCategory(null);
    await loadCategories();
    await loadProducts(null);
  }

  function openAddProduct() {
    setEditingProduct(null);
    setProductForm({
      category_id: selectedCategory ? String(selectedCategory) : "",
      name: "",
      unit: "pcs",
      sell_price: "",
    });
    setShowProductModal(true);
  }

  function openEditProduct(p: Product) {
    setEditingProduct(p);
    setProductForm({
      category_id: String(p.category_id),
      name: p.name,
      unit: p.unit,
      sell_price: p.sell_price,
    });
    setShowProductModal(true);
  }

  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!productForm.name.trim() || !productForm.sell_price) return;

    if (editingProduct) {
      await fetch(`/api/products/${editingProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: productForm.name,
          unit: productForm.unit,
          sell_price: productForm.sell_price,
        }),
      });
    } else {
      if (!productForm.category_id) {
        alert("Pilih kategori dulu");
        return;
      }
      await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productForm),
      });
    }

    setShowProductModal(false);
    await loadProducts(selectedCategory);
  }

  async function handleDeleteProduct(id: number) {
    if (!confirm("Yakin ingin menghapus produk ini?")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    await loadProducts(selectedCategory);
  }

  function openAddStock(p: Product) {
    setStockProduct(p);
    setStockForm({ quantity: "", buy_price: "" });
    setShowStockModal(true);
  }

  async function handleSaveStock(e: React.FormEvent) {
    e.preventDefault();
    if (!stockProduct || !stockForm.quantity || !stockForm.buy_price) return;

    const res = await fetch(`/api/products/${stockProduct.id}/stock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quantity: Number(stockForm.quantity),
        buy_price: Number(stockForm.buy_price),
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Gagal menambah stok");
      return;
    }

    setShowStockModal(false);
    await loadProducts(selectedCategory);
  }

  return (
    <main className="workspace-shell min-h-screen px-4 py-6 text-[#123b35] sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#df735d]">
              <span className="h-2 w-2 rounded-full bg-[#f4b860]" />
              Ruang kerja usahamu
            </div>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[#123b35] sm:text-4xl">Produk & Kategori</h1>
            <p className="mt-2 text-sm text-slate-500">Atur katalog dan pantau persediaan dalam satu tempat.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={openAddCategory}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#123b35] shadow-sm transition hover:-translate-y-0.5 hover:border-[#f4b860] hover:shadow-md focus:outline-none focus:ring-4 focus:ring-[#f4b860]/25"
            >
              + Kategori
            </button>
            <button
              onClick={openAddProduct}
              className="rounded-xl bg-[#123b35] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-950/15 transition hover:-translate-y-0.5 hover:bg-[#0d2f2a] focus:outline-none focus:ring-4 focus:ring-emerald-900/20"
            >
              + Produk
            </button>
          </div>
        </header>

        <section className="mb-7">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Filter kategori</p>
            <span className="text-xs text-slate-400">{categories.length} kategori</span>
          </div>
          <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleSelectCategory(null)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-[#f4b860]/25 ${
              selectedCategory === null
                ? "border-[#123b35] bg-[#123b35] text-white shadow-md shadow-emerald-950/10"
                : "border-slate-200 bg-white text-slate-600 hover:border-[#f4b860]"
            }`}
          >
            Semua
          </button>
          {categories.map((cat) => (
            <div key={cat.id} className="group relative">
              <button
                onClick={() => handleSelectCategory(cat.id)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-[#f4b860]/25 ${
                  selectedCategory === cat.id
                    ? "border-[#123b35] bg-[#123b35] text-white shadow-md shadow-emerald-950/10"
                    : "border-slate-200 bg-white text-slate-600 hover:border-[#f4b860]"
                }`}
              >
                {cat.name}
              </button>
              <span className="absolute -right-2 -top-2 hidden gap-1 rounded-full border border-slate-100 bg-white px-2 py-1 text-[10px] shadow-sm group-hover:inline-flex">
                <button
                  onClick={() => openEditCategory(cat)}
                  aria-label={`Edit kategori ${cat.name}`}
                  className="text-slate-400 hover:text-[#123b35]"
                >
                  edit
                </button>
                <button
                  onClick={() => handleDeleteCategory(cat.id)}
                  aria-label={`Hapus kategori ${cat.name}`}
                  className="text-slate-400 hover:text-[#df735d]"
                >
                  hapus
                </button>
              </span>
            </div>
          ))}
          </div>
        </section>

        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_18px_50px_rgba(18,59,53,0.06)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-base font-semibold text-[#123b35]">Daftar produk</h2>
              <p className="mt-1 text-xs text-slate-400">Informasi harga dan stok terkini</p>
            </div>
            <span className="rounded-full bg-[#f4b860]/15 px-3 py-1 text-xs font-bold text-[#9b681e]">{products.length} item</span>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <p className="p-8 text-sm text-slate-500">Memuat...</p>
            ) : products.length === 0 ? (
              <p className="p-8 text-sm text-slate-500">
                Belum ada produk. Klik &quot;+ Produk&quot; untuk menambahkan.
              </p>
            ) : (
              <table className="w-full min-w-[720px] text-sm">
                <thead className="bg-[#f8faf9] text-left text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold sm:px-6">Nama</th>
                    <th className="px-5 py-4 font-semibold sm:px-6">Satuan</th>
                    <th className="px-5 py-4 font-semibold sm:px-6">Harga Jual</th>
                    <th className="px-5 py-4 font-semibold sm:px-6">Stok</th>
                    <th className="px-5 py-4 font-semibold sm:px-6"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((p) => (
                    <tr key={p.id} className="transition hover:bg-[#fffdf7]">
                      <td className="px-5 py-4 font-semibold text-[#123b35] sm:px-6">{p.name}</td>
                      <td className="px-5 py-4 text-slate-500 sm:px-6">{p.unit}</td>
                      <td className="px-5 py-4 text-slate-600 sm:px-6">{formatRupiah(p.sell_price)}</td>
                      <td className="px-5 py-4 sm:px-6">
                        <span className={`inline-flex min-w-8 justify-center rounded-full px-2 py-1 text-xs font-bold ${p.stock_qty <= 5 ? "bg-red-50 text-[#df514d]" : "bg-emerald-50 text-[#26745a]"}`}>
                          {p.stock_qty}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right sm:px-6">
                        <button onClick={() => openAddStock(p)} className="mr-4 font-semibold text-[#26745a] transition hover:text-[#123b35]">+ Stok</button>
                        <button onClick={() => openEditProduct(p)} className="mr-4 font-semibold text-slate-500 transition hover:text-[#123b35]">Edit</button>
                        <button onClick={() => handleDeleteProduct(p.id)} className="font-semibold text-[#df735d] transition hover:text-[#bd4d3c]">Hapus</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#123b35]/55 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/70 bg-white p-6 shadow-2xl shadow-emerald-950/20">
            <h2 className="mb-5 text-xl font-semibold tracking-[-0.03em] text-[#123b35]">
              {editingCategory ? "Edit Kategori" : "Tambah Kategori"}
            </h2>
            <form onSubmit={handleSaveCategory} className="space-y-3">
              <input
                type="text"
                placeholder="Nama kategori (contoh: Voucher Internet)"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                required
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#123b35] focus:bg-white focus:ring-4 focus:ring-emerald-900/10"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
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

      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#123b35]/55 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/70 bg-white p-6 shadow-2xl shadow-emerald-950/20">
            <h2 className="mb-5 text-xl font-semibold tracking-[-0.03em] text-[#123b35]">
              {editingProduct ? "Edit Produk" : "Tambah Produk"}
            </h2>
            <form onSubmit={handleSaveProduct} className="space-y-3">
              {!editingProduct && (
                <select
                  value={productForm.category_id}
                  onChange={(e) =>
                    setProductForm({ ...productForm, category_id: e.target.value })
                  }
                  required
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 text-sm outline-none transition focus:border-[#123b35] focus:bg-white focus:ring-4 focus:ring-emerald-900/10"
                >
                  <option value="">Pilih kategori</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              )}
              <input
                type="text"
                placeholder="Nama produk"
                value={productForm.name}
                onChange={(e) =>
                  setProductForm({ ...productForm, name: e.target.value })
                }
                required
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#123b35] focus:bg-white focus:ring-4 focus:ring-emerald-900/10"
              />
              <input
                type="text"
                placeholder="Satuan (pcs, GB, dll)"
                value={productForm.unit}
                onChange={(e) =>
                  setProductForm({ ...productForm, unit: e.target.value })
                }
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#123b35] focus:bg-white focus:ring-4 focus:ring-emerald-900/10"
              />
              <input
                type="number"
                placeholder="Harga jual"
                value={productForm.sell_price}
                onChange={(e) =>
                  setProductForm({ ...productForm, sell_price: e.target.value })
                }
                required
                min="0"
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#123b35] focus:bg-white focus:ring-4 focus:ring-emerald-900/10"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
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

      {showStockModal && stockProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#123b35]/55 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/70 bg-white p-6 shadow-2xl shadow-emerald-950/20">
            <h2 className="mb-2 text-xl font-semibold tracking-[-0.03em] text-[#123b35]">Tambah Stok</h2>
            <p className="mb-5 text-sm text-slate-500">{stockProduct.name}</p>
            <form onSubmit={handleSaveStock} className="space-y-3">
              <input
                type="number"
                placeholder="Jumlah"
                value={stockForm.quantity}
                onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })}
                required
                min="1"
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#123b35] focus:bg-white focus:ring-4 focus:ring-emerald-900/10"
              />
              <input
                type="number"
                placeholder="Harga modal per satuan"
                value={stockForm.buy_price}
                onChange={(e) => setStockForm({ ...stockForm, buy_price: e.target.value })}
                required
                min="0"
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#123b35] focus:bg-white focus:ring-4 focus:ring-emerald-900/10"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStockModal(false)}
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