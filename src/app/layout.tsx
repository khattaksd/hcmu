import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://hcmu.vercel.app"),
  title: {
    default: "How Cars Measure Up — Canada Vehicle Insurance Rate Indexes",
    template: "%s · HCMU Explorer",
  },
  description:
    "Explore national vehicle insurance rate indexes from the Insurance Bureau of Canada — Collision, Comp, DCPD, AB, and Theft frequency by make, model, and year.",
  applicationName: "HCMU Explorer",
  keywords: [
    "car insurance",
    "vehicle insurance rates",
    "How Cars Measure Up",
    "Insurance Bureau of Canada",
    "claim cost index",
    "Canada auto insurance",
    "theft frequency",
    "DCPD",
  ],
  creator: "HCMU Explorer",
  category: "Finance",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_CA",
    url: "/",
    siteName: "HCMU Explorer",
    title: "How Cars Measure Up — Canada Vehicle Insurance Rate Indexes",
    description:
      "Compare vehicle insurance claim cost indexes from the Insurance Bureau of Canada across Collision, Comp, DCPD, AB, and Theft metrics.",
  },
  twitter: {
    card: "summary",
    title: "How Cars Measure Up — Canada Vehicle Insurance Rate Indexes",
    description:
      "Compare vehicle insurance claim cost indexes from the Insurance Bureau of Canada across make, model, and year.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/icon.svg",
  },
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