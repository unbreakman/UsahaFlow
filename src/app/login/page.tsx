"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCredentialsLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!result || result.error || !result.ok) {
        setError("Email atau password salah");
        setLoading(false);
        return;
      }

      // loading sengaja tetap true agar tombol nonaktif sampai pindah halaman
      setSuccess("Login berhasil! Mengalihkan ke dashboard...");
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 1000);
    } catch {
      setError("Terjadi kesalahan, coba lagi");
      setLoading(false);
    }
  }

  return (
    <main className="auth-shell flex min-h-dvh items-center justify-center px-4 py-8 sm:px-6">
      <div className="auth-card grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 shadow-2xl shadow-emerald-950/10 backdrop-blur md:grid-cols-[0.9fr_1.1fr]">
        <section className="relative hidden overflow-hidden bg-[#123b35] p-10 text-white md:flex md:flex-col md:justify-between lg:p-14">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full border-[28px] border-[#f4b860]/20" />
          <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full border-[36px] border-[#e97d60]/20" />
          <div className="relative">
            <div className="mb-12 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f4b860] text-lg font-black text-[#123b35]">U</span>
              <span className="text-lg font-semibold tracking-tight">UsahaFlow</span>
            </div>
            <p className="mb-4 max-w-xs text-sm font-medium uppercase tracking-[0.2em] text-[#f4b860]">Ruang kerja usahamu</p>
            <h2 className="max-w-sm text-4xl font-semibold leading-tight tracking-[-0.04em] lg:text-5xl">Jalankan usaha dengan lebih tenang.</h2>
          </div>
          <p className="relative max-w-xs text-sm leading-6 text-emerald-100/75">Satu tempat untuk merapikan pekerjaan, memantau progres, dan membuat keputusan yang lebih jelas.</p>
        </section>

        <section className="p-7 sm:p-10 lg:p-14">
          <div className="mb-8 md:hidden">
            <div className="mb-8 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#123b35] text-lg font-black text-[#f4b860]">U</span>
              <span className="text-lg font-semibold tracking-tight text-[#123b35]">UsahaFlow</span>
            </div>
          </div>
          <div className="mb-8">
            <p className="mb-2 text-sm font-semibold text-[#df735d]">Selamat datang kembali</p>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[#123b35] sm:text-4xl">Masuk ke akunmu</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">Lanjutkan mengelola usaha dari tempat terakhir kamu berhenti.</p>
          </div>

          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="mb-6 flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-emerald-900/10"
          >
            <span className="text-base font-bold text-[#4285f4]">G</span>
            Lanjutkan dengan Google
          </button>

          <div className="mb-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-medium uppercase tracking-widest text-slate-400">atau email</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <form onSubmit={handleCredentialsLogin} className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Email</span>
              <input
                type="email"
                placeholder="nama@contoh.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#123b35] focus:bg-white focus:ring-4 focus:ring-emerald-900/10"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Password</span>
              <input
                type="password"
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#123b35] focus:bg-white focus:ring-4 focus:ring-emerald-900/10"
              />
            </label>

            {registered && !success && !error && (
              <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                Registrasi berhasil, silakan masuk.
              </p>
            )}
            {success && (
              <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {success}
              </p>
            )}
            {error && (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-xl bg-[#123b35] px-4 text-sm font-semibold text-white shadow-lg shadow-emerald-950/15 transition hover:bg-[#0d2f2a] focus:outline-none focus:ring-4 focus:ring-emerald-900/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Belum punya akun?{" "}
            <Link href="/register" className="font-semibold text-[#123b35] underline decoration-[#f4b860] decoration-2 underline-offset-4 hover:text-[#df735d]">
              Daftar
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}