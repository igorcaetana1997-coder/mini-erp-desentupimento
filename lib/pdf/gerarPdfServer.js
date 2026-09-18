import { pdf } from "@react-pdf/renderer";

// `pdf(elemento).toBuffer()` do @react-pdf/renderer, apesar do nome, retorna
// uma Promise de um Readable do Node (não um Buffer) — precisa coletar os
// chunks manualmente.
export async function gerarPdfBufferServer(documentoElement) {
  const stream = await pdf(documentoElement).toBuffer();
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}
