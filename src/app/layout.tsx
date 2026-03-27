import type { Metadata } from "next";
import CookieBanner from "@/components/CookieBanner";

export const metadata: Metadata = {
  title: "LineHop",
  description: "LineHop - Restaurant Waitlist Management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, fontFamily: "system-ui, sans-serif" }}>
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
