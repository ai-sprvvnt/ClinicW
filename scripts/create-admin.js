const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];
  const isSuper = process.argv[4] === 'super';

  if (!email || !password) {
    console.error('Uso: node scripts/create-admin.js <email> <password>');
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.error('El usuario ya existe:', email);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: 'ADMIN',
      isSuperAdmin: isSuper,
    },
  });

  console.log('Admin creado:', email);
}

main()
  .catch((err) => {
    console.error('Error creando admin:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
