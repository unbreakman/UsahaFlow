import { NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

// GET: ambil semua produk milik user yang login (bisa difilter per kategori)
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: number }).id;
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("category_id");

  let query = "SELECT * FROM products WHERE user_id = ?";
  const queryParams: (string | number)[] = [userId as number];

  if (categoryId) {
    query += " AND category_id = ?";
    queryParams.push(categoryId);
  }

  query += " ORDER BY created_at DESC";

  const [rows] = await pool.query<RowDataPacket[]>(query, queryParams);

  return NextResponse.json({ products: rows });
}

// POST: tambah produk baru
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: number }).id;
  const { category_id, name, unit, sell_price } = await request.json();

  if (!category_id || !name || !sell_price) {
    return NextResponse.json(
      { error: "Kategori, nama, dan harga jual wajib diisi" },
      { status: 400 }
    );
  }

  // Pastikan kategori itu memang milik user ini
  const [categoryCheck] = await pool.query<RowDataPacket[]>(
    "SELECT id FROM categories WHERE id = ? AND user_id = ?",
    [category_id, userId]
  );
  if (categoryCheck.length === 0) {
    return NextResponse.json({ error: "Kategori tidak valid" }, { status: 400 });
  }

  const [result] = await pool.query<ResultSetHeader>(
    "INSERT INTO products (category_id, user_id, name, unit, sell_price, stock_qty) VALUES (?, ?, ?, ?, ?, 0)",
    [category_id, userId, name.trim(), unit || "pcs", sell_price]
  );

  return NextResponse.json({ id: result.insertId }, { status: 201 });
}