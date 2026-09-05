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
  const year = Number(searchParams.get("year")) || new Date().getFullYear();

  const [transactionRows] = await pool.query<RowDataPacket[]>(
    `SELECT
      MONTH(sold_at) as month,
      SUM(quantity) as qty,
      SUM(quantity * sell_price) as omzet,
      SUM(quantity * buy_price_snapshot) as modal,
      SUM(profit) as profit
    FROM transactions
    WHERE user_id = ? AND YEAR(sold_at) = ?
    GROUP BY MONTH(sold_at)`,
    [userId, year]
  );

  const [targetRows] = await pool.query<RowDataPacket[]>(
    "SELECT month, target_qty FROM targets WHERE user_id = ? AND year = ?",
    [userId, year]
  );

  const months = Array.from({ length: 12 }, (_, i) => {
    const monthNum = i + 1;
    const tx = transactionRows.find((r) => r.month === monthNum);
    const target = targetRows.find((t) => t.month === monthNum);

    return {
      month: monthNum,
      qty: tx ? Number(tx.qty) : 0,
      omzet: tx ? Number(tx.omzet) : 0,
      modal: tx ? Number(tx.modal) : 0,
      profit: tx ? Number(tx.profit) : 0,
      target_qty: target ? Number(target.target_qty) : null,
    };
  });

  const totalOmzet = months.reduce((sum, m) => sum + m.omzet, 0);
  const totalModal = months.reduce((sum, m) => sum + m.modal, 0);
  const totalProfit = months.reduce((sum, m) => sum + m.profit, 0);

  return NextResponse.json({
    year,
    months,
    summary: {
      total_omzet: totalOmzet,
      total_modal: totalModal,
      total_profit: totalProfit,
      is_profit: totalProfit >= 0,
    },
  });
}