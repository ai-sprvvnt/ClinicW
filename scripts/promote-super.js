const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Uso: node scripts/promote-super.js <email>');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error('Usuario no encontrado:', email);
    process.exit(1);
  }

  await prisma.user.update({
    where: { email },
    data: { isSuperAdmin: true },
  });

  console.log('Usuario promovido a super admin:', email);
}

main()
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
