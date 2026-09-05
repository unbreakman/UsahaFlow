"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/produk", label: "Produk" },
  { href: "/penjualan", label: "Penjualan" },
  { href: "/target", label: "Target" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
      <div className="flex flex-wrap items-center gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                isActive
                  ? "bg-[#123b35] text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="rounded-lg px-3 py-2 text-sm font-semibold text-[#df735d] hover:bg-red-50"
      >
        Keluar
      </button>
    </nav>
  );
}