import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Products",
  description: "Browse 200,000 products",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;600&family=Public+Sans:wght@400;500&family=Space+Mono&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}