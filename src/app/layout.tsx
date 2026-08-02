import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "How Cars Measure Up — Canada Vehicle Insurance Rate Indexes",
  description:
    "Explore national vehicle insurance rate indexes from the Insurance Bureau of Canada — Collision, Comp, DCPD, AB, and Theft frequency by make, model, and year.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}