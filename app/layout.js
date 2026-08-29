import { Poppins } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Providers from "@/components/Providers";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
});

export const metadata = {
  title: "Real Leader Desentupidora — Painel",
  description: "Gestão de clientes e ordens de serviço da Real Leader Desentupidora",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Real Leader",
  },
  icons: {
    apple: "/icon.png",
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

export const viewport = {
  themeColor: "#142D65",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const NO_FLASH_THEME_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    var theme = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    if (theme === 'dark') document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

const REGISTER_SW_SCRIPT = `
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(function () {});
}
`;

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={poppins.variable} suppressHydrationWarning>
      <head>
        <Script id="theme-no-flash" strategy="beforeInteractive">
          {NO_FLASH_THEME_SCRIPT}
        </Script>
      </head>
      <body className="font-sans">
        <Providers>{children}</Providers>
        <Script id="register-sw" strategy="afterInteractive">
          {REGISTER_SW_SCRIPT}
        </Script>
      </body>
    </html>
  );
}
