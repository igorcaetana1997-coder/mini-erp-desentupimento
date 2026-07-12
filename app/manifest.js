export default function manifest() {
  return {
    name: "Real Leader Desentupidora",
    short_name: "Real Leader",
    description: "Gestão de clientes e ordens de serviço da Real Leader Desentupidora",
    start_url: "/",
    display: "standalone",
    background_color: "#142D65",
    theme_color: "#142D65",
    icons: [
      {
        src: "/icon.png",
        sizes: "256x256",
        type: "image/png",
      },
    ],
  };
}
