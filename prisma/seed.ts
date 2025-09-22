import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // --- COMPANIES ---
  const nileTours = await prisma.company.create({
    data: { name: 'Nile Tours', type: 'TOURISM' },
  });

  const pyramidAdventures = await prisma.company.create({
    data: { name: 'Pyramid Adventures', type: 'TOURISM' },
  });

  const cairoTransport = await prisma.company.create({
    data: { name: 'Cairo Transport', type: 'TRANSPORT' },
  });

  const egyptAir = await prisma.company.create({
    data: { name: 'EgyptAir Express', type: 'TRANSPORT' },
  });

  // --- OFFERS ---
  await prisma.offer.createMany({
    data: [
      {
        title: 'Sharm El-Sheikh 4 Nights',
        description: 'Luxury hotel stay with guided excursions',
        price: 15000,
        seats: 20,
        startDate: new Date('2025-11-01'),
        endDate: new Date('2025-11-05'),
        companyId: nileTours.id,
      },
      {
        title: 'Luxor & Aswan Nile Cruise',
        description: '5 nights on a luxury cruise ship',
        price: 18000,
        seats: 15,
        startDate: new Date('2025-12-01'),
        endDate: new Date('2025-12-06'),
        companyId: nileTours.id,
      },
      {
        title: 'Cairo Pyramids Weekend',
        description: '2 nights with a guided Giza pyramids tour',
        price: 8000,
        seats: 30,
        startDate: new Date('2025-10-15'),
        endDate: new Date('2025-10-17'),
        companyId: pyramidAdventures.id,
      },
      {
        title: 'Hurghada Beach Escape',
        description: '3 nights at an all-inclusive resort',
        price: 12000,
        seats: 25,
        startDate: new Date('2025-11-10'),
        endDate: new Date('2025-11-13'),
        companyId: pyramidAdventures.id,
      },
    ],
  });

  // --- TRANSPORT OPTIONS ---
  await prisma.transport.createMany({
    data: [
      {
        type: 'BUS',
        from: 'Cairo',
        to: 'Sharm El-Sheikh',
        price: 800,
        seats: 40,
        companyId: cairoTransport.id,
      },
      {
        type: 'TRAIN',
        from: 'Cairo',
        to: 'Luxor',
        price: 1200,
        seats: 60,
        companyId: cairoTransport.id,
      },
      {
        type: 'FLIGHT',
        from: 'Cairo',
        to: 'Luxor',
        price: 2200,
        seats: 50,
        companyId: egyptAir.id,
      },
      {
        type: 'FLIGHT',
        from: 'Cairo',
        to: 'Sharm El-Sheikh',
        price: 1800,
        seats: 45,
        companyId: egyptAir.id,
      },
    ],
  });

  // --- TRAVELERS ---
  const traveler1 = await prisma.traveler.create({
    data: { name: 'Omar Abd El-Rahman', email: 'omar@example.com' },
  });
  const traveler2 = await prisma.traveler.create({
    data: { name: 'Sara Ahmed', email: 'sara@example.com' },
  });
  const traveler3 = await prisma.traveler.create({
    data: { name: 'John Smith', email: 'john@example.com' },
  });

  // --- BOOKINGS ---
  await prisma.booking.createMany({
    data: [
      {
        travelerId: traveler1.id,
        offerId: 1, // Sharm
        status: 'CONFIRMED',
      },
      {
        travelerId: traveler2.id,
        offerId: 2, // Luxor cruise
        status: 'PENDING',
      },
      {
        travelerId: traveler3.id,
        transportId: 1, // Bus Cairo -> Sharm
        status: 'CONFIRMED',
      },
    ],
  });

  // --- REVIEWS ---
  await prisma.review.createMany({
    data: [
      {
        travelerId: traveler1.id,
        companyId: nileTours.id,
        rating: 5,
        comment: 'Amazing trip! Well organized.',
      },
      {
        travelerId: traveler2.id,
        companyId: pyramidAdventures.id,
        rating: 4,
        comment: 'Great service but could improve food options.',
      },
      {
        travelerId: traveler3.id,
        companyId: cairoTransport.id,
        rating: 3,
        comment: 'Bus was a bit late, but comfortable ride.',
      },
    ],
  });

  console.log('✅ Database seeded successfully');
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
 