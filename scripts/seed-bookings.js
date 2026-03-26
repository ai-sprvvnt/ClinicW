const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function getMonthStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getMonthEnd(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function makeBooking(date, startMin, durationMin) {
  const startAt = new Date(date);
  startAt.setHours(Math.floor(startMin / 60), startMin % 60, 0, 0);
  const endAt = new Date(startAt.getTime() + durationMin * 60000);
  const dateKey = startAt.toISOString().slice(0, 10);
  return { startAt, endAt, dateKey, startMin, endMin: startMin + durationMin };
}

async function main() {
  const rooms = await prisma.room.findMany();
  const doctors = await prisma.doctor.findMany();

  if (rooms.length === 0 || doctors.length === 0) {
    console.error('Necesitas al menos 1 consultorio y 1 médico antes de sembrar reservas.');
    process.exit(1);
  }

  const now = new Date();
  const currentMonthStart = getMonthStart(now);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthStart = getMonthStart(lastMonth);

  const seedDays = [2, 5, 9, 12, 16, 20, 24];
  const timeSlots = [9 * 60, 10 * 60 + 30, 12 * 60, 15 * 60, 17 * 60];
  const durationMin = 60;

  const bookingsToCreate = [];

  const months = [currentMonthStart, lastMonthStart];
  months.forEach((monthStart) => {
    seedDays.forEach((dayOffset) => {
      const date = addDays(monthStart, dayOffset);
      timeSlots.forEach((slot, idx) => {
        const room = rooms[idx % rooms.length];
        const doctor = doctors[(idx + dayOffset) % doctors.length];
        const { startAt, endAt, dateKey, startMin, endMin } = makeBooking(date, slot, durationMin);
        bookingsToCreate.push({
          roomId: room.id,
          doctorId: doctor.id,
          dateKey,
          startAt,
          endAt,
          startMin,
          endMin,
          status: 'confirmed',
        });
      });
    });
  });

  await prisma.booking.createMany({ data: bookingsToCreate });
  console.log(`Reservas creadas: ${bookingsToCreate.length}`);
}

main()
  .catch((err) => {
    console.error('Error sembrando reservas:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
