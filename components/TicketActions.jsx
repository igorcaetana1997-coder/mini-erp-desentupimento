"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  Check,
  Ban,
  Wrench,
  Star,
  FileText,
  RotateCcw,
  Camera,
  CircleDollarSign,
  Undo2,
  Trash2,
  Pencil,
  X,
} from "lucide-react";
import ConcluirOsModal from "./ConcluirOsModal";
import RecusarOsModal from "./RecusarOsModal";
import EditarOsModal from "./EditarOsModal";
import { resizeImageToDataUrl } from "@/lib/resizeImage";
import { getStatusPagamento } from "@/lib/paymentStatus";

export default function TicketActions({
  os,
  role,
  isOwner,
  tecnicos,
  parceiros = [],
  busy,
  onAvancar,
  onRecusar,
  onConcluir,
  onReabrir,
  onSalvarMateriais,
  onSalvarAvaliacao,
  onFotoAdicionada,
  onFotoRemovida,
  onSalvarValor,
  onRegistrarPagamento,
  onEditarOs,
  onExcluir,
}) {
  const [showConcluir, setShowConcluir] = useState(false);
  const [showRecusar, setShowRecusar] = useState(false);
  const [showEditar, setShowEditar] = useState(false);
  const [editingMateriais, setEditingMateriais] = useState(false);
  const [materiaisDraft, setMateriaisDraft] = useState(os.materiais || "");
  const [editingValor, setEditingValor] = useState(false);
  const [valorDraft, setValorDraft] = useState(os.value != null ? String(os.value) : "");
  const [editingPagamento, setEditingPagamento] = useState(false);
  const [valorPagoDraft, setValorPagoDraft] = useState("");
  const [reatribuindo, setReatribuindo] = useState(false);
  const [novoTecnico, setNovoTecnico] = useState(os.technicianId || "");
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [fotoError, setFotoError] = useState("");
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [fotoAmpliada, setFotoAmpliada] = useState(null);
  const fileInputRef = useRef(null);

  const isAdmin = role === "admin";
  // Ações operacionais (avançar/recusar/concluir/materiais/fotos/avaliação) continuam
  // só pra admin ou o técnico dono — parceiro não opera o fluxo do serviço.
  const canOperate = isAdmin || (isOwner && role === "tecnico");
  // Editar o valor é mais amplo: técnico OU parceiro dono, além do admin.
  const podeEditarValor = isOwner && (role === "tecnico" || role === "parceiro");
  const valorEditavelAgora = podeEditarValor && ["aberta", "andamento"].includes(os.status);
  const { status: statusPagamento, faltante } = getStatusPagamento(os);

  const handleFotoSelecionada = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !onFotoAdicionada) return;
    setEnviandoFoto(true);
    setFotoError("");
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      const res = await fetch(`/api/ordens/${os.id}/fotos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: dataUrl }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Não foi possível enviar a foto");
      onFotoAdicionada(os.id, json);
    } catch (err) {
      setFotoError(err.message || "Não foi possível enviar a foto");
    } finally {
      setEnviandoFoto(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      {os.status === "aberta" && canOperate && (
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => onAvancar(os.id)}
            disabled={busy}
            className="flex-1 flex items-center justify-center gap-1.5 bg-[#142D65] text-[#F2EFE9] text-xs font-bold uppercase tracking-wide py-2 hover:bg-[#203D7B] transition-colors disabled:opacity-50"
          >
            <Check size={14} /> Marcar como em andamento
          </button>
          {!isAdmin && isOwner && (
            <button
              type="button"
              onClick={() => setShowRecusar(true)}
              disabled={busy}
              className="flex items-center justify-center gap-1.5 border-2 border-[#A02018] text-[#A02018] text-xs font-bold uppercase tracking-wide px-3 hover:bg-[#A02018]/10 transition-colors disabled:opacity-50"
            >
              <Ban size={14} /> Recusar
            </button>
          )}
        </div>
      )}

      {os.status === "andamento" && canOperate && (
        <button
          type="button"
          onClick={() => setShowConcluir(true)}
          disabled={busy}
          className="flex items-center justify-center gap-1.5 bg-[#142D65] text-[#F2EFE9] text-xs font-bold uppercase tracking-wide py-2 hover:bg-[#203D7B] transition-colors disabled:opacity-50"
        >
          <Check size={14} /> Concluir OS
        </button>
      )}

      {os.status === "recusada" && isAdmin && (
        <div className="flex flex-col gap-1.5">
          {!reatribuindo ? (
            <button
              type="button"
              onClick={() => setReatribuindo(true)}
              className="flex items-center justify-center gap-1.5 border-2 border-[rgb(var(--border-strong)/1)] text-[rgb(var(--ink-strong)/1)] text-xs font-bold uppercase tracking-wide py-2 hover:bg-[#142D65]/5 transition-colors"
            >
              <RotateCcw size={14} /> Reatribuir e reabrir
            </button>
          ) : (
            <div className="flex flex-col gap-1.5">
              <select
                value={novoTecnico}
                onChange={(e) => setNovoTecnico(e.target.value)}
                className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52]"
              >
                <option value="">Sem técnico designado</option>
                {tecnicos.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  onReabrir(os.id, novoTecnico || null);
                  setReatribuindo(false);
                }}
                className="flex items-center justify-center gap-1.5 bg-[#1E7A52] text-[#F2EFE9] text-xs font-bold uppercase tracking-wide py-2 hover:bg-[#175F40] transition-colors disabled:opacity-50"
              >
                Confirmar reabertura
              </button>
            </div>
          )}
        </div>
      )}

      {isAdmin && onRegistrarPagamento && os.status !== "recusada" && os.value != null && (
        <div>
          {statusPagamento === "pago" ? (
            <div className="flex items-center justify-between gap-2 bg-[#1E7A52]/10 border border-[#1E7A52]/30 px-2 py-1.5">
              <span className="text-[11px] font-semibold text-[#1E7A52]">
                Pagamento confirmado (R$ {Number(os.value).toFixed(2)})
              </span>
              <button
                type="button"
                disabled={busy}
                onClick={() => onRegistrarPagamento(os.id, 0)}
                className="flex items-center gap-1 text-[11px] text-[rgb(var(--stone))] hover:text-[#A02018] transition-colors disabled:opacity-50"
              >
                <Undo2 size={12} /> Desfazer
              </button>
            </div>
          ) : !editingPagamento ? (
            <button
              type="button"
              onClick={() => {
                setValorPagoDraft(String(os.value));
                setEditingPagamento(true);
              }}
              className="w-full flex items-center justify-center gap-1.5 bg-[#1E7A52] text-[#F2EFE9] text-xs font-bold uppercase tracking-wide py-2 hover:bg-[#175F40] transition-colors disabled:opacity-50"
            >
              <CircleDollarSign size={14} />
              {statusPagamento === "parcial"
                ? `Registrar pagamento (falta R$ ${faltante.toFixed(2)})`
                : "Registrar pagamento"}
            </button>
          ) : (
            <div className="flex flex-col gap-1.5">
              <input
                autoFocus
                type="number"
                value={valorPagoDraft}
                onChange={(e) => setValorPagoDraft(e.target.value)}
                placeholder="Valor recebido (R$)"
                className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52]"
              />
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setEditingPagamento(false)}
                  className="flex-1 border border-[rgb(var(--border-strong)/0.3)] text-[rgb(var(--ink-strong)/1)] text-[11px] font-bold uppercase py-1.5 hover:bg-[#142D65]/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    onRegistrarPagamento(os.id, valorPagoDraft);
                    setEditingPagamento(false);
                  }}
                  className="flex-1 bg-[#1E7A52] text-[#F2EFE9] text-[11px] font-bold uppercase py-1.5 hover:bg-[#175F40] transition-colors disabled:opacity-50"
                >
                  Salvar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {canOperate && os.status !== "concluida" && os.status !== "recusada" && (
        <div>
          {!editingMateriais ? (
            <button
              type="button"
              onClick={() => setEditingMateriais(true)}
              className="flex items-center gap-1.5 text-[11px] text-[rgb(var(--ink))] hover:text-[rgb(var(--ink-strong)/1)] transition-colors"
            >
              <Wrench size={12} /> {os.materiais ? "Editar materiais" : "Registrar materiais usados"}
            </button>
          ) : (
            <div className="flex flex-col gap-1.5">
              <textarea
                autoFocus
                value={materiaisDraft}
                onChange={(e) => setMateriaisDraft(e.target.value)}
                rows={2}
                placeholder="Ex: mangueira de alta pressão, vedante, 2m de cano PVC"
                className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52] resize-none"
              />
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setEditingMateriais(false)}
                  className="flex-1 border border-[rgb(var(--border-strong)/0.3)] text-[rgb(var(--ink-strong)/1)] text-[11px] font-bold uppercase py-1.5 hover:bg-[#142D65]/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    onSalvarMateriais(os.id, materiaisDraft);
                    setEditingMateriais(false);
                  }}
                  className="flex-1 bg-[#1E7A52] text-[#F2EFE9] text-[11px] font-bold uppercase py-1.5 hover:bg-[#175F40] transition-colors disabled:opacity-50"
                >
                  Salvar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {valorEditavelAgora && onSalvarValor && (
        <div>
          {!editingValor ? (
            <button
              type="button"
              onClick={() => {
                setValorDraft(os.value != null ? String(os.value) : "");
                setEditingValor(true);
              }}
              className="flex items-center gap-1.5 text-[11px] text-[rgb(var(--ink))] hover:text-[rgb(var(--ink-strong)/1)] transition-colors"
            >
              <CircleDollarSign size={12} /> Editar valor do serviço
            </button>
          ) : (
            <div className="flex flex-col gap-1.5">
              <input
                autoFocus
                type="number"
                value={valorDraft}
                onChange={(e) => setValorDraft(e.target.value)}
                placeholder="Valor (R$)"
                className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52]"
              />
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setEditingValor(false)}
                  className="flex-1 border border-[rgb(var(--border-strong)/0.3)] text-[rgb(var(--ink-strong)/1)] text-[11px] font-bold uppercase py-1.5 hover:bg-[#142D65]/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    onSalvarValor(os.id, valorDraft);
                    setEditingValor(false);
                  }}
                  className="flex-1 bg-[#1E7A52] text-[#F2EFE9] text-[11px] font-bold uppercase py-1.5 hover:bg-[#175F40] transition-colors disabled:opacity-50"
                >
                  Salvar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {canOperate && os.status !== "recusada" && (
        <div className="flex flex-col gap-1.5">
          {Array.isArray(os.fotos) && os.fotos.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {os.fotos.map((foto) => (
                <div key={foto.id} className="relative w-14 h-14">
                  <button
                    type="button"
                    onClick={() => setFotoAmpliada(foto)}
                    className="block w-full h-full"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={foto.data}
                      alt="Foto do serviço"
                      className="w-14 h-14 object-cover border border-[rgb(var(--border-strong)/0.3)]"
                    />
                  </button>
                  {onFotoRemovida && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onFotoRemovida(os.id, foto.id);
                      }}
                      title="Excluir foto"
                      className="absolute -top-1.5 -right-1.5 bg-[#A02018] text-[#F2EFE9] rounded-full p-0.5 shadow"
                    >
                      <X size={10} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={enviandoFoto}
            className="flex items-center gap-1.5 text-[11px] text-[rgb(var(--ink))] hover:text-[rgb(var(--ink-strong)/1)] transition-colors disabled:opacity-50"
          >
            <Camera size={12} /> {enviandoFoto ? "Enviando foto…" : "Anexar foto do serviço"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFotoSelecionada}
            className="hidden"
          />
          {fotoError && <p className="text-[11px] text-[#A02018]">{fotoError}</p>}
        </div>
      )}

      {os.status === "concluida" && (
        <div className="flex flex-col gap-2">
          {canOperate && (
            <div>
              <p className="text-[11px] text-[rgb(var(--ink))] mb-1">Avaliação do serviço:</p>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    disabled={busy}
                    onClick={() => onSalvarAvaliacao(os.id, n === os.avaliacaoNota ? null : n)}
                  >
                    <Star
                      size={18}
                      className={n <= (os.avaliacaoNota || 0) ? "text-[#E8A33D] fill-[#E8A33D]" : "text-[rgb(var(--ink-strong)/0.25)]"}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
          <Link
            href={`/ordens/${os.id}/recibo`}
            target="_blank"
            className="flex items-center justify-center gap-1.5 border-2 border-[rgb(var(--border-strong)/1)] text-[rgb(var(--ink-strong)/1)] text-xs font-bold uppercase tracking-wide py-2 hover:bg-[#142D65]/5 transition-colors"
          >
            <FileText size={14} /> Ver recibo / gerar PDF
          </Link>
        </div>
      )}

      {isAdmin && onEditarOs && (
        <button
          type="button"
          onClick={() => setShowEditar(true)}
          className="flex items-center justify-center gap-1.5 border-2 border-[rgb(var(--border-strong)/1)] text-[rgb(var(--ink-strong)/1)] text-xs font-bold uppercase tracking-wide py-2 hover:bg-[#142D65]/5 transition-colors"
        >
          <Pencil size={14} /> Editar OS
        </button>
      )}

      {isAdmin && onExcluir && (
        <div className="pt-1.5 mt-0.5 border-t border-dashed border-[rgb(var(--border-strong)/0.2)]">
          {!confirmandoExclusao ? (
            <button
              type="button"
              onClick={() => setConfirmandoExclusao(true)}
              className="flex items-center gap-1.5 text-[11px] text-[rgb(var(--stone))] hover:text-[#A02018] transition-colors"
            >
              <Trash2 size={12} /> Excluir OS
            </button>
          ) : (
            <div className="flex items-center justify-between gap-2 bg-[#A02018]/10 border border-[#A02018]/30 px-2 py-1.5">
              <span className="text-[11px] text-[#A02018]">Excluir esta OS definitivamente?</span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setConfirmandoExclusao(false)}
                  className="text-[11px] text-[rgb(var(--ink))] hover:text-[rgb(var(--ink-strong)/1)] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onExcluir(os.id)}
                  className="text-[11px] font-bold text-[#A02018] hover:underline disabled:opacity-50"
                >
                  Confirmar exclusão
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showConcluir && (
        <ConcluirOsModal
          os={os}
          saving={busy}
          onCancel={() => setShowConcluir(false)}
          onConfirm={(payload) => {
            onConcluir(os.id, payload);
            setShowConcluir(false);
          }}
        />
      )}

      {showRecusar && (
        <RecusarOsModal
          os={os}
          saving={busy}
          onCancel={() => setShowRecusar(false)}
          onConfirm={(motivo) => {
            onRecusar(os.id, motivo);
            setShowRecusar(false);
          }}
        />
      )}

      {showEditar && (
        <EditarOsModal
          os={os}
          tecnicos={tecnicos}
          parceiros={parceiros}
          saving={busy}
          onCancel={() => setShowEditar(false)}
          onConfirm={(payload) => {
            onEditarOs(os.id, payload);
            setShowEditar(false);
          }}
        />
      )}

      {fotoAmpliada && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setFotoAmpliada(null)}
        >
          <button
            type="button"
            onClick={() => setFotoAmpliada(null)}
            className="absolute top-4 right-4 text-white"
          >
            <X size={28} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fotoAmpliada.data}
            alt="Foto do serviço ampliada"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
