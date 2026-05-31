# Deploy na VPS

## VPS recomendadas (baratas)
- **Hetzner** - €4/mês (2GB RAM)
- **DigitalOcean** - $6/mês (1GB RAM)
- **Contabo** - €5/mês (4GB RAM)
- **Oracle Cloud** - GRÁTIS (free tier, 1GB RAM)

## Requisitos mínimos
- Ubuntu 22.04+
- 1GB RAM
- Node.js 18+
- Google Chrome/Chromium (para whatsapp-web.js)

## Passo a passo

### 1. Conectar na VPS
```bash
ssh root@SEU_IP
```

### 2. Instalar dependências do sistema
```bash
apt update && apt upgrade -y
apt install -y curl git chromium-browser

# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Instalar PM2 (gerenciador de processos)
npm install -g pm2
```

### 3. Clonar o projeto
```bash
cd /root
git clone https://github.com/SEU_USUARIO/chatbot.git
cd chatbot
```

### 4. Instalar e buildar
```bash
npm run install:all
npm run build
```

### 5. Configurar variáveis (opcional)
```bash
# No arquivo backend/.env
PORT=3001
```

### 6. Iniciar com PM2
```bash
cd backend
pm2 start src/index.js --name chatbot
pm2 save
pm2 startup  # auto-iniciar no boot
```

### 7. Acessar
Abra no navegador: `http://SEU_IP:3001`

## Atualizar depois
```bash
cd /root/chatbot
git pull
npm run build
pm2 restart chatbot
```

## Opcional: domínio + HTTPS com Nginx
```bash
apt install -y nginx certbot python3-certbot-nginx

# Criar config do Nginx
cat > /etc/nginx/sites-available/chatbot << 'EOF'
server {
    listen 80;
    server_name seudominio.com.br;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

ln -s /etc/nginx/sites-available/chatbot /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx

# HTTPS grátis
certbot --nginx -d seudominio.com.br
```
