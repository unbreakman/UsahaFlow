import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";
import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";

function readHidden(prompt) {
  if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
    throw new Error("Jalankan perintah ini langsung di terminal interaktif VS Code.");
  }

  return new Promise((resolve, reject) => {
    let value = "";
    const onData = (chunk) => {
      for (const character of chunk.toString()) {
        if (character === "\u0003") {
          cleanup();
          reject(new Error("Dibatalkan."));
          return;
        }
        if (character === "\r" || character === "\n") {
          cleanup();
          resolve(value);
          return;
        }
        if (character === "\u007f" || character === "\b") {
          value = value.slice(0, -1);
        } else if (character >= " ") {
          value += character;
        }
      }
    };
    const cleanup = () => {
      stdin.off("data", onData);
      stdin.setRawMode(false);
      stdin.pause();
      stdout.write("\n");
    };

    stdout.write(prompt);
    stdin.setEncoding("utf8");
    stdin.setRawMode(true);
    stdin.resume();
    stdin.on("data", onData);
  });
}

let pool;

try {
  pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 2,
  });

  const [users] = await pool.query(
    "SELECT id, name, email FROM users ORDER BY id"
  );
  if (users.length === 0) {
    throw new Error("Belum ada akun di database.");
  }

  stdout.write("Akun yang tersimpan:\n");
  for (const user of users) {
    stdout.write(`${user.id}. ${user.name} <${user.email}>\n`);
  }

  const input = createInterface({ input: stdin, output: stdout });
  const email = (await input.question("Email akun yang ingin direset: ")).trim();
  input.close();

  const selectedUser = users.find(
    (user) => user.email.toLowerCase() === email.toLowerCase()
  );
  if (!selectedUser) {
    throw new Error("Email tersebut tidak ditemukan; password tidak diubah.");
  }

  const password = await readHidden("Password baru (minimal 6 karakter): ");
  if (password.length < 6) {
    throw new Error("Password minimal 6 karakter; password tidak diubah.");
  }

  const confirmation = await readHidden("Ulangi password baru: ");
  if (password !== confirmation) {
    throw new Error("Password tidak sama; password tidak diubah.");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [
    passwordHash,
    selectedUser.id,
  ]);
  stdout.write(`Password akun ${selectedUser.email} berhasil direset.\n`);
} catch (error) {
  console.error(error instanceof Error ? error.message : "Reset gagal.");
  process.exitCode = 1;
} finally {
  await pool?.end();
}