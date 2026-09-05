import { NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id?: number }).id;

  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id, name, unit, stock_qty FROM products WHERE user_id = ? AND stock_qty <= 5 ORDER BY stock_qty ASC",
    [userId]
  );

  return NextResponse.json({ products: rows });
}