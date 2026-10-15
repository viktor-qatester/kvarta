import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Кварта",
  description: "Обжарка кофе в Минске",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru">
      <body className="bg-white text-neutral-900">{children}</body>
    </html>
  );
}
