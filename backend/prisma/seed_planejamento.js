const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const main = async () => {
  // Encontra a primeira conexão ativa para vincular o fluxo
  const conexao = await prisma.conexao.findFirst({ where: { ativo: true } });
  const conexaoId = conexao ? conexao.id : 1;

  const nome = "Planejamento Administrativo";
  
  // --- Lista de Gatilhos Super Robusta ---
  // Inclui saudações, termos administrativos, pedidos e suporte.
  // Graças à inteligência do backend, variações de maiúsculas/minúsculas e acentos já são resolvidas automaticamente!
  const gatilhos = "oi, ola, olá, bom dia, boa tarde, boa noite, tudo bem, opa, eai, ei, ajuda, menu, opcoes, opções, suporte, auxilio, iniciar, comecar, começar, atendimento, planejamento, administrativo, adm, planadm, rotina, rotinas, cronograma, material, materiais, dml, pedido, limpeza, limpar, qr, qrcode, nps, avaliacao, avaliação";
  
  const msgForaHorario = "Estamos fora do horário de atendimento do Planejamento Administrativo.";
  
  // --- Nós com Posicionamento Horizontal Premium (Left-to-Right) ---
  const nodes = [
    {
      id: "start",
      type: "startNode",
      position: { x: 0, y: 300 },
      data: {}
    },
    {
      id: "menu_principal",
      type: "menuNode",
      position: { x: 200, y: 300 },
      data: {
        text: "🏢 *Planejamento Administrativo - Brasal Refrigerantes*\n\nComo posso te ajudar hoje? Selecione uma das opções abaixo:",
        opcoes: [
          { id: "opt_principal_material", numero: "1", label: "📦 Pedido de Material (DML/Escritório)" },
          { id: "opt_principal_nps", numero: "2", label: "📊 Minhas Avaliações de NPS & Rotinas" },
          { id: "opt_principal_limpeza", numero: "3", label: "🧹 Site da Limpeza & Aderência QR Code" }
        ]
      }
    },
    {
      id: "link_material",
      type: "linkNode",
      position: { x: 620, y: 30 },
      data: {
        text: "📦 *Pedido de Material (DML/Escritório)*\n\nVocê pode realizar o seu pedido de inventário e materiais internos acessando o link oficial abaixo:",
        url: "https://inventario-internoo.vercel.app/"
      }
    },
    {
      id: "link_limpeza",
      type: "linkNode",
      position: { x: 620, y: 570 },
      data: {
        text: "🧹 *Portal da Limpeza Brasal*\n\nPara visualizar a aderência de QR Codes e acompanhar o site oficial da limpeza, clique no link abaixo:",
        url: "https://sites.google.com/view/limpezabrasal"
      }
    },
    {
      id: "menu_areas",
      type: "menuNode",
      position: { x: 620, y: 300 },
      data: {
        text: "📊 *NPS e Rotinas por Área*\n\nSelecione o seu setor/área abaixo para receber o QR Code correspondente e a rotina do setor:",
        opcoes: [
          { id: "opt_area_industria", numero: "1", label: "🏭 Indústria" },
          { id: "opt_area_adm", numero: "2", label: "🏢 Administrativo" },
          { id: "opt_area_ceilandia", numero: "3", label: "📦 Ceilândia" },
          { id: "opt_area_fenix", numero: "4", label: "🦅 Fênix" },
          { id: "opt_area_diretoria", numero: "5", label: "💼 Diretoria" },
          { id: "opt_area_sia", numero: "6", label: "🏢 SIA" },
          { id: "opt_area_conceito", numero: "7", label: "🏬 Loja Conceito" },
          { id: "opt_area_verdes", numero: "8", label: "🌳 Áreas Verdes" },
          { id: "opt_area_almoxarifado", numero: "9", label: "📦 Almoxarifado" },
          { id: "opt_area_externas", numero: "10", label: "🚗 Áreas Externas" },
          { id: "opt_area_oficina", numero: "11", label: "🔧 Oficina" },
          { id: "opt_area_ccb", numero: "12", label: "🥤 CCB" },
          { id: "opt_area_estoque", numero: "13", label: "📦 Estoque" }
        ]
      }
    },
    // --- Nós de Pós-Atendimento e Avaliação Infinitos à Direita ---
    {
      id: "menu_pos_atendimento",
      type: "menuNode",
      position: { x: 1550, y: 300 },
      data: {
        text: "🔄 *O que gostaria de fazer agora?*\n\nSelecione uma opção:",
        opcoes: [
          { id: "opt_pos_voltar", numero: "1", label: "🏢 Voltar ao Menu Principal" },
          { id: "opt_pos_encerrar", numero: "2", label: "❌ Encerrar Atendimento" }
        ]
      }
    },
    {
      id: "menu_avaliacao",
      type: "menuNode",
      position: { x: 1950, y: 300 },
      data: {
        text: "📊 *Avaliação do Atendimento*\n\nDe *0 a 10*, o quão útil este assistente de Planejamento Administrativo foi para você?",
        opcoes: [
          { id: "opt_av_0", numero: "0", label: "0️⃣ Extremamente insatisfeito" },
          { id: "opt_av_1", numero: "1", label: "1️⃣ Muito insatisfeito" },
          { id: "opt_av_2", numero: "2", label: "2️⃣ Insatisfeito" },
          { id: "opt_av_3", numero: "3", label: "3️⃣ Pouco útil" },
          { id: "opt_av_4", numero: "4", label: "4️⃣ Regular" },
          { id: "opt_av_5", numero: "5", label: "5️⃣ Razoável" },
          { id: "opt_av_6", numero: "6", label: "6️⃣ Bom" },
          { id: "opt_av_7", numero: "7", label: "7️⃣ Muito bom" },
          { id: "opt_av_8", numero: "8", label: "8️⃣ Excelente" },
          { id: "opt_av_9", numero: "9", label: "9️⃣ Espetacular" },
          { id: "opt_av_10", numero: "10", label: "🔟 Perfeito, ajudou muito!" }
        ]
      }
    },
    {
      id: "msg_agradecimento",
      type: "messageNode",
      position: { x: 2350, y: 300 },
      data: {
        text: "❤️ *Muito obrigado!*\n\nSua avaliação foi registrada com sucesso no sistema. Sua opinião nos ajuda a melhorar constantemente!\n\nTenha um excelente dia de trabalho na Brasal Refrigerantes! 🥤"
      }
    }
  ];

  const edges = [
    {
      type: "default",
      animated: true,
      style: { stroke: "#94a3b8", strokeWidth: 1.5 },
      source: "start",
      sourceHandle: "right",
      target: "menu_principal",
      targetHandle: "left",
      id: "edge_start_to_principal"
    },
    {
      type: "default",
      animated: true,
      style: { stroke: "#94a3b8", strokeWidth: 1.5 },
      source: "menu_principal",
      sourceHandle: "opt_principal_material",
      target: "link_material",
      targetHandle: "left",
      id: "edge_principal_to_material"
    },
    {
      type: "default",
      animated: true,
      style: { stroke: "#94a3b8", strokeWidth: 1.5 },
      source: "menu_principal",
      sourceHandle: "opt_principal_limpeza",
      target: "link_limpeza",
      targetHandle: "left",
      id: "edge_principal_to_limpeza"
    },
    {
      type: "default",
      animated: true,
      style: { stroke: "#94a3b8", strokeWidth: 1.5 },
      source: "menu_principal",
      sourceHandle: "opt_principal_nps",
      target: "menu_areas",
      targetHandle: "left",
      id: "edge_principal_to_areas"
    },
    
    // --- Edges pós-informação que levam ao Menu Pós-Atendimento ---
    {
      type: "default",
      animated: true,
      style: { stroke: "#94a3b8", strokeWidth: 1.5 },
      source: "link_material",
      sourceHandle: "right",
      target: "menu_pos_atendimento",
      targetHandle: "left",
      id: "edge_material_to_pos"
    },
    {
      type: "default",
      animated: true,
      style: { stroke: "#94a3b8", strokeWidth: 1.5 },
      source: "link_limpeza",
      sourceHandle: "right",
      target: "menu_pos_atendimento",
      targetHandle: "left",
      id: "edge_limpeza_to_pos"
    },

    // --- Edges do Menu de Pós-Atendimento ---
    {
      type: "default",
      animated: true,
      style: { stroke: "#F40009", strokeWidth: 1.8 }, // Destaque em Vermelho Coca-Cola para o Loop de Retorno!
      source: "menu_pos_atendimento",
      sourceHandle: "opt_pos_voltar",
      target: "menu_principal",
      targetHandle: "left",
      id: "edge_pos_voltar_to_principal"
    },
    {
      type: "default",
      animated: true,
      style: { stroke: "#94a3b8", strokeWidth: 1.5 },
      source: "menu_pos_atendimento",
      sourceHandle: "opt_pos_encerrar",
      target: "menu_avaliacao",
      targetHandle: "left",
      id: "edge_pos_encerrar_to_avaliacao"
    }
  ];

  // Conecta todas as avaliações (0 a 10) ao nó de agradecimento final usando curvas suaves
  for (let idx = 0; idx <= 10; idx++) {
    edges.push({
      type: "default",
      animated: true,
      style: { stroke: "#10b981", strokeWidth: 1.5 }, // Verde para indicar finalização de sucesso
      source: "menu_avaliacao",
      sourceHandle: `opt_av_${idx}`,
      target: "msg_agradecimento",
      targetHandle: "left",
      id: `edge_av_${idx}_to_agradecimento`
    });
  }

  const areas = [
    { key: "industria", name: "Indústria", file: "industria.png", routine: "• 07:00 - Setup inicial e briefing de segurança\\n• 08:30 - Monitoramento de linhas de envase\\n• 11:30 - Parada programada para higienização\\n• 14:00 - Apuração de perdas e volume diário" },
    { key: "adm", name: "Administrativo", file: "administrative.png", routine: "• 08:00 - Alinhamento diário e leitura de e-mails\\n• 10:00 - Faturamento e conciliação de contas\\n• 14:00 - Acompanhamento de KPIs do setor\\n• 17:00 - Fechamento de relatórios de produtividade" },
    { key: "ceilandia", name: "Ceilândia", file: "ceilandia.png", routine: "• 06:00 - Abertura do pátio de distribuição\\n• 08:00 - Liberação e roteirização da frota\\n• 12:00 - Conferência física de retornos de rota\\n• 16:00 - Fechamento do caixa diário da unidade" },
    { key: "fenix", name: "Fênix", file: "fenix.png", routine: "• 07:30 - DDS operacional (Diálogo Diário de Segurança)\\n• 09:00 - Roteirização de carregamento prioritário\\n• 13:00 - Autoria de qualidade de paletes\\n• 17:00 - Inventário rotativo de alta rotatividade" },
    { key: "diretoria", name: "Diretoria", file: "diretoria.png", routine: "• 09:00 - Reunião executiva de resultados (BI)\\n• 11:00 - Análise de CAPEX e OPEX administrativo\\n• 14:30 - Alinhamento estratégico com lideranças\\n• 16:30 - Assinatura e homologação de contratos" },
    { key: "sia", name: "SIA", file: "sia.png", routine: "• 07:00 - Briefing operacional matinal\\n• 09:00 - Liberação de cargas expressas\\n• 13:30 - Monitoramento do fluxo de pátio e frota\\n• 16:00 - Fechamento de manifestos e notas fiscais" },
    { key: "conceito", name: "Loja Conceito", file: "loja conceito.png", routine: "• 09:00 - Abertura e checagem de vitrines e PDV\\n• 10:30 - Atendimento e vendas diretas\\n• 14:00 - Reposição de estoque de produtos refrigerados\\n• 18:00 - Fechamento do caixa e conciliação de cartões" },
    { key: "verdes", name: "Áreas Verdes", file: "areas verdes.png", routine: "• 07:00 - Distribuição de equipes nos jardins e plantas\\n• 08:30 - Poda, adubação e irrigação matinal\\n• 13:00 - Manutenção e limpeza de canteiros e gramados\\n• 15:30 - Vistoria de controle fitossanitário" },
    { key: "almoxarifado", name: "Almoxarifado", file: "almoxarifado.png", routine: "• 07:00 - Recebimento de insumos e matérias-primas\\n• 09:00 - Lançamento de notas fiscais no sistema ERP\\n• 13:30 - Separação de kits de requisição de setores\\n• 16:00 - Inventário rotativo e conferência física" },
    { key: "externas", name: "Áreas Externas", file: "areas externas.png", routine: "• 07:00 - Varrição técnica e recolhimento de resíduos\\n• 09:00 - Monitoramento de acessos externos e vagas\\n• 13:30 - Conservação de fachadas and pátios de manobra\\n• 15:30 - Check-list de limpeza e conservação externa" },
    { key: "oficina", name: "Oficina", file: "oficina.png", routine: "• 07:00 - Reunião operacional e check-list de ferramentas\\n• 08:30 - Manutenção preventiva de empilhadeiras e frota\\n• 11:00 - Atendimentos corretivos de linha industrial\\n• 15:30 - Organização e limpeza de bancadas (5S)" },
    { key: "ccb", name: "CCB", file: "ccb.png", routine: "• 07:30 - Lançamento operacional do dia\\n• 09:00 - Acompanhamento técnico de conformidades\\n• 13:30 - Inspeção física de processos na área industrial\\n• 16:00 - Tabulação de dados e relatório consolidado" },
    { key: "estoque", name: "Estoque", file: "estoque.png", routine: "• 06:30 - Planejamento de ocupação e espaço no galpão\\n• 08:00 - Operação de estocagem de paletes prontos\\n• 12:00 - Alinhamento e conferência física de perdas\\n• 15:30 - Preparação física do estoque para turno da noite" }
  ];

  areas.forEach((a, idx) => {
    const rowIndex = idx - 6; // de -6 a +6
    const yPos = 300 + rowIndex * 210; // Espaçamento vertical perfeito
    const nodeId = `img_${a.key}`;

    nodes.push({
      id: nodeId,
      type: "imageNode",
      position: { x: 1100, y: yPos },
      data: {
        url: `/uploads/${a.file}`,
        caption: `📊 *NPS da Área: ${a.name}*\n\n📋 *Rotina do Setor:*\n${a.routine}`
      }
    });

    // Conecta a opção do menu de áreas à respectiva imagem usando curvas suaves de forma lateral
    edges.push({
      type: "default",
      animated: true,
      style: { stroke: "#94a3b8", strokeWidth: 1.5 },
      source: "menu_areas",
      sourceHandle: `opt_area_${a.key}`,
      target: nodeId,
      targetHandle: "left",
      id: `edge_areas_to_${a.key}`
    });

    // Conecta a saída da imagem de cada área diretamente ao Menu de Pós-Atendimento de forma lateral
    edges.push({
      type: "default",
      animated: true,
      style: { stroke: "#94a3b8", strokeWidth: 1.5 },
      source: nodeId,
      sourceHandle: "right",
      target: "menu_pos_atendimento",
      targetHandle: "left",
      id: `edge_${a.key}_to_pos`
    });
  });

  const mapa = JSON.stringify({ nodes, edges });

  // Exclui fluxo de mesmo nome anterior para evitar duplicidade limpa
  await prisma.fluxo.deleteMany({ where: { nome } }).catch(() => {});

  const novoFluxo = await prisma.fluxo.create({
    data: {
      nome,
      gatilhos,
      ativo: true,
      horarioInicio: "00:00",
      horarioFim: "23:59",
      msgForaHorario,
      mapa,
      conexaoId
    }
  });

  console.log("Novo fluxo horizontal robusto criado com sucesso! ID:", novoFluxo.id);
};

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
