import type { Metadata } from "next";
import "./globals.css";
import { russoOne } from "./ui/fonts";
import { AuthProvider } from "./components/authContext";

export const metadata: Metadata = {
  title: "Auth Tutorial",
  description: "A simple authentication tutorial using Next.js and Firebase",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${russoOne.className} antialiased bg-slate-950`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
