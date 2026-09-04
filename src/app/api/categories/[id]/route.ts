import { NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";
import type { ResultSetHeader } from "mysql2";

// PUT: edit nama kategori
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
  const { name } = await request.json();

  if (!name || typeof name !== "string" || name.trim() === "") {
    return NextResponse.json({ error: "Nama kategori wajib diisi" }, { status: 400 });
  }

  const [result] = await pool.query<ResultSetHeader>(
    "UPDATE categories SET name = ? WHERE id = ? AND user_id = ?",
    [name.trim(), id, userId]
  );

  if (result.affectedRows === 0) {
    return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({ status: "success" });
}

// DELETE: hapus kategori
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
    "DELETE FROM categories WHERE id = ? AND user_id = ?",
    [id, userId]
  );

  if (result.affectedRows === 0) {
    return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({ status: "success" });
}