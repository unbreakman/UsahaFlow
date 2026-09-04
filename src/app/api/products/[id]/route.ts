import { NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";
import type { ResultSetHeader } from "mysql2";

// PUT: edit produk
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: number }).id;
  const { id } = await params;
  const { name, unit, sell_price } = await request.json();

  if (!name || !sell_price) {
    return NextResponse.json(
      { error: "Nama dan harga jual wajib diisi" },
      { status: 400 }
    );
  }

  const [result] = await pool.query<ResultSetHeader>(
    "UPDATE products SET name = ?, unit = ?, sell_price = ? WHERE id = ? AND user_id = ?",
    [name.trim(), unit || "pcs", sell_price, id, userId]
  );

  if (result.affectedRows === 0) {
    return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({ status: "success" });
}

// DELETE: hapus produk
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: number }).id;
  const { id } = await params;

  const [result] = await pool.query<ResultSetHeader>(
    "DELETE FROM products WHERE id = ? AND user_id = ?",
    [id, userId]
  );

  if (result.affectedRows === 0) {
    return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({ status: "success" });
}