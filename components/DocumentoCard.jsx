"use client";

import { COMPANY } from "@/lib/company";

export default function DocumentoCard({
  kicker,
  numero,
  titulo,
  stampLabel,
  stampBg = "#1E7A52",
  stampText = "#F2EFE9",
  hash,
  emitidoEm,
  children,
}) {
  const stamp = { background: stampBg, color: stampText };

  return (
    <div className="doc-page">
      <div className="watermark">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-icon-outline.png" alt="" />
      </div>

      <div className="doc-inner">
        <div className="letterhead">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="brand-logo" src="/logo-horizontal-outline.png" alt="Real Leader Desentupidora" />
          <table className="fiscal-table">
            <tbody>
              <tr>
                <td className="razao" colSpan={2}>{COMPANY.razaoSocial.toUpperCase()}</td>
              </tr>
              <tr>
                <td className="fantasia" colSpan={2}>{COMPANY.nomeFantasia}</td>
              </tr>
              <tr>
                <td className="k">CNPJ</td>
                <td className="v">{COMPANY.cnpj}</td>
              </tr>
              <tr>
                <td className="k">Endereço</td>
                <td className="v">{COMPANY.endereco}</td>
              </tr>
              <tr>
                <td className="k">Bairro</td>
                <td className="v">{COMPANY.bairroCidade}</td>
              </tr>
              <tr>
                <td className="k">CEP</td>
                <td className="v">{COMPANY.cep}</td>
              </tr>
              <tr>
                <td className="k">Telefone</td>
                <td className="v">{COMPANY.telefone}</td>
              </tr>
              <tr>
                <td className="k">E-mail</td>
                <td className="v">{COMPANY.email}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="doc-title-row">
          <div>
            <p className="doc-kicker">{kicker}</p>
            <p className="doc-num">{numero}</p>
            <p className="doc-service">{titulo}</p>
          </div>
          <span className="stamp" style={stamp}>{stampLabel}</span>
        </div>

        {children}
      </div>

      <div className="legal-footer">
        <p className="legal-text">
          <b>{COMPANY.razaoSocial}</b> — CNPJ {COMPANY.cnpj}
          <br />
          Documento emitido eletronicamente pelo sistema em {emitidoEm}.
        </p>
        <p className="doc-hash">{hash}</p>
      </div>

      <style jsx>{`
        .doc-page {
          width: 210mm;
          min-height: 297mm;
          background: #ffffff;
          color: #4a4437;
          font-family: Georgia, "Times New Roman", "Iowan Old Style", serif;
          position: relative;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .watermark {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          z-index: 0;
        }
        .watermark img {
          width: 170mm;
          opacity: 0.035;
        }
        .doc-inner {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          flex: 1;
          padding: 16mm 15mm 6mm;
        }
        .letterhead {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          padding-bottom: 6mm;
          border-bottom: 2.5px solid #142d65;
        }
        .brand-logo {
          height: 14mm;
          width: auto;
          display: block;
        }
        .fiscal-table {
          margin-left: auto;
          border-collapse: collapse;
        }
        .fiscal-table td {
          font-size: 10.5px;
          color: #4a4437;
          line-height: 1.5;
          padding: 1.5px 0;
          white-space: nowrap;
        }
        .fiscal-table td.razao {
          text-align: right;
          font-weight: 800;
          font-size: 13px;
          color: #142d65;
          font-family: "Helvetica Neue", Arial, sans-serif;
          padding-bottom: 2px;
        }
        .fiscal-table td.fantasia {
          text-align: right;
          font-size: 10px;
          color: #948c7d;
          font-style: italic;
          padding-bottom: 8px;
        }
        .fiscal-table td.k {
          font-family: "Helvetica Neue", Arial, sans-serif;
          font-size: 8.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #948c7d;
          text-align: right;
          padding-right: 8px;
        }
        .fiscal-table td.v {
          text-align: left;
          font-variant-numeric: tabular-nums;
        }
        .doc-title-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          padding: 22px 0 18px;
        }
        .doc-kicker {
          font-family: "Helvetica Neue", Arial, sans-serif;
          font-size: 10.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: #142d65;
          margin: 0 0 5px;
        }
        .doc-num {
          font-size: 11.5px;
          color: #948c7d;
          margin: 0 0 6px;
          font-variant-numeric: tabular-nums;
        }
        .doc-service {
          font-family: "Helvetica Neue", Arial, sans-serif;
          font-weight: 800;
          font-size: 23px;
          color: #221d14;
          line-height: 1.15;
        }
        .stamp {
          font-family: "Helvetica Neue", Arial, sans-serif;
          display: inline-block;
          padding: 6px 14px;
          font-size: 10.5px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          transform: rotate(-2deg);
          border: 2px solid rgba(0, 0, 0, 0.15);
          white-space: nowrap;
          flex: none;
        }
        .legal-footer {
          position: relative;
          z-index: 1;
          margin-top: auto;
          padding: 14px 15mm 10mm;
          border-top: 1.5px solid rgba(20, 45, 101, 0.25);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .legal-text {
          font-size: 9.5px;
          color: #948c7d;
          line-height: 1.55;
          margin: 0;
        }
        .legal-text b {
          color: #635b4c;
          font-weight: 700;
        }
        .doc-hash {
          font-size: 9px;
          color: #b7af9e;
          font-variant-numeric: tabular-nums;
          white-space: nowrap;
          margin: 0;
        }
      `}</style>
    </div>
  );
}
