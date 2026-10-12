import type { Metadata } from "next";
import { PortalModeSwitch } from "@/components/portal-mode-switch";
import "./globals.css";

export const metadata: Metadata = {
  title: "Novaris City NCPD | Cổng công dân & MDT",
  description: "Cổng thông tin công dân và hệ thống tác nghiệp nội bộ NCPD, Novaris City (FiveM Roleplay)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              'try{var savedTheme=localStorage.getItem("lspd-theme");if(savedTheme==="light")document.documentElement.dataset.theme="light"}catch(e){console.warn("Could not read the saved theme preference.",e)}',
          }}
        />
      </head>
      <body className="min-h-screen">
        {children}
        <PortalModeSwitch />
      </body>
    </html>
  );
}
