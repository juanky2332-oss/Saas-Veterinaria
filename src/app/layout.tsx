import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Nunito_Sans } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const nunitoSans = Nunito_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Veteriblandenguer — Software de gestión para clínicas veterinarias",
  description:
    "Veteriblandenguer: la plataforma todo-en-uno para gestionar tu clínica veterinaria — mascotas, agenda, historia clínica, vacunaciones, facturación y recordatorios automáticos.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#2E8B57",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${plusJakarta.variable} ${nunitoSans.variable} h-full`}>
      <body className="min-h-full text-[var(--text)]">{children}</body>
    </html>
  );
}
