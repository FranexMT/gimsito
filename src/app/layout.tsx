import type { Metadata, Viewport } from "next";
import { Doto, Space_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

const doto = Doto({
  variable: "--font-doto",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Gym Rankeds",
  description: "Rankea tu progreso en el gym: 1RM, niveles y récords personales.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Gym Rankeds",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${doto.variable} ${spaceGrotesk.variable} ${spaceMono.variable} h-full`}>
      <body className="min-h-full bg-black text-[#E8E8E8] antialiased">
        <div className="mx-auto flex min-h-screen max-w-md flex-col">
          <main className="flex-1 px-4 pb-24 pt-6">{children}</main>
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
