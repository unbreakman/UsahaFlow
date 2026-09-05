import { NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";

// GET: ambil target + progress bulan tertentu (default: bulan ini)
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id?: number }).id;

  const { searchParams } = new URL(request.url);
  const now = new Date();
  const month = Number(searchParams.get("month")) || now.getMonth() + 1;
  const year = Number(searchParams.get("year")) || now.getFullYear();

  const [targetRows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM targets WHERE user_id = ? AND month = ? AND year = ?",
    [userId, month, year]
  );
  const target = targetRows[0] || null;

  const [achievedRows] = await pool.query<RowDataPacket[]>(
    "SELECT COALESCE(SUM(quantity), 0) as achieved_qty, COALESCE(SUM(profit), 0) as total_profit, COALESCE(SUM(quantity * sell_price), 0) as total_omzet FROM transactions WHERE user_id = ? AND MONTH(sold_at) = ? AND YEAR(sold_at) = ?",
    [userId, month, year]
  );
  const achieved = achievedRows[0];

  return NextResponse.json({
    month,
    year,
    target_qty: target ? target.target_qty : null,
    achieved_qty: Number(achieved.achieved_qty),
    total_profit: Number(achieved.total_profit),
    total_omzet: Number(achieved.total_omzet),
  });
}

// POST: set/update target bulan tertentu
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id?: number }).id;
  const { month, year, target_qty } = await request.json();

  if (!month || !year || !target_qty || target_qty <= 0) {
    return NextResponse.json({ error: "Data target tidak valid" }, { status: 400 });
  }

  await pool.query(
    `INSERT INTO targets (user_id, month, year, target_qty) VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE target_qty = VALUES(target_qty)`,
    [userId, month, year, target_qty]
  );

  return NextResponse.json({ status: "success" });
}