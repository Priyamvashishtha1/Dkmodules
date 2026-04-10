import { SiteShell } from "@/components/site-shell";
import "./globals.css";

export const metadata = {
  title: "DK Enterprises CRM + Rewards",
  description: "Customer loyalty, retail CRM, and WhatsApp automation for mobile shops."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}

