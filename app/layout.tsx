import type { Metadata } from "next";

import { Navigation } from "@/components/navigation";
import { APP_NAME } from "@/lib/constants";
import { getUiLanguage } from "@/lib/ui-language";

import "./globals.css";

export const metadata: Metadata = {
  title: APP_NAME,
  description: "LAN-ready e-commerce image generation studio powered by Gemini.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const language = await getUiLanguage();

  return (
    <html lang={language}>
      <body>
        <div className="app-shell">
          <Navigation language={language} />
          <main className="main-content">{children}</main>
        </div>
      </body>
    </html>
  );
}
