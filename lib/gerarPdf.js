export async function gerarPdfBlob(documentoElement) {
  const { pdf } = await import("@react-pdf/renderer");
  const instance = pdf(documentoElement);
  return instance.toBlob();
}

export async function compartilharOuBaixarPdf(documentoElement, nomeArquivo, textoCompartilhar) {
  const blob = await gerarPdfBlob(documentoElement);
  const arquivo = new File([blob], nomeArquivo, { type: "application/pdf" });

  if (navigator.canShare && navigator.canShare({ files: [arquivo] })) {
    await navigator.share({ files: [arquivo], title: nomeArquivo, text: textoCompartilhar });
    return "compartilhado";
  }

  const url = URL.createObjectURL(arquivo);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return "baixado";
}
