import { NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: number }).id;
  const { id: productId } = await params;
  const { quantity, buy_price, purchased_at } = await request.json();

  if (!quantity || quantity <= 0 || buy_price === undefined || buy_price < 0) {
    return NextResponse.json(
      { error: "Jumlah dan harga modal wajib diisi dengan benar" },
      { status: 400 }
    );
  }

  const [productCheck] = await pool.query<RowDataPacket[]>(
    "SELECT id FROM products WHERE id = ? AND user_id = ?",
    [productId, userId]
  );
  if (productCheck.length === 0) {
    return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query(
      "INSERT INTO stock_batches (product_id, quantity, remaining_qty, buy_price, purchased_at) VALUES (?, ?, ?, ?, ?)",
      [productId, quantity, quantity, buy_price, purchased_at || new Date()]
    );

    await connection.query(
      "UPDATE products SET stock_qty = stock_qty + ? WHERE id = ?",
      [quantity, productId]
    );

    await connection.commit();
    return NextResponse.json({ status: "success" }, { status: 201 });
  } catch (error) {
    await connection.rollback();
    return NextResponse.json({ error: String(error) }, { status: 500 });
  } finally {
    connection.release();
  }
}
