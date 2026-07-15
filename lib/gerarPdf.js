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
