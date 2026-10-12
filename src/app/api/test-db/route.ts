import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

export async function GET() {
  try {
    const [info] = await pool.query<RowDataPacket[]>(
      'SELECT DATABASE() AS db, @@port AS port, @@hostname AS hostname, @@datadir AS datadir, CURRENT_USER() AS db_user'
    );
    const [users] = await pool.query<RowDataPacket[]>(
      'SELECT id, name, email, (password_hash IS NOT NULL) AS has_password FROM users'
    );

    return NextResponse.json({
      status: 'connected',
      env: {
        DB_HOST: process.env.DB_HOST,
        DB_PORT: process.env.DB_PORT,
        DB_NAME: process.env.DB_NAME,
      },
      server: info[0],
      userCount: users.length,
      users,
    });
  } catch (error) {
    return NextResponse.json({ status: 'error', message: String(error) }, { status: 500 });
  }
}