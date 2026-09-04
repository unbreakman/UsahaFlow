import { NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

// GET: ambil semua kategori milik user yang login
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: number }).id;

  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM categories WHERE user_id = ? ORDER BY created_at DESC",
    [userId]
  );

  return NextResponse.json({ categories: rows });
}

// POST: tambah kategori baru
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: number }).id;
  const { name } = await request.json();

  if (!name || typeof name !== "string" || name.trim() === "") {
    return NextResponse.json({ error: "Nama kategori wajib diisi" }, { status: 400 });
  }

  const [result] = await pool.query<ResultSetHeader>(
    "INSERT INTO categories (user_id, name) VALUES (?, ?)",
    [userId, name.trim()]
  );

  return NextResponse.json(
    { id: result.insertId, name: name.trim() },
    { status: 201 }
  );
}   