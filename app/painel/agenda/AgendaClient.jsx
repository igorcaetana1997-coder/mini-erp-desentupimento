"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import Ticket from "@/components/Ticket";
import EmptyState from "@/components/EmptyState";

function todayInputValue() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

export default function AgendaClient() {
  const [osList, setOsList] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState(todayInputValue);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/ordens");
        if (!res.ok) throw new Error();
        setOsList(await res.json());
      } catch {
        setError("Não foi possível carregar as ordens de serviço.");
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const doDia = useMemo(() => {
    return osList
      .filter((os) => {
        const d = new Date(os.scheduledAt);
        const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
        return iso === selectedDate;
      })
      .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  }, [osList, selectedDate]);

  if (!loaded) {
    return <div className="max-w-3xl mx-auto p-6 text-[rgb(var(--ink))] text-sm">Carregando…</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-black uppercase tracking-tight text-[rgb(var(--ink-strong)/1)] text-xl">Agenda do dia</h1>
        <div className="flex items-center gap-2 bg-[rgb(var(--input-bg))] border border-[rgb(var(--border-strong)/0.2)] px-2 py-1.5">
          <CalendarDays size={16} className="text-[#1E7A52]" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-sm outline-none text-[rgb(var(--ink-strong)/1)]"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 border border-[#A02018]/40 bg-[#A02018]/10 text-[#A02018] text-sm px-3 py-2">
          {error}
        </div>
      )}

      <p className="text-xs text-[rgb(var(--ink))] mb-3">
        {doDia.length} visita(s) agendada(s), em ordem de horário
      </p>

      <div className="flex flex-col gap-3">
        {doDia.length === 0 && <EmptyState text="Nenhuma OS agendada para este dia." />}
        {doDia.map((os) => (
          <Ticket key={os.id} os={os} />
        ))}
      </div>
    </div>
  );
}
