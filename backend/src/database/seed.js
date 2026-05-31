const prisma = require('./prisma');

async function seed() {
  const count = await prisma.fluxo.count();
  if (count > 0) {
    console.log('[SEED] Banco já possui dados, pulando seed.');
    return;
  }

  const mapa = {
    nodes: [
      { id: 'start', type: 'startNode', position: { x: 300, y: 0 }, data: {} },
      { id: 'msg1', type: 'messageNode', position: { x: 250, y: 120 }, data: { text: 'Olá! Seja muito bem-vindo(a)! 👋' } },
      { id: 'msg2', type: 'messageNode', position: { x: 250, y: 260 }, data: { text: 'Como podemos te ajudar hoje?' } },
      {
        id: 'menu1',
        type: 'menuNode',
        position: { x: 200, y: 400 },
        data: {
          text: 'Escolha uma das opções abaixo:',
          opcoes: [
            { id: 'opt1', numero: '1', label: 'Confirmar horários' },
            { id: 'opt2', numero: '2', label: 'Falar com o comercial' },
            { id: 'opt3', numero: '3', label: 'Estou com uma dúvida' },
            { id: 'opt4', numero: '4', label: 'Suporte técnico' },
          ],
        },
      },
      { id: 'resp1', type: 'messageNode', position: { x: -100, y: 680 }, data: { text: 'Nosso horário de funcionamento é de segunda a sexta, das 08:00 às 18:00. Aos sábados das 08:00 às 12:00.' } },
      { id: 'resp2', type: 'messageNode', position: { x: 150, y: 680 }, data: { text: 'Vou te transferir para o setor comercial. Aguarde um momento!\n\nOu entre em contato diretamente: https://wa.me/556199999999' } },
      { id: 'resp3', type: 'messageNode', position: { x: 400, y: 680 }, data: { text: 'Por favor, descreva sua dúvida que vamos te ajudar!' } },
      { id: 'resp4', type: 'messageNode', position: { x: 650, y: 680 }, data: { text: 'Para suporte técnico, descreva o problema que você está enfrentando. Nossa equipe vai analisar.' } },
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'msg1', type: 'smoothstep', animated: true },
      { id: 'e2', source: 'msg1', target: 'msg2', type: 'smoothstep', animated: true },
      { id: 'e3', source: 'msg2', target: 'menu1', type: 'smoothstep', animated: true },
      { id: 'e4', source: 'menu1', sourceHandle: 'opt1', target: 'resp1', type: 'smoothstep' },
      { id: 'e5', source: 'menu1', sourceHandle: 'opt2', target: 'resp2', type: 'smoothstep' },
      { id: 'e6', source: 'menu1', sourceHandle: 'opt3', target: 'resp3', type: 'smoothstep' },
      { id: 'e7', source: 'menu1', sourceHandle: 'opt4', target: 'resp4', type: 'smoothstep' },
    ],
  };

  await prisma.fluxo.create({
    data: {
      nome: 'Atendimento Principal',
      gatilhos: 'oi,olá,ola,menu,inicio,começar,comecar,bom dia,boa tarde,boa noite',
      ativo: true,
      horarioInicio: '08:00',
      horarioFim: '18:00',
      msgForaHorario: 'Nosso horário de atendimento é de segunda a sexta, das 08:00 às 18:00. Deixe sua mensagem que responderemos assim que possível!',
      mapa: JSON.stringify(mapa),
    },
  });

  console.log('[SEED] Fluxo visual criado com sucesso!');
}

seed()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
