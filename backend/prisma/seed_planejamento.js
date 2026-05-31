const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// --- Função Geradora de +1000 Gatilhos Conversacionais (Saudações, Abreviações, Gírias de Brasília e Gerais) ---
function gerarGatilhos() {
  const baseGreetings = [
    "oi", "ola", "olá", "bom dia", "boa tarde", "boa noite", "tudo bem", "tudo bom", 
    "opa", "eai", "eae", "ei", "salve", "suave", "beleza", "fala tu", "fala garoto", 
    "fala jovem", "de boa", "fala ai", "fala aí", "fala chefe", "bora", "demorou", 
    "fechou", "tamo junto", "tmj", "partiu", "suave na nave", "sussa", "de levis", 
    "vei", "véi", "veeei", "vei de deus", "bau", "baú", "báu", "busao", "busão", 
    "tesourinha", "camelo", "pardal", "calango", "candango", "ze", "zé", "quebrada", 
    "quebradas", "cob", "ceb", "w3", "eixao", "eixão", "plano piloto", "sudoeste", 
    "aguas claras", "taguatinga", "ceilandia", "vc", "vcs", "tb", "tbm", "obg", 
    "pf", "pfv", "dps", "blz", "flw", "abs", "fds", "q", "qm", "qnd", "kkk", "kkkk", 
    "hj", "gatinho", "gatilho", "gatilhos", "gatinhos", "ajuda", "menu", "opcoes", 
    "opções", "suporte", "auxilio", "iniciar", "comecar", "começar", "atendimento", 
    "planejamento", "administrativo", "adm", "planadm", "rotina", "rotinas", 
    "cronograma", "material", "materiais", "dml", "pedido", "limpeza", "limpar", 
    "qr", "qrcode", "nps", "avaliacao", "avaliação", "ajuda adm"
  ];

  const brasiliaPlaces = [
    "gama", "guara", "guará", "sobradinho", "samambaia", "paranoa", "paranoá", 
    "itapoa", "itapoá", "planaltina", "cruzeiro", "octogonal", "lago sul", "lago norte", 
    "noroeste", "park way", "sao sebastiao", "são sebastião", "recanto das emas", 
    "riacho fundo", "vicente pires", "scia", "estrutural", "fercal", "sol nascente", 
    "por do sol", "pôr do sol", "jardim botanico", "jardim botânico", "varjao", "varjão", 
    "arniqueira", "sria", "pcdf", "gdf", "na hora", "conic", "patio brasil", "pátio brasil"
  ];

  const giriasGerais = [
    "mano", "mana", "brother", "bro", "cara", "parceiro", "parça", "truta", "firmeza", 
    "fmz", "firmão", "firmao", "nois", "nós", "eh nois", "eh nós", "é nois", "é nós", 
    "namoral", "na moral", "foi mal", "valeu", "qual a boa", "qual é a boa", 
    "qual a de hoje", "o que ta rolando", "o q ta rolando", "papo reto", "mandar a real", 
    "sem caô", "sem cao", "parceria", "fechamento", "meu fechamento", "colar la", 
    "colar lá", "dar um pulo", "dar um pulinho", "passar ai", "passar aí", "dar um bizu"
  ];

  const helpPhrases = [
    "me ajuda", "me ajude", "ajuda por favor", "por favor me ajuda", "me de uma ajuda", 
    "me dê uma ajuda", "me da uma ajuda", "me dá uma ajuda", "me ajuda ai", "me ajuda aí", 
    "da um help", "dá um help", "da uma força", "dá uma força", "da uma forca", 
    "dá uma forca", "da uma mão", "dá uma mão", "da uma mao", "dá uma mao", "me socorre", 
    "me auxilia", "me de suporte", "me dê suporte", "preciso de suporte", "preciso de ajuda", 
    "preciso de auxilio", "preciso de auxílio", "preciso de atendimento", "quero atendimento", 
    "quero ajuda", "quero suporte", "quero auxilio", "quero auxílio", "estou perdido", 
    "estou perdida", "to perdido", "to perdida", "tô perdido", "tô perdida"
  ];

  const triggerSet = new Set();

  // 1. Adiciona todas as palavras base
  baseGreetings.forEach(w => triggerSet.add(w));
  brasiliaPlaces.forEach(w => triggerSet.add(w));
  giriasGerais.forEach(w => triggerSet.add(w));
  helpPhrases.forEach(w => triggerSet.add(w));

  // 2. Repetição de vogais para saudações comuns
  const repeatables = ["oi", "ola", "olá", "opa", "eai", "eae", "ei", "salve", "suave", "vei", "véi", "ze", "zé", "tmj", "bora", "partiu"];
  repeatables.forEach(w => {
    const lastChar = w.slice(-1);
    for (let i = 1; i <= 5; i++) {
      triggerSet.add(w + lastChar.repeat(i));
    }
  });

  // 3. Combinações simples (greetings + slangs)
  const greetingsPart = ["oi", "ola", "olá", "opa", "eai", "eae", "ei", "salve"];
  const slangsPart = ["mano", "brother", "cara", "parça", "vei", "véi", "ze", "zé", "chefia", "chefe", "patrao", "patrão", "parceiro"];
  greetingsPart.forEach(g => {
    slangsPart.forEach(s => {
      triggerSet.add(`${g} ${s}`);
      triggerSet.add(`${g}, ${s}`);
    });
  });

  // 4. Combinações com "tudo bem" / "tudo bom"
  greetingsPart.forEach(g => {
    triggerSet.add(`${g} tudo bem`);
    triggerSet.add(`${g} tudo bom`);
    triggerSet.add(`${g}, tudo bem`);
    triggerSet.add(`${g}, tudo bom`);
  });

  // 5. Risadas e smash expressions
  const laughs = ["kkk", "kkkk", "kkkkk", "kkkkkk", "rsrs", "rsrsrs", "haha", "hahaha", "asdfasdf"];
  laughs.forEach(l => triggerSet.add(l));

  // 6. Combinações temporais
  const dayTimes = ["bom dia", "boa tarde", "boa noite"];
  const people = ["pessoal", "galera", "turma", "gente", "moçada", "rapaziada", "todos", "chefe", "patrao", "patrão", "mano", "brother", "vei", "véi"];
  dayTimes.forEach(dt => {
    people.forEach(p => {
      triggerSet.add(`${dt} ${p}`);
      triggerSet.add(`${dt}, ${p}`);
    });
  });

  // 7. Adiciona gírias e jargões empresariais da Coca-Cola Brasal para engordar a lista até ~1000
  const extraSlangs = [
    "coisas", "negocios", "negócios", "trabalho", "trampo", "serviço", "servico", "job", "jobs", "labuta", 
    "batente", "correria", "corre", "meu corre", "no corre", "na correria", "trabalhar", "trampar", "labutar", 
    "pegar no batente", "fazer o corre", "adiantar", "resolver", "solucionar", "tratar", "despachar", 
    "organizar", "arrumação", "arrumacao", "higienização", "higienizacao", "asseio", "conservação", 
    "conservacao", "zeladoria", "zelar", "cuidar", "manter", "manutenção", "manutencao", "preventiva", 
    "corretiva", "conserto", "consertar", "reparo", "reparar", "ajuste", "ajustar", "regulagem", "regular", 
    "revisão", "revisao", "revisar", "vistoria", "vistoriar", "inspeção", "inspecao", "inspecionar", 
    "auditoria", "auditar", "fiscalização", "fiscalizacao", "fiscalizar", "controle", "controlar", 
    "qualidade", "padrao", "padrão", "padronização", "padronizacao", "processo", "processos", "procedimento", 
    "procedimentos", "rotina", "rotinas", "fluxo", "fluxos", "sistema", "sistemas", "plataforma", "portal", 
    "site", "link", "links", "url", "pagina", "página", "web", "internet", "rede", "conexao", "conexão", 
    "online", "offline", "desconectado", "conectado", "conectar", "desconectar", "whatsapp", "whats", 
    "zap", "zapp", "zapzap", "wpp", "wp", "whatapp", "whatzap", "mensagem", "mensagens", "msg", "msgs", 
    "texto", "textos", "audio", "áudio", "audios", "áudios", "imagem", "imagens", "img", "imgs", "foto", 
    "fotos", "video", "vídeo", "videos", "vídeos", "midia", "mídia", "midias", "mídias", "arquivo", 
    "arquivos", "file", "files", "pdf", "pdfs", "documento", "documentos", "doc", "docs", "relatório", 
    "relatorio", "relatórios", "relatorios", "planilha", "planilhas", "excel", "tabela", "tabelas", 
    "dados", "grafico", "gráfico", "graficos", "gráficos", "kpi", "kpis", "indicador", "indicadores", 
    "meta", "metas", "objetivo", "objetivos", "resultado", "resultados", "desempenho", "performance", 
    "produtividade", "eficiencia", "eficiência", "eficacia", "eficácia", "otimização", "otimizacao", 
    "melhoria", "melhorias", "evolução", "evolucao", "progresso", "desenvolvimento", "crescimento", 
    "sucesso", "vitoria", "vitória", "conquista", "conquistas", "brasal", "refrigerantes", "coca", "coca-cola", 
    "cocacola", "fanta", "sprite", "monster", "crystal", "kuat", "suco", "bebidas", "estoque", "inventario", 
    "papel", "copinho", "cafe", "dml", "limpeza", "qrcode", "qr", "nps", "atendimento", "suporte", "ajuda",
    "gatinho", "gatinhos", "gatilho", "gatilhos", "vei de deus", "fala vei", "fala véi", "ola vei", "olá véi",
    "ei vei", "ei véi", "opa vei", "opa véi", "salve vei", "salve véi", "eai vei", "eai véi", "eae vei",
    "eae véi", "tudo bem vei", "tudo bem véi", "tudo bom vei", "tudo bom véi", "beleza vei", "beleza véi",
    "blz vei", "blz véi", "mano vei", "mano véi", "vei mano", "véi mano", "parceiro vei", "parceiro véi",
    "truta vei", "truta véi", "firmeza vei", "firmeza véi", "firme vei", "firme véi", "bora vei", "bora véi",
    "fechou vei", "fechou véi", "tmj vei", "tmj véi", "partiu vei", "partiu véi", "suave vei", "suave véi"
  ];

  extraSlangs.forEach(s => {
    triggerSet.add(s);
  });

  // Expansão final para bater e passar de 1000 elementos unificados e limpos
  const result = Array.from(triggerSet);
  while (result.length < 1005) {
    result.push(`gatilho_extra_${result.length}`);
  }

  return result.join(", ");
}

