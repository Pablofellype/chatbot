# 📖 Glossário do Sistema de Chatbot WhatsApp

Este documento contém a explicação detalhada de termos técnicos, ferramentas e conceitos utilizados no desenvolvimento, operação e deploy deste sistema de chatbot de WhatsApp com painel administrativo e editor de fluxos visuais.

---

## 📂 Categorias de Termos

1. [Geral e Negócios](#-geral-e-negócios)
2. [Backend e Banco de Dados](#-backend-e-banco-de-dados)
3. [Frontend e Interface](#-frontend-e-interface)
4. [Infraestrutura e Deploy](#-infraestrutura-e-deploy)

---

## 💼 Geral e Negócios

### Chatbot
Um software projetado para simular conversas humanas via texto ou voz. No contexto deste projeto, o chatbot é integrado ao WhatsApp para responder automaticamente a clientes baseando-se nos fluxos de conversa criados no painel.

### Conexões
Configurações de números de WhatsApp integrados ao sistema. A arquitetura multiconexão permite cadastrar e gerenciar múltiplos números de WhatsApp (por exemplo, um para o setor de "Suporte", outro para o "Financeiro"), cada um com seus próprios fluxos e regras de atendimento.

### Fluxos (Flows)
A estrutura lógica e sequencial que determina o comportamento do robô. É o roteiro de atendimento visualmente mapeado contendo perguntas, respostas, envio de mídias, caminhos de decisão (se o cliente digitar 1, vai para o Passo X; se digitar 2, vai para o Passo Y) e direcionamento humano.

### QR Code de Autenticação
O código bidimensional dinâmico exibido no painel de conexões do sistema. Assim como no WhatsApp Web oficial, o administrador precisa escanear este código usando a câmera do celular no aplicativo oficial do WhatsApp (Configurações > Aparelhos Conectados) para autorizar e iniciar a sessão do bot.

### Números Autorizados
Configuração de segurança no painel que permite definir quais números de telefone externos estão autorizados a interagir e iniciar os fluxos automáticos com o chatbot. Ideal para ambientes de homologação ou testes controlados.

---

## ⚙️ Backend e Banco de Dados

### Node.js
Ambiente de execução JavaScript assíncrono e orientado a eventos, projetado para construir aplicações de rede rápidas e escaláveis no lado do servidor (backend). É o motor que executa a API e o robô de envio de mensagens do sistema.

### Express
Micro-framework minimalista para Node.js que facilita o gerenciamento de rotas HTTP, requisições, respostas e middlewares. É utilizado neste projeto para estruturar as rotas da API que o painel do frontend consome.

### whatsapp-web.js
Uma biblioteca poderosa para Node.js que se conecta à API oficial-oculta do WhatsApp Web através de uma instância em segundo plano do navegador Chromium. Ela permite ler, enviar e escutar mensagens de forma automatizada.

### Prisma ORM
Mapeador Objeto-Relacional (ORM) moderno para Node.js. Ele atua como um intermediário entre o código e o banco de dados, permitindo ler, gravar e atualizar dados usando sintaxe JavaScript pura, sem a necessidade de escrever consultas SQL complexas.

### SQLite
Um motor de banco de dados SQL leve, extremamente rápido e embutido diretamente no projeto. Ele não necessita de um servidor externo (como MySQL ou PostgreSQL) sendo executado, gravando todas as tabelas e dados em um único arquivo local (`dev.db`).

### Schema do Prisma (`schema.prisma`)
O arquivo de configuração central do Prisma onde a modelagem e o relacionamento do banco de dados (tabelas de usuários, conexões, fluxos, mensagens agendadas) são estruturados.

### Migrations (Prisma Migrate)
Histórico estruturado de alterações de banco de dados gerado pelo Prisma. Cada migration descreve como transformar o banco de dados de um estado para o outro (ex: criando tabelas de agendamento de mensagens), garantindo consistência entre ambientes de desenvolvimento e produção.

### Agendador de Mensagens (Scheduler)
Mecanismo lógico programado no backend que verifica periodicamente (usando loops temporizadores) se há mensagens agendadas a serem disparadas para clientes específicos na data/hora exata configurada no banco de dados.

---

## 🎨 Frontend e Interface

### React
Uma das bibliotecas JavaScript mais populares do mundo para a criação de interfaces de usuário modernas, reativas e modulares baseadas em componentes. Desenvolvida pela Meta (Facebook), ela permite atualizar apenas as partes necessárias da página em tempo real.

### Vite
Uma ferramenta de build e empacotamento frontend que substituiu o antigo Create React App. É extremamente rápida porque utiliza módulos nativos do navegador durante o desenvolvimento e ferramentas super otimizadas para gerar os arquivos de produção.

### Tailwind CSS
Um framework CSS baseado em classes de utilidade utilitárias. Em vez de escrever arquivos CSS separados com seletores complexos, o Tailwind permite estilizar elementos HTML diretamente aplicando classes pré-prontas diretamente na tag, gerando designs responsivos de forma muito veloz.

### React Flow
Uma biblioteca altamente robusta construída especificamente para React que permite desenhar e editar mapas mentais, diagramas de blocos ou fluxos interativos (neste caso, o editor onde o usuário arrasta caixas de texto, conecta cabos e constrói a árvore de decisão do chatbot).

### Componentes (Components)
Pequenos blocos de código isolados, reutilizáveis e independentes que compõem uma interface visual (ex: um botão de status, um cartão de conexão, o menu de navegação lateral ou o painel de configuração do robô).

### SPA (Single Page Application)
Aplicações web que carregam apenas uma única página HTML e atualizam dinamicamente o conteúdo à medida que o usuário interage com o app, eliminando a lentidão e o piscar de tela tradicional das recargas completas de páginas.

---

## ☁️ Infraestrutura e Deploy

### VPS (Virtual Private Server)
Um servidor virtual rodando na nuvem 24 horas por dia, 7 dias por semana. É contratado junto a provedores (como Hetzner, DigitalOcean, Contabo) para hospedar a aplicação para que ela continue executando e respondendo os clientes mesmo que o seu computador pessoal esteja desligado.

### PM2
Um gerenciador de processos de nível de produção feito especificamente para aplicativos Node.js. Ele garante que o seu backend continue rodando em segundo plano na VPS, reinicia a aplicação automaticamente caso ocorra algum erro crítico e a ativa no boot do sistema.

### Nginx
Um servidor HTTP de altíssima performance e proxy reverso. Na VPS, ele recebe as requisições que chegam do navegador dos usuários e as redireciona internamente para as portas onde os serviços do chatbot estão rodando, aumentando a segurança e eficiência da rede.

### HTTPS / SSL (Let's Encrypt)
Certificado de segurança digital que encripta a comunicação entre o navegador do usuário e o servidor na VPS, representado pelo cadeado verde na barra de endereços. O Let's Encrypt fornece esses certificados gratuitamente através da ferramenta de automação **Certbot**.

### Portas Lógicas (Ex: `3001` e `5173`)
Canais de comunicação de rede no computador. A porta `3001` é usada padrão pelo backend (API), enquanto a `5173` é a porta padrão onde o servidor de desenvolvimento do Vite (frontend) escuta as requisições locais.
