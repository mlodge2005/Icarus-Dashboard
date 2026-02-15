import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Icarus Dashboard",
  description: "Operational dashboard for Icarus",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="appShell">{children}</div>
      </body>
    </html>
  );
}
