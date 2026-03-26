const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    const settings = await prisma.clinicSettings.findUnique({ where: { id: 1 } });
    console.log(settings);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
})();