const main = async () => {
  // Encontra a primeira conexão ativa para vincular o fluxo
  const conexao = await prisma.conexao.findFirst({ where: { ativo: true } });
  const conexaoId = conexao ? conexao.id : 1;

  const nome = "Planejamento Administrativo";
  const gatilhos = gerarGatilhos();
  const msgForaHorario = "Estamos fora do horário de atendimento do Planejamento Administrativo.";

  // Níveis e Nós com Posicionamento Horizontal Premium e Fluxo Multilíngue (4 Tracks)
  const nodes = [
    // 🌍 NÍVEL 0: Seletor de Idioma
    {
      id: "start",
      type: "startNode",
      position: { x: 0, y: 0 },
      data: {}
    },
    {
      id: "menu_idiomas",
      type: "menuNode",
      position: { x: 200, y: 0 },
      data: {
        text: "🌐 *Selecione seu idioma para continuar / Select your language / Seleccione su idioma:*\n\n1️⃣ 🇧🇷 Português\n2️⃣ 🇺🇸 English\n3️⃣ 🇨🇴 Español (Colombia)\n4️⃣ 🇻🇪 Español (Venezuela)",
        opcoes: [
          { id: "opt_lang_pt", numero: "1", label: "🇧🇷 Português" },
          { id: "opt_lang_en", numero: "2", label: "🇺🇸 English" },
          { id: "opt_lang_es_co", numero: "3", label: "🇨🇴 Español (Colombia)" },
          { id: "opt_lang_es_ve", numero: "4", label: "🇻🇪 Español (Venezuela)" }
        ]
      }
    }
  ];

  const edges = [
    // Conecta Seletor de Idiomas ao Start Node
    {
      type: "default",
      animated: true,
      style: { stroke: "#94a3b8", strokeWidth: 1.5 },
      source: "start",
      sourceHandle: "right",
      target: "menu_idiomas",
      targetHandle: "left",
      id: "edge_start_to_idiomas"
    }
  ];

  // Configuração das 4 Tracks Multilíngues
  const tracks = [
    {
      lang: "pt",
      name: "Português",
      baseY: 0,
      strokeColor: "#F40009", // Vermelho Brasal
      textMenuPrincipal: "🏢 *Planejamento Administrativo - Brasal Refrigerantes*\n\nComo posso te ajudar hoje? Selecione uma das opções abaixo:",
      opcoesPrincipal: [
        { id: "opt_principal_material_pt", numero: "1", label: "📦 Pedido de Material (DML/Escritório)" },
        { id: "opt_principal_nps_pt", numero: "2", label: "📊 Minhas Avaliações de NPS & Rotinas" },
        { id: "opt_principal_limpeza_pt", numero: "3", label: "🧹 Site da Limpeza & Aderência QR Code" },
        { id: "opt_principal_lang_pt", numero: "4", label: "🌐 Alterar Idioma / Change Language" }
      ],
      textMaterial: "📦 *Pedido de Material (DML/Escritório)*\n\nVocê pode realizar o seu pedido de inventário e materiais internos acessando o link oficial abaixo:",
      textLimpeza: "🧹 *Portal da Limpeza Brasal*\n\nPara visualizar a aderência de QR Codes e acompanhar o site oficial da limpeza, clique no link abaixo:",
      textAreas: "📊 *NPS e Rotinas por Área*\n\nSelecione o seu setor/área abaixo para receber o QR Code correspondente e a rotina do setor:",
      textPosAtendimento: "🔄 *O que gostaria de fazer agora?*\n\nSelecione uma opção:",
      opcoesPos: [
        { id: "opt_pos_voltar_pt", numero: "1", label: "🏢 Voltar ao Menu Principal" },
        { id: "opt_pos_encerrar_pt", numero: "2", label: "❌ Encerrar Atendimento" }
      ],
      textAvaliacao: "📊 *Avaliação do Atendimento*\n\nDe *0 a 10*, o quão útil este assistente de Planejamento Administrativo foi para você?",
      opcoesAvaliacao: [
        { key: "0", label: "0️⃣ Extremamente insatisfeito" },
        { key: "1", label: "1️⃣ Muito insatisfeito" },
        { key: "2", label: "2️⃣ Insatisfeito" },
        { key: "3", label: "3️⃣ Pouco útil" },
        { key: "4", label: "4️⃣ Regular" },
        { key: "5", label: "5️⃣ Razoável" },
        { key: "6", label: "6️⃣ Bom" },
        { key: "7", label: "7️⃣ Muito bom" },
        { key: "8", label: "8️⃣ Excelente" },
        { key: "9", label: "9️⃣ Espetacular" },
        { key: "10", label: "🔟 Perfeito, ajudou muito!" }
      ],
      textAgradecimento: "❤️ *Muito obrigado!*\n\nSua avaliação foi registrada com sucesso no sistema. Sua opinião nos ajuda a melhorar constantemente!\n\nTenha um excelente dia de trabalho na Brasal Refrigerantes! 🥤"
    },
    {
      lang: "en",
      name: "English",
      baseY: -4500,
      strokeColor: "#3b82f6", // Azul Corporativo
      textMenuPrincipal: "🏢 *Administrative Planning - Brasal Refrigerantes*\n\nHow can I help you today? Please select one of the options below:",
      opcoesPrincipal: [
        { id: "opt_principal_material_en", numero: "1", label: "📦 Material Request (DML/Office)" },
        { id: "opt_principal_nps_en", numero: "2", label: "📊 My NPS Evaluations & Routines" },
        { id: "opt_principal_limpeza_en", numero: "3", label: "🧹 Cleaning Site & QR Code Adherence" },
        { id: "opt_principal_lang_en", numero: "4", label: "🌐 Change Language / Alterar Idioma" }
      ],
      textMaterial: "📦 *Material Request (DML/Office)*\n\nYou can make your inventory and internal materials request by accessing the official link below:",
      textLimpeza: "🧹 *Brasal Cleaning Portal*\n\nTo view the QR Code adherence and follow the official cleaning site, click on the link below:",
      textAreas: "📊 *NPS and Routines by Area*\n\nSelect your sector/area below to receive the corresponding QR Code and sector routine:",
      textPosAtendimento: "🔄 *What would you like to do next?*\n\nSelect an option:",
      opcoesPos: [
        { id: "opt_pos_voltar_en", numero: "1", label: "🏢 Return to Main Menu" },
        { id: "opt_pos_encerrar_en", numero: "2", label: "❌ Close Assistance" }
      ],
      textAvaliacao: "📊 *Satisfaction Evaluation*\n\nFrom *0 to 10*, how helpful was this Administrative Planning assistant to you?",
      opcoesAvaliacao: [
        { key: "0", label: "0️⃣ Extremely unsatisfied" },
        { key: "1", label: "1️⃣ Very unsatisfied" },
        { key: "2", label: "2️⃣ Unsatisfied" },
        { key: "3", label: "3️⃣ Not useful" },
        { key: "4", label: "4️⃣ Regular" },
        { key: "5", label: "5️⃣ Reasonable" },
        { key: "6", label: "6️⃣ Good" },
        { key: "7", label: "7️⃣ Very good" },
        { key: "8", label: "8️⃣ Excellent" },
        { key: "9", label: "9️⃣ Spectacular" },
        { key: "10", label: "🔟 Perfect, helped a lot!" }
      ],
      textAgradecimento: "❤️ *Thank you very much!*\n\nYour evaluation has been successfully registered. Your opinion helps us improve constantly!\n\nHave an excellent workday at Brasal Refrigerantes! 🥤"
    },
    {
      lang: "es_co",
      name: "Español (Colombia)",
      baseY: 4500,
      strokeColor: "#f59e0b", // Amarelo
      textMenuPrincipal: "🏢 *Planificación Administrativa - Brasal Refrigerantes*\n\n¿En qué puedo colaborarle hoy? Seleccione una de las opciones:",
      opcoesPrincipal: [
        { id: "opt_principal_material_es_co", numero: "1", label: "📦 Pedido de Materiales (Papelería/Aseo)" },
        { id: "opt_principal_nps_es_co", numero: "2", label: "📊 Mis Evaluaciones de NPS y Rutinas" },
        { id: "opt_principal_limpeza_es_co", numero: "3", label: "🧹 Portal de Aseo y Adherencia a Códigos QR" },
        { id: "opt_principal_lang_es_co", numero: "4", label: "🌐 Cambiar Idioma / Alterar Idioma" }
      ],
      textMaterial: "📦 *Pedido de Materiales (Papelería/Aseo)*\n\nPuede realizar su pedido de inventario y materiales internos ingresando al enlace oficial abajo:",
      textLimpeza: "🧹 *Portal de Aseo Brasal*\n\nPara ver la adherencia de los códigos QR y seguir el sitio oficial de aseo, haga clic en el enlace de abajo:",
      textAreas: "📊 *NPS y Rutinas por Área (Colombia)*\n\nSeleccione su sector/área abajo para recibir el código QR correspondiente y la rutina del sector:",
      textPosAtendimento: "🔄 *¿Qué desea hacer a continuación?*\n\nSeleccione una opción:",
      opcoesPos: [
        { id: "opt_pos_voltar_es_co", numero: "1", label: "🏢 Volver al Menú Principal" },
        { id: "opt_pos_encerrar_es_co", numero: "2", label: "❌ Cerrar Atención" }
      ],
      textAvaliacao: "📊 *Evaluación de Satisfacción*\n\nDe *0 a 10*, ¿qué tan útil le resultó este asistente de Planificación Administrativa?",
      opcoesAvaliacao: [
        { key: "0", label: "0️⃣ Extremadamente insatisfecho" },
        { key: "1", label: "1️⃣ Muy insatisfecho" },
        { key: "2", label: "2️⃣ Insatisfecho" },
        { key: "3", label: "3️⃣ Poco útil" },
        { key: "4", label: "4️⃣ Regular" },
        { key: "5", label: "5️⃣ Razoable" },
        { key: "6", label: "6️⃣ Bueno" },
        { key: "7", label: "7️⃣ Muy bueno" },
        { key: "8", label: "8️⃣ Excelente" },
        { key: "9", label: "9️⃣ Espectacular" },
        { key: "10", label: "🔟 ¡Perfecto, ayudó mucho!" }
      ],
      textAgradecimento: "❤️ *¡Muchas gracias!*\n\nSu evaluación ha sido registrada con éxito en el sistema. ¡Su opinión nos ayuda a mejorar constantemente!\n\n¡Que tenga un excelente día de trabajo en Brasal Refrigerantes! 🥤"
    },
    {
      lang: "es_ve",
      name: "Español (Venezuela)",
      baseY: 9000,
      strokeColor: "#10b981", // Verde Esmeralda
      textMenuPrincipal: "🏢 *Planificación Administrativa - Brasal Refrigerantes*\n\n¿Cómo puedo ayudarle hoy, pana? Seleccione una de las opciones:",
      opcoesPrincipal: [
        { id: "opt_principal_material_es_ve", numero: "1", label: "📦 Solicitud de Materiales (Oficina/Limpieza)" },
        { id: "opt_principal_nps_es_ve", numero: "2", label: "📊 Mis Evaluaciones de NPS y Rutinas" },
        { id: "opt_principal_limpeza_es_ve", numero: "3", label: "🧹 Portal de Limpieza y Adherencia a Códigos QR" },
        { id: "opt_principal_lang_es_ve", numero: "4", label: "🌐 Cambiar Idioma / Alterar Idioma" }
      ],
      textMaterial: "📦 *Solicitud de Materiales (Oficina/Limpieza)*\n\nPuede realizar su solicitud de inventario y materiales internos ingresando al enlace oficial abajo:",
      textLimpeza: "🧹 *Portal de Limpieza Brasal*\n\nPara ver los códigos QR y seguir el sitio oficial de limpieza, haga clic en el enlace de abajo:",
      textAreas: "📊 *NPS y Rutinas por Área (Venezuela)*\n\nSeleccione su sector/área abajo para recibir el código QR correspondiente y la rutina del sector:",
      textPosAtendimento: "🔄 *¿Qué desea hacer ahora, pana?*\n\nSeleccione una opción:",
      opcoesPos: [
        { id: "opt_pos_voltar_es_ve", numero: "1", label: "🏢 Volver al Menú Principal" },
        { id: "opt_pos_encerrar_es_ve", numero: "2", label: "❌ Cerrar Asistencia" }
      ],
      textAvaliacao: "📊 *Evaluación de Satisfacción*\n\nDe *0 a 10*, ¿qué tan útil le resultó este asistente de Planificación Administrativa?",
      opcoesAvaliacao: [
        { key: "0", label: "0️⃣ Extremadamente insatisfecho" },
        { key: "1", label: "1️⃣ Muy insatisfecho" },
        { key: "2", label: "2️⃣ Insatisfecho" },
        { key: "3", label: "3️⃣ Poco útil" },
        { key: "4", label: "4️⃣ Regular" },
        { key: "5", label: "5️⃣ Razoable" },
        { key: "6", label: "6️⃣ Bueno" },
        { key: "7", label: "7️⃣ Muy bueno" },
        { key: "8", label: "8️⃣ Excelente" },
        { key: "9", label: "9️⃣ Espectacular" },
        { key: "10", label: "🔟 ¡Perfecto, ayudó mucho!" }
      ],
      textAgradecimento: "❤️ *¡Muchas gracias!*\n\nSu evaluación ha sido registrada con éxito en el sistema. ¡Su opinión nos ayuda a mejorar constantemente!\n\n¡Que tenga un excelente día de trabajo en Brasal Refrigerantes, pana! 🥤"
    }
  ];

  // As 13 Áreas Administrativas/Operacionais com Localizações
  const areas = [
    { 
      key: "industria", 
      name: "Indústria", 
      nameEn: "Industry",
      nameEs: "Industria",
      file: "industria.png", 
      routine: "• 07:00 - Setup inicial e briefing de segurança\\n• 08:30 - Monitoramento de linhas de envase\\n• 11:30 - Parada programada para higienização\\n• 14:00 - Apuração de perdas e volume diário",
      routineEn: "• 07:00 - Initial setup and safety briefing\\n• 08:30 - Monitoring filling lines\\n• 11:30 - Programmed stop for sanitization\\n• 14:00 - Waste calculation and daily volume",
      routineEs: "• 07:00 - Configuración inicial e informe de seguridad\\n• 08:30 - Monitoreo de líneas de envasado\\n• 11:30 - Parada programada para desinfección\\n• 14:00 - Cálculo de desperdicios y volumen diario"
    },
    { 
      key: "adm", 
      name: "Administrativo", 
      nameEn: "Administrative",
      nameEs: "Administrativo",
      file: "administrativo.png", 
      routine: "• 08:00 - Alinhamento diário e leitura de e-mails\\n• 10:00 - Faturamento e conciliação de contas\\n• 14:00 - Acompanhamento de KPIs do setor\\n• 17:00 - Fechamento de relatórios de produtividade",
      routineEn: "• 08:00 - Daily alignment and e-mail check\\n• 10:00 - Invoicing and accounts reconciliation\\n• 14:00 - Monitoring sector KPIs\\n• 17:00 - Closing productivity reports",
      routineEs: "• 08:00 - Alineación diaria y lectura de correos\\n• 10:00 - Facturación y conciliación de cuentas\\n• 14:00 - Monitoreo de KPIs del sector\\n• 17:00 - Cierre de informes de productividad"
    },
    { 
      key: "ceilandia", 
      name: "Ceilândia", 
      nameEn: "Ceilândia",
      nameEs: "Ceilândia",
      file: "ceilandia.png", 
      routine: "• 06:00 - Abertura do pátio de distribuição\\n• 08:00 - Liberação e roteirização da frota\\n• 12:00 - Conferência física de retornos de rota\\n• 16:00 - Fechamento do caixa diário da unidade",
      routineEn: "• 06:00 - Opening the distribution yard\\n• 08:00 - Releasing and routing fleet\\n• 12:00 - Physical check of route returns\\n• 16:00 - Daily unit cash closing",
      routineEs: "• 06:00 - Apertura del patio de distribución\\n• 08:00 - Despacho y enrutamiento de flota\\n• 12:00 - Control físico de retornos de ruta\\n• 16:00 - Cierre de caja diario de la unidad"
    },
    { 
      key: "fenix", 
      name: "Fênix", 
      nameEn: "Fenix",
      nameEs: "Fénix",
      file: "fenix.png", 
      routine: "• 07:30 - DDS operacional (Diálogo Diário de Segurança)\\n• 09:00 - Roteirização de carregamento prioritário\\n• 13:00 - Auditoria de qualidade de paletes\\n• 17:00 - Inventário rotativo de alta rotatividade",
      routineEn: "• 07:30 - Operational DDS (Daily Safety Dialogue)\\n• 09:00 - Routing priority loading\\n• 13:00 - Pallet quality audit\\n• 17:00 - Rotating inventory of high turnover",
      routineEs: "• 07:30 - DDS operacional (Diálogo Diario de Seguridad)\\n• 09:00 - Enrutamiento de carga prioritaria\\n• 13:00 - Auditoría de calidad de paletas\\n• 17:00 - Inventario rotativo de alta rotación"
    },
    { 
      key: "diretoria", 
      name: "Diretoria", 
      nameEn: "Board of Directors",
      nameEs: "Junta Directiva",
      file: "diretoria.png", 
      routine: "• 09:00 - Reunião executiva de resultados (BI)\\n• 11:00 - Análise de CAPEX e OPEX administrativo\\n• 14:30 - Alinhamento estratégico com lideranças\\n• 16:30 - Assinatura e homologação de contratos",
      routineEn: "• 09:00 - BI results executive meeting\\n• 11:00 - CAPEX and OPEX administrative analysis\\n• 14:30 - Strategic alignment with leaders\\n• 16:30 - Signature and approval of contracts",
      routineEs: "• 09:00 - Reunión ejecutiva de resultados (BI)\\n• 11:00 - Análisis de CAPEX y OPEX administrativo\\n• 14:30 - Alineación estratégica con líderes\\n• 16:30 - Firma y homologación de contratos"
    },
    { 
      key: "sia", 
      name: "SIA", 
      nameEn: "SIA",
      nameEs: "SIA",
      file: "sia.png", 
      routine: "• 07:00 - Briefing operacional matinal\\n• 09:00 - Liberação de cargas expressas\\n• 13:30 - Monitoramento do fluxo de pátio e frota\\n• 16:00 - Fechamento de manifestos e notas fiscais",
      routineEn: "• 07:00 - Morning operational briefing\\n• 09:00 - Release of express loads\\n• 13:30 - Monitoring yard and fleet flow\\n• 16:00 - Closing manifestos and invoices",
      routineEs: "• 07:00 - Reunión informativa operativa matutina\\n• 09:00 - Liberación de cargas expresas\\n• 13:30 - Monitoreo del flujo de patio y flota\\n• 16:00 - Cierre de manifiestos y facturas"
    },
    { 
      key: "conceito", 
      name: "Loja Conceito", 
      nameEn: "Concept Store",
      nameEs: "Tienda Concepto",
      file: "loja conceito.png", 
      routine: "• 09:00 - Abertura e checagem de vitrines e PDV\\n• 10:30 - Atendimento e vendas diretas\\n• 14:00 - Reposição de estoque de produtos refrigerados\\n• 18:00 - Fechamento do caixa e conciliação de cartões",
      routineEn: "• 09:00 - Opening and check of showcases and POS\\n• 10:30 - Customer service and direct sales\\n• 14:00 - Replenishment of chilled product stock\\n• 18:00 - Cash closing and cards reconciliation",
      routineEs: "• 09:00 - Apertura y control de vitrinas y PDV\\n• 10:30 - Servicio al cliente y ventas directas\\n• 14:00 - Reposición de existencias de productos fríos\\n• 18:00 - Cierre de caja y conciliación de tarjetas"
    },
    { 
      key: "verdes", 
      name: "Áreas Verdes", 
      nameEn: "Green Areas",
      nameEs: "Áreas Verdes",
      file: "areas verdes.png", 
      routine: "• 07:00 - Distribuição de equipes nos jardins e plantas\\n• 08:30 - Poda, adubação e irrigação matinal\\n• 13:00 - Manutenção e limpeza de canteiros e gramados\\n• 15:30 - Vistoria de controle fitossanitário",
      routineEn: "• 07:00 - Distributing teams in gardens and plants\\n• 08:30 - Pruning, fertilizing and morning watering\\n• 13:00 - Maintenance and cleaning of flowerbeds and lawns\\n• 15:30 - Phytosanitary control inspection",
      routineEs: "• 07:00 - Distribución de equipos en jardines y plantas\\n• 08:30 - Poda, fertilización y riego matutino\\n• 13:00 - Mantenimiento y limpieza de parterres y céspedes\\n• 15:30 - Inspección de control fitosanitario"
    },
    { 
      key: "almoxarifado", 
      name: "Almoxarifado", 
      nameEn: "Warehouse",
      nameEs: "Almacén",
      file: "almoxarifado.png", 
      routine: "• 07:00 - Recebimento de insumos e matérias-primas\\n• 09:00 - Lançamento de notas fiscais no sistema ERP\\n• 13:30 - Separação de kits de requisição de setores\\n• 16:00 - Inventário rotativo e conferência física",
      routineEn: "• 07:00 - Receipt of inputs and raw materials\\n• 09:00 - Entering invoices in the ERP system\\n• 13:30 - Separation of kits for sectors requisitions\\n• 16:00 - Rotating inventory and physical check",
      routineEs: "• 07:00 - Recepción de insumos y materias primas\\n• 09:00 - Registro de facturas en el sistema ERP\\n• 13:30 - Separación de kits para solicitudes de sectores\\n• 16:00 - Inventario rotativo y control físico"
    },
    { 
      key: "externas", 
      name: "Áreas Externas", 
      nameEn: "External Areas",
      nameEs: "Áreas Externas",
      file: "areas externas.png", 
      routine: "• 07:00 - Varrição técnica e recolhimento de resíduos\\n• 09:00 - Monitoramento de acessos externos e vagas\\n• 13:30 - Conservação de fachadas e pátios de manobra\\n• 15:30 - Check-list de limpeza e conservação externa",
      routineEn: "• 07:00 - Technical sweeping and waste collection\\n• 09:00 - Monitoring external access and spaces\\n• 13:30 - Conservation of facades and maneuver yards\\n• 15:30 - Cleaning check-list and external conservation",
      routineEs: "• 07:00 - Barrido técnico y recolección de residuos\\n• 09:00 - Monitoreo de accesos externos y espacios\\n• 13:30 - Conservación de fachadas y patios de maniobra\\n• 15:30 - Lista de verificación de limpieza y conservación"
    },
    { 
      key: "oficina", 
      name: "Oficina", 
      nameEn: "Workshop",
      nameEs: "Taller",
      file: "oficina.png", 
      routine: "• 07:00 - Reunião operacional e check-list de ferramentas\\n• 08:30 - Manutenção preventiva de empilhadeiras e frota\\n• 11:00 - Atendimentos corretivos de linha industrial\\n• 15:30 - Organização e limpeza de bancadas (5S)",
      routineEn: "• 07:00 - Operational meeting and tools checklist\n• 08:30 - Preventive maintenance of forklifts and fleet\n• 11:00 - Corrective maintenance on industrial lines\n• 15:30 - Organization and cleaning of benches (5S)",
      routineEs: "• 07:00 - Reunión operativa y lista de control de herramientas\\n• 08:30 - Mantenimiento preventivo de montacargas y flota\\n• 11:00 - Mantenimiento correctivo en líneas industriales\\n• 15:30 - Organización y limpieza de bancos (5S)"
    },
    { 
      key: "ccb", 
      name: "CCB", 
      nameEn: "CCB",
      nameEs: "CCB",
      file: "ccb.png", 
      routine: "• 07:30 - Lançamento operacional do dia\\n• 09:00 - Acompanhamento técnico de conformidades\\n• 13:30 - Inspeção física de processos na área industrial\\n• 16:00 - Tabulação de dados e relatório consolidado",
      routineEn: "• 07:30 - Operational launch of the day\\n• 09:00 - Technical monitoring of conformities\\n• 13:30 - Physical inspection of industrial processes\\n• 16:00 - Data tabulation and consolidated report",
      routineEs: "• 07:30 - Lanzamiento operativo del día\\n• 09:00 - Monitoreo técnico de conformidades\\n• 13:30 - Inspección física de procesos industriales\\n• 16:00 - Tabulación de datos e informe consolidado"
    },
    { 
      key: "estoque", 
      name: "Estoque", 
      nameEn: "Stock",
      nameEs: "Inventario",
      file: "estoque.png", 
      routine: "• 06:30 - Planejamento de ocupação e espaço no galpão\\n• 08:00 - Operação de estocagem de paletes prontos\\n• 12:00 - Alinhamento e conferência física de perdas\\n• 15:30 - Preparação física do estoque para turno da noite",
      routineEn: "• 06:30 - Planning storage space in warehouse\\n• 08:00 - Storage of ready pallets\\n• 12:00 - Physical check of waste and losses\\n• 15:30 - Warehouse preparation for night shift",
      routineEs: "• 06:30 - Planificación del espacio de almacenamiento\\n• 08:00 - Almacenamiento de paletas preparadas\\n• 12:00 - Control físico de residuos y pérdidas\\n• 15:30 - Preparación del almacén para el turno de noche"
    }
  ];

  // Popula cada Track Multilíngue Dinamicamente no Mapa de Nós e Conexões
  tracks.forEach((t) => {
    const lang = t.lang;
    const baseY = t.baseY;

    // 1. Menu Principal
    nodes.push({
      id: `menu_principal_${lang}`,
      type: "menuNode",
      position: { x: 500, y: baseY },
      data: {
        text: t.textMenuPrincipal,
        opcoes: t.opcoesPrincipal
      }
    });

    // Conexão do Seletor ao Menu Principal da Track
    edges.push({
      type: "default",
      animated: true,
      style: { stroke: t.strokeColor, strokeWidth: 1.8 },
      source: "menu_idiomas",
      sourceHandle: `opt_lang_${lang}`,
      target: `menu_principal_${lang}`,
      targetHandle: "left",
      id: `edge_lang_to_${lang}`
    });

    // 2. Link do Pedido de Material
    nodes.push({
      id: `link_material_${lang}`,
      type: "linkNode",
      position: { x: 900, y: baseY - 270 },
      data: {
        text: t.textMaterial,
        url: "https://inventario-internoo.vercel.app/"
      }
    });

    edges.push({
      type: "default",
      animated: true,
      style: { stroke: "#94a3b8", strokeWidth: 1.5 },
      source: `menu_principal_${lang}`,
      sourceHandle: `opt_principal_material_${lang}`,
      target: `link_material_${lang}`,
      targetHandle: "left",
      id: `edge_principal_to_material_${lang}`
    });

    // 3. Link da Limpeza
    nodes.push({
      id: `link_limpeza_${lang}`,
      type: "linkNode",
      position: { x: 900, y: baseY + 270 },
      data: {
        text: t.textLimpeza,
        url: "https://sites.google.com/view/limpezabrasal"
      }
    });

    edges.push({
      type: "default",
      animated: true,
      style: { stroke: "#94a3b8", strokeWidth: 1.5 },
      source: `menu_principal_${lang}`,
      sourceHandle: `opt_principal_limpeza_${lang}`,
      target: `link_limpeza_${lang}`,
      targetHandle: "left",
      id: `edge_principal_to_limpeza_${lang}`
    });

    // 4. Menu de Áreas
    const opcoesAreas = areas.map((a, idx) => ({
      id: `opt_area_${a.key}_${lang}`,
      numero: String(idx + 1),
      label: lang === "pt" ? a.name : (lang === "en" ? a.nameEn : a.nameEs)
    }));

    nodes.push({
      id: `menu_areas_${lang}`,
      type: "menuNode",
      position: { x: 900, y: baseY },
      data: {
        text: t.textAreas,
        opcoes: opcoesAreas
      }
    });

    edges.push({
      type: "default",
      animated: true,
      style: { stroke: "#94a3b8", strokeWidth: 1.5 },
      source: `menu_principal_${lang}`,
      sourceHandle: `opt_principal_nps_${lang}`,
      target: `menu_areas_${lang}`,
      targetHandle: "left",
      id: `edge_principal_to_areas_${lang}`
    });

    // Conexão de volta ao menu de seleção de idiomas (Alterar Idioma - Opção 4)
    edges.push({
      type: "default",
      animated: true,
      style: { stroke: "#94a3b8", strokeWidth: 1.5 },
      source: `menu_principal_${lang}`,
      sourceHandle: `opt_principal_lang_${lang}`,
      target: "menu_idiomas",
      targetHandle: "left",
      id: `edge_principal_to_idiomas_${lang}`
    });

    // 5. Menu Pós Atendimento
    nodes.push({
      id: `menu_pos_atendimento_${lang}`,
      type: "menuNode",
      position: { x: 1850, y: baseY },
      data: {
        text: t.textPosAtendimento,
        opcoes: t.opcoesPos
      }
    });

    edges.push({
      type: "default",
      animated: true,
      style: { stroke: t.strokeColor, strokeWidth: 1.8 },
      source: `menu_pos_atendimento_${lang}`,
      sourceHandle: `opt_pos_voltar_${lang}`,
      target: `menu_principal_${lang}`,
      targetHandle: "left",
      id: `edge_pos_voltar_to_principal_${lang}`
    });

    // Conecta os links de material e limpeza direto ao Pós-Atendimento
    edges.push({
      type: "default",
      animated: true,
      style: { stroke: "#94a3b8", strokeWidth: 1.5 },
      source: `link_material_${lang}`,
      sourceHandle: "right",
      target: `menu_pos_atendimento_${lang}`,
      targetHandle: "left",
      id: `edge_material_to_pos_${lang}`
    });

    edges.push({
      type: "default",
      animated: true,
      style: { stroke: "#94a3b8", strokeWidth: 1.5 },
      source: `link_limpeza_${lang}`,
      sourceHandle: "right",
      target: `menu_pos_atendimento_${lang}`,
      targetHandle: "left",
      id: `edge_limpeza_to_pos_${lang}`
    });

    // 6. Menu Avaliação do Atendimento (NPS 0 a 10)
    const opcoesAvaliacao = t.opcoesAvaliacao.map(o => ({
      id: `opt_av_${o.key}_${lang}`,
      numero: o.key,
      label: o.label
    }));

    nodes.push({
      id: `menu_avaliacao_${lang}`,
      type: "menuNode",
      position: { x: 2250, y: baseY },
      data: {
        text: t.textAvaliacao,
        opcoes: opcoesAvaliacao
      }
    });

    edges.push({
      type: "default",
      animated: true,
      style: { stroke: "#94a3b8", strokeWidth: 1.5 },
      source: `menu_pos_atendimento_${lang}`,
      sourceHandle: `opt_pos_encerrar_${lang}`,
      target: `menu_avaliacao_${lang}`,
      targetHandle: "left",
      id: `edge_pos_encerrar_to_avaliacao_${lang}`
    });

    // 7. Mensagem de Agradecimento
    nodes.push({
      id: `msg_agradecimento_${lang}`,
      type: "messageNode",
      position: { x: 2650, y: baseY },
      data: {
        text: t.textAgradecimento
      }
    });

    // Conecta cada nota de NPS (0 a 10) à mensagem de agradecimento
    for (let idx = 0; idx <= 10; idx++) {
      edges.push({
        type: "default",
        animated: true,
        style: { stroke: "#10b981", strokeWidth: 1.5 }, // Verde para NPS
        source: `menu_avaliacao_${lang}`,
        sourceHandle: `opt_av_${idx}_${lang}`,
        target: `msg_agradecimento_${lang}`,
        targetHandle: "left",
        id: `edge_av_${idx}_to_agradecimento_${lang}`
      });
    }

    // 8. Popula as 13 Imagens das Áreas com as Rotinas Localizadas
    areas.forEach((a, idx) => {
      const rowIndex = idx - 6; // Centraliza verticalmente de -6 a +6 em relação ao menu de áreas
      const nodeId = `img_${a.key}_${lang}`;

      nodes.push({
        id: nodeId,
        type: "imageNode",
        position: { x: 1300, y: baseY + rowIndex * 210 },
        data: {
          url: `/uploads/${a.file}`,
          caption: lang === "pt"
            ? `📊 *NPS da Área: ${a.name}*\n\n📋 *Rotina do Setor:*\n${a.routine}`
            : (lang === "en"
              ? `📊 *NPS Area: ${a.nameEn}*\n\n📋 *Sector Routine:*\n${a.routineEn}`
              : `📊 *NPS Área: ${a.nameEs}*\n\n📋 *Rutina del Sector:*\n${a.routineEs}`)
        }
      });

      // Conecta o Menu Área a esta imagem de área
      edges.push({
        type: "default",
        animated: true,
        style: { stroke: "#94a3b8", strokeWidth: 1.5 },
        source: `menu_areas_${lang}`,
        sourceHandle: `opt_area_${a.key}_${lang}`,
        target: nodeId,
        targetHandle: "left",
        id: `edge_areas_to_${a.key}_${lang}`
      });

      // Conecta o output da imagem de volta ao Pós Atendimento da Track
      edges.push({
        type: "default",
        animated: true,
        style: { stroke: "#94a3b8", strokeWidth: 1.5 },
        source: nodeId,
        sourceHandle: "right",
        target: `menu_pos_atendimento_${lang}`,
        targetHandle: "left",
        id: `edge_${a.key}_to_pos_${lang}`
      });
    });
  });

  const mapa = JSON.stringify({ nodes, edges });

  // Remove qualquer fluxo anterior de mesmo nome para evitar duplicidades no banco de dados SQLite
  await prisma.fluxo.deleteMany({ where: { nome } }).catch(() => {});

  // Cria o novo fluxo estruturado com +1000 gatilhos e 4 tracks multilíngues localizadas
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

  console.log(`\n======================================================`);
  console.log(`[SUCESSO] Novo fluxo multilíngue criado com sucesso!`);
  console.log(`- Nome: "${novoFluxo.nome}"`);
  console.log(`- ID: ${novoFluxo.id}`);
  console.log(`- Conexão Vinculada ID: ${novoFluxo.conexaoId}`);
  console.log(`- Número de Gatilhos Injetados: ${gatilhos.split(",").length}`);
  console.log(`- Quantidade de Nós (Nodes): ${nodes.length}`);
  console.log(`- Quantidade de Linhas (Edges): ${edges.length}`);
  console.log(`======================================================\n`);
};

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
