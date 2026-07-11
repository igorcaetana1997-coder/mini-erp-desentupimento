"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Check, Ban, Wrench, Star, FileText, RotateCcw, Camera, CircleDollarSign, Undo2, Trash2 } from "lucide-react";
import ConcluirOsModal from "./ConcluirOsModal";
import RecusarOsModal from "./RecusarOsModal";
import { resizeImageToDataUrl } from "@/lib/resizeImage";

export default function TicketActions({
  os,
  role,
  isOwner,
  tecnicos,
  busy,
  onAvancar,
  onRecusar,
  onConcluir,
  onReabrir,
  onSalvarMateriais,
  onSalvarAvaliacao,
  onFotoAdicionada,
  onConfirmarPagamento,
  onExcluir,
}) {
  const [showConcluir, setShowConcluir] = useState(false);
  const [showRecusar, setShowRecusar] = useState(false);
  const [editingMateriais, setEditingMateriais] = useState(false);
  const [materiaisDraft, setMateriaisDraft] = useState(os.materiais || "");
  const [reatribuindo, setReatribuindo] = useState(false);
  const [novoTecnico, setNovoTecnico] = useState(os.technicianId || "");
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [fotoError, setFotoError] = useState("");
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const fileInputRef = useRef(null);

  const isAdmin = role === "admin";
  const canAct = isAdmin || isOwner;

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
      {os.status === "aberta" && canAct && (
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

      {os.status === "andamento" && canAct && (
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

      {isAdmin && os.status !== "recusada" && (
        <div>
          {os.paymentStatus === "pago" ? (
            <div className="flex items-center justify-between gap-2 bg-[#1E7A52]/10 border border-[#1E7A52]/30 px-2 py-1.5">
              <span className="text-[11px] font-semibold text-[#1E7A52]">Pagamento confirmado</span>
              <button
                type="button"
                disabled={busy}
                onClick={() => onConfirmarPagamento(os.id, "pendente")}
                className="flex items-center gap-1 text-[11px] text-[rgb(var(--stone))] hover:text-[#A02018] transition-colors disabled:opacity-50"
              >
                <Undo2 size={12} /> Desfazer
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => onConfirmarPagamento(os.id, "pago")}
              className="w-full flex items-center justify-center gap-1.5 bg-[#1E7A52] text-[#F2EFE9] text-xs font-bold uppercase tracking-wide py-2 hover:bg-[#175F40] transition-colors disabled:opacity-50"
            >
              <CircleDollarSign size={14} /> Confirmar pagamento
            </button>
          )}
        </div>
      )}

      {canAct && os.status !== "concluida" && os.status !== "recusada" && (
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

      {canAct && os.status !== "recusada" && (
        <div className="flex flex-col gap-1.5">
          {Array.isArray(os.fotos) && os.fotos.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {os.fotos.map((foto) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={foto.id}
                  src={foto.data}
                  alt="Foto do serviço"
                  className="w-14 h-14 object-cover border border-[rgb(var(--border-strong)/0.3)]"
                />
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
            capture="environment"
            onChange={handleFotoSelecionada}
            className="hidden"
          />
          {fotoError && <p className="text-[11px] text-[#A02018]">{fotoError}</p>}
        </div>
      )}

      {os.status === "concluida" && canAct && (
        <div className="flex flex-col gap-2">
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
          <Link
            href={`/ordens/${os.id}/recibo`}
            target="_blank"
            className="flex items-center justify-center gap-1.5 border-2 border-[rgb(var(--border-strong)/1)] text-[rgb(var(--ink-strong)/1)] text-xs font-bold uppercase tracking-wide py-2 hover:bg-[#142D65]/5 transition-colors"
          >
            <FileText size={14} /> Ver recibo / gerar PDF
          </Link>
        </div>
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
    </div>
  );
}
