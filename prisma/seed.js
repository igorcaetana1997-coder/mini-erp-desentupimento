const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

function todayAt(hour, minute) {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@empresa.com" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@empresa.com",
      password: adminPassword,
      role: "admin",
    },
  });

  const tecnicoPassword = await bcrypt.hash("tecnico123", 10);
  const tecnico = await prisma.user.upsert({
    where: { email: "carlos@empresa.com" },
    update: {},
    create: {
      name: "Carlos Souza",
      email: "carlos@empresa.com",
      password: tecnicoPassword,
      role: "tecnico",
      phone: "(11) 98888-1234",
    },
  });

  const clienteCount = await prisma.cliente.count();
  if (clienteCount === 0) {
    const cliente1 = await prisma.cliente.create({
      data: {
        name: "Maria Fernandes",
        phone: "(11) 97777-5566",
        email: "maria.fernandes@example.com",
        documento: "123.456.789-00",
        dataNascimento: new Date("1985-04-12"),
        cep: "04101-000",
        logradouro: "Rua das Palmeiras",
        numero: "120",
        bairro: "Vila Mariana",
        cidade: "São Paulo",
        uf: "SP",
        observacoes: "Portão azul nos fundos. Tem um cachorro (dócil) no quintal.",
      },
    });
    const cliente2 = await prisma.cliente.create({
      data: {
        name: "Padaria Bom Pão",
        phone: "(11) 96666-4321",
        documento: "12.345.678/0001-90",
        cep: "01310-100",
        logradouro: "Av. Brasil",
        numero: "900",
        complemento: "Loja 2",
        bairro: "Centro",
        cidade: "São Paulo",
        uf: "SP",
        observacoes: "Acesso pelos fundos, horário comercial (7h-19h).",
      },
    });

    await prisma.ordemServico.create({
      data: {
        clienteId: cliente1.id,
        serviceType: "Desentupimento de vaso sanitário",
        technicianId: tecnico.id,
        value: 180,
        scheduledAt: todayAt(9, 30),
        urgent: true,
        status: "aberta",
        paymentMethod: "pix",
        paymentStatus: "pendente",
      },
    });
    await prisma.ordemServico.create({
      data: {
        clienteId: cliente2.id,
        serviceType: "Limpeza de caixa de gordura",
        technicianId: tecnico.id,
        value: 420,
        scheduledAt: todayAt(14, 0),
        urgent: false,
        status: "andamento",
        materiais: "Mangueira de alta pressão, luvas, sacos para resíduo",
        paymentMethod: "boleto",
        paymentStatus: "pendente",
        dueDate: todayAt(23, 59),
      },
    });
  }

  console.log("Seed concluído.");
  console.log("Admin:   admin@empresa.com / admin123");
  console.log("Técnico: carlos@empresa.com / tecnico123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
