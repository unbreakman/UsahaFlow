import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";
import { authConfig } from "@/auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  trustHost: true,
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const [rows] = await pool.query<RowDataPacket[]>(
          "SELECT * FROM users WHERE email = ?",
          [credentials.email]
        );
        const user = rows[0];
        if (!user || !user.password_hash) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password_hash as string
        );
        if (!isValid) return null;

        return {
          id: String(user.id),
          name: user.name as string,
          email: user.email as string,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        const [rows] = await pool.query<RowDataPacket[]>(
          "SELECT id FROM users WHERE email = ?",
          [user.email]
        );
        if (rows.length === 0) {
          const [countRows] = await pool.query<RowDataPacket[]>(
            "SELECT COUNT(*) as total FROM users"
          );
          if (Number(countRows[0].total) >= 3) return false;

          await pool.query(
            "INSERT INTO users (name, email, google_id) VALUES (?, ?, ?)",
            [user.name ?? "", user.email, account.providerAccountId ?? null]
          );
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const [rows] = await pool.query<RowDataPacket[]>(
          "SELECT id FROM users WHERE email = ?",
          [user.email]
        );
        if (rows[0]) {
          (token as Record<string, unknown>).userId = rows[0].id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as unknown as { id?: number }).id = (
          token as Record<string, unknown>
        ).userId as number;
      }
      return session;
    },
  },
});