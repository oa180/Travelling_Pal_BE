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

  // --- OFFERS --- (use individual create to avoid OfferCreateManyInput type drift)
  await Promise.all([
    // Bali Escape
    prisma.offer.create({
      data: {
        title: 'Bali Escape',
        description: '7-day tropical getaway with beaches and temples.',
        destination: 'Bali, Indonesia',
        price: 899,
        originalPrice: 1099,
        imageUrl:
          'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&h=800&fit=crop',
        availableDates: ['2025-10-05', '2025-11-12', '2026-01-20'],
        availableMonths: ['2025-10', '2025-11', '2026-01'],
        durationDays: 7,
        starRating: 4.8,
        transportType: 'flight',
        accommodationLevel: 'standard',
        maxTravelers: 12,
        includes: ['Flights', 'Hotel', 'Breakfast', 'Airport Transfers'],
        providerId: 'prov_1',
        providerName: 'Island Tours',
        isActive: true,
        country: 'Indonesia',
        continent: 'Asia',
        // Required legacy fields
        seats: 20,
        startDate: new Date('2025-10-05'),
        endDate: new Date('2025-10-12'),
        companyId: nileTours.id,
      },
    }),

    // Paris City Lights
    prisma.offer.create({
      data: {
        title: 'Paris City Lights',
        description: '5 days in the City of Love with museum passes.',
        destination: 'Paris, France',
        price: 1299,
        originalPrice: 1499,
        imageUrl:
          'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=1200&h=800&fit=crop',
        availableDates: ['2025-09-15', '2025-12-01', '2026-02-10'],
        availableMonths: ['2025-09', '2025-12', '2026-02'],
        durationDays: 5,
        starRating: 4.9,
        transportType: 'flight',
        accommodationLevel: 'premium',
        maxTravelers: 8,
        includes: ['Flights', 'Hotel', 'Breakfast', 'Museum Pass'],
        providerId: 'prov_2',
        providerName: 'Elegance Travel',
        isActive: true,
        country: 'France',
        continent: 'Europe',
        seats: 16,
        startDate: new Date('2025-09-15'),
        endDate: new Date('2025-09-20'),
        companyId: pyramidAdventures.id,
      },
    }),

    // Tokyo Discovery
    prisma.offer.create({
      data: {
        title: 'Tokyo Discovery',
        description: '6-day culture and cuisine experience in Tokyo.',
        destination: 'Tokyo, Japan',
        price: 1599,
        originalPrice: 1799,
        imageUrl:
          'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&h=800&fit=crop',
        availableDates: ['2025-11-05', '2026-01-15', '2026-03-22'],
        availableMonths: ['2025-11', '2026-01', '2026-03'],
        durationDays: 6,
        starRating: 4.7,
        transportType: 'flight',
        accommodationLevel: 'luxury',
        maxTravelers: 10,
        includes: ['Flights', 'Hotel', 'Breakfast', 'City Tour'],
        providerId: 'prov_3',
        providerName: 'Nippon Adventures',
        isActive: true,
        country: 'Japan',
        continent: 'Asia',
        seats: 20,
        startDate: new Date('2025-11-05'),
        endDate: new Date('2025-11-11'),
        companyId: nileTours.id,
      },
    }),

    // Santorini Sunsets
    prisma.offer.create({
      data: {
        title: 'Santorini Sunsets',
        description: '4-day romantic escape with caldera views.',
        destination: 'Santorini, Greece',
        price: 1199,
        originalPrice: 1399,
        imageUrl:
          'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=1200&h=800&fit=crop',
        availableDates: ['2025-09-28', '2025-10-18', '2026-04-05'],
        availableMonths: ['2025-09', '2025-10', '2026-04'],
        durationDays: 4,
        starRating: 4.9,
        transportType: 'flight',
        accommodationLevel: 'premium',
        maxTravelers: 6,
        includes: ['Flights', 'Hotel', 'Breakfast', 'Sunset Cruise'],
        providerId: 'prov_4',
        providerName: 'Aegean Getaways',
        isActive: true,
        country: 'Greece',
        continent: 'Europe',
        seats: 12,
        startDate: new Date('2025-10-18'),
        endDate: new Date('2025-10-22'),
        companyId: pyramidAdventures.id,
      },
    }),
  ]);

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
 