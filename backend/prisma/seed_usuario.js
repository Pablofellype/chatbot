const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

async function main() {
  const adminUsername = 'admin';
  const rawPassword = 'admin';
  const hashedPassword = hashPassword(rawPassword);

  const usuarioExistente = await prisma.usuario.findUnique({
    where: { username: adminUsername }
  });

  if (!usuarioExistente) {
    await prisma.usuario.create({
      data: {
        username: adminUsername,
        password: hashedPassword,
        nome: 'Administrador Brasal'
      }
    });
    console.log('[SEED] Usuário administrador padrão criado com sucesso!');
    console.log('Username: admin');
    console.log('Password: admin');
  } else {
    console.log('[SEED] Usuário administrador já existe.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
