import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UsahaFlow | Ruang kerja usahamu",
  description: "Kelola pekerjaan dan progres usaha dalam satu ruang kerja.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
