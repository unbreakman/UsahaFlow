import { NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: number }).id;
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const productId = searchParams.get("product_id");

  let query = `
    SELECT
      t.id,
      t.sold_at,
      t.product_id,
      p.name AS product_name,
      p.unit,
      t.quantity,
      t.sell_price,
      t.buy_price_snapshot,
      t.quantity * t.sell_price AS total_sales,
      t.quantity * t.buy_price_snapshot AS total_cost,
      t.profit
    FROM transactions t
    INNER JOIN products p ON p.id = t.product_id
    WHERE t.user_id = ?`;
  const queryParams: (string | number)[] = [userId as number];

  if (from) {
    query += " AND t.sold_at >= ?";
    queryParams.push(`${from} 00:00:00`);
  }
  if (to) {
    query += " AND t.sold_at < DATE_ADD(?, INTERVAL 1 DAY)";
    queryParams.push(`${to} 00:00:00`);
  }
  if (productId) {
    query += " AND t.product_id = ?";
    queryParams.push(productId);
  }

  query += " ORDER BY t.sold_at DESC, t.id DESC";

  const [rows] = await pool.query<RowDataPacket[]>(query, queryParams);
  return NextResponse.json({ transactions: rows });
}