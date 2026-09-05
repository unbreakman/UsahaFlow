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
  const { quantity } = await request.json();

  if (!quantity || quantity <= 0) {
    return NextResponse.json(
      { error: "Jumlah wajib diisi dengan benar" },
      { status: 400 }
    );
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Ambil produk + kunci baris ini biar aman dari race condition
    const [productRows] = await connection.query<RowDataPacket[]>(
      "SELECT * FROM products WHERE id = ? AND user_id = ? FOR UPDATE",
      [productId, userId]
    );
    const product = productRows[0];
    if (!product) {
      await connection.rollback();
      return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
    }

    if (product.stock_qty < quantity) {
      await connection.rollback();
      return NextResponse.json(
        { error: `Stok tidak cukup. Sisa stok: ${product.stock_qty}` },
        { status: 400 }
      );
    }

    // Ambil semua batch yang masih ada sisa, urut dari yang paling lama (FIFO)
    const [batches] = await connection.query<RowDataPacket[]>(
      "SELECT * FROM stock_batches WHERE product_id = ? AND remaining_qty > 0 ORDER BY purchased_at ASC, id ASC FOR UPDATE",
      [productId]
    );

    let remainingToSell = quantity;
    const sellPrice = parseFloat(product.sell_price);

    for (const batch of batches) {
      if (remainingToSell <= 0) break;

      const takeFromBatch = Math.min(batch.remaining_qty, remainingToSell);
      const buyPrice = parseFloat(batch.buy_price);
      const profit = (sellPrice - buyPrice) * takeFromBatch;

      // Kurangi sisa di batch ini
      await connection.query(
        "UPDATE stock_batches SET remaining_qty = remaining_qty - ? WHERE id = ?",
        [takeFromBatch, batch.id]
      );

      // Catat transaksi untuk porsi dari batch ini
      await connection.query(
        "INSERT INTO transactions (product_id, user_id, quantity, sell_price, buy_price_snapshot, profit) VALUES (?, ?, ?, ?, ?, ?)",
        [productId, userId, takeFromBatch, sellPrice, buyPrice, profit]
      );

      remainingToSell -= takeFromBatch;
    }

    if (remainingToSell > 0) {
      // Jaga-jaga: stok_qty bilang cukup tapi ternyata batch nggak nutup (data nggak konsisten)
      await connection.rollback();
      return NextResponse.json(
        { error: "Data stok tidak konsisten, hubungi admin" },
        { status: 500 }
      );
    }

    // Kurangi total stok di produk
    await connection.query(
      "UPDATE products SET stock_qty = stock_qty - ? WHERE id = ?",
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