import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Insti — ERP Escolar",
  description: "Sistema de gestión escolar moderno y profesional",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
