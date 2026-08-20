import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#1d1e1b",
};

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  const origin = host ? `${protocol}://${host}` : "http://localhost:3000";
  const socialImage = new URL("/og.png", origin).toString();

  return {
    title: "Liftly — Your Adaptive Training Plan",
    description:
      "Build a gym plan around your goal, schedule, experience, and equipment—then log every workout as you progress.",
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "Liftly",
    },
    icons: {
      icon: [
        {
          url: "/liftly-icon.png",
          type: "image/png",
        },
      ],
      shortcut: ["/liftly-icon.png"],
      apple: [
        {
          url: "/liftly-icon.png",
          type: "image/png",
        },
      ],
    },
    openGraph: {
      title: "Liftly — Train Smarter. Show Up Stronger.",
      description: "A gym plan that adapts to your goal, schedule, and equipment.",
      type: "website",
      images: [
        {
          url: socialImage,
          width: 1733,
          height: 909,
          alt: "Liftly, train smarter and show up stronger",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Liftly — Train Smarter. Show Up Stronger.",
      description: "A gym plan that adapts to your goal, schedule, and equipment.",
      images: [socialImage],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
