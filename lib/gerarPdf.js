export async function gerarPdfBlob(documentoElement) {
  const { pdf } = await import("@react-pdf/renderer");
  const instance = pdf(documentoElement);
  return instance.toBlob();
}

export async function baixarPdf(documentoElement, nomeArquivo) {
  const blob = await gerarPdfBlob(documentoElement);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Compartilha o PDF de verdade (o arquivo, não um link) via API nativa de
// compartilhamento do celular — evita expor a URL local (blob:...) que
// aparece se o navegador tentar "compartilhar" o link de download em vez do
// arquivo. Em navegadores sem suporte (a maioria dos desktops), cai pro
// download tradicional, e quem chamou decide o que fazer a seguir (ex.: abrir
// o WhatsApp Web na conversa do cliente pra anexar manualmente).
export async function compartilharPdf(documentoElement, nomeArquivo, mensagem) {
  const blob = await gerarPdfBlob(documentoElement);
  const file = new File([blob], nomeArquivo, { type: "application/pdf" });

  if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], text: mensagem });
    return "compartilhado";
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return "baixado";
}

export async function imprimirPdf(documentoElement) {
  const blob = await gerarPdfBlob(documentoElement);
  const url = URL.createObjectURL(blob);

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.src = url;
  document.body.appendChild(iframe);

  iframe.onload = () => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
  };

  setTimeout(() => {
    URL.revokeObjectURL(url);
    iframe.remove();
  }, 60000);
}
