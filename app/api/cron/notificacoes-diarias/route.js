import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isWhatsappConfigured, sendWhatsappMessage } from "@/lib/whatsapp";

const DIAS_FOLLOW_UP = 15;

// Disparada 1x por dia pelo Vercel Cron (ver vercel.json). Enquanto o WhatsApp (Z-API) não
// estiver configurado, não toca no banco — só confirma que está pronta e dormente.
export async function GET(req) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  if (!isWhatsappConfigured()) {
    return NextResponse.json({ enviado: false, motivo: "Z-API não configurado ainda" });
  }

  const resultado = {
    followUp: { enviados: 0, falhas: 0 },
    aniversario: { enviados: 0, falhas: 0 },
  };

  const hoje = new Date();

  // Acompanhamento pós-serviço: OS concluídas há exatamente DIAS_FOLLOW_UP dias.
  const alvoInicio = new Date(
    Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate() - DIAS_FOLLOW_UP)
  );
  const alvoFim = new Date(alvoInicio);
  alvoFim.setUTCDate(alvoFim.getUTCDate() + 1);

  const osParaFollowUp = await prisma.ordemServico.findMany({
    where: {
      status: "concluida",
      concluidaEm: { gte: alvoInicio, lt: alvoFim },
      followUpEnviadoEm: null,
    },
    include: { cliente: true },
  });

  for (const os of osParaFollowUp) {
    try {
      const mensagem = `Olá ${os.cliente.name}! Aqui é da Real Leader Desentupidora 😊 Faz ${DIAS_FOLLOW_UP} dias que concluímos o serviço de ${os.serviceType} aí na sua casa. Ficou tudo certo? Qualquer problema, é só responder aqui que a gente resolve!`;
      await sendWhatsappMessage(os.cliente.phone, mensagem);
      await prisma.ordemServico.update({
        where: { id: os.id },
        data: { followUpEnviadoEm: new Date() },
      });
      resultado.followUp.enviados++;
    } catch (err) {
      console.error(`[cron] Falha ao enviar follow-up da OS ${os.id}:`, err);
      resultado.followUp.falhas++;
    }
  }

  // Aniversário: clientes cujo dataNascimento cai hoje (mês/dia) e ainda não foram parabenizados este ano.
  const anoAtual = hoje.getUTCFullYear();
  const mesHoje = hoje.getUTCMonth();
  const diaHoje = hoje.getUTCDate();

  const clientesComAniversario = await prisma.cliente.findMany({
    where: { dataNascimento: { not: null } },
  });

  const aniversariantes = clientesComAniversario.filter((c) => {
    const nasc = new Date(c.dataNascimento);
    return (
      nasc.getUTCMonth() === mesHoje &&
      nasc.getUTCDate() === diaHoje &&
      c.ultimoParabensAno !== anoAtual
    );
  });

  for (const cliente of aniversariantes) {
    try {
      const mensagem = `Feliz aniversário, ${cliente.name}! 🎉 A equipe da Real Leader Desentupidora deseja um dia repleto de alegria. Conte sempre com a gente!`;
      await sendWhatsappMessage(cliente.phone, mensagem);
      await prisma.cliente.update({
        where: { id: cliente.id },
        data: { ultimoParabensAno: anoAtual },
      });
      resultado.aniversario.enviados++;
    } catch (err) {
      console.error(`[cron] Falha ao enviar parabéns pro cliente ${cliente.id}:`, err);
      resultado.aniversario.falhas++;
    }
  }

  return NextResponse.json({ enviado: true, ...resultado });
}
