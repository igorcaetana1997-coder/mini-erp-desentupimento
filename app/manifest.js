export default function manifest() {
  return {
    name: "Real Leader Desentupidora — Painel",
    short_name: "Real Leader",
    description: "Gestão de clientes e ordens de serviço da Real Leader Desentupidora",
    start_url: "/",
    display: "standalone",
    background_color: "#142D65",
    theme_color: "#142D65",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
