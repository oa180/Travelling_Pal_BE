import { PrismaClient, UserRole, CompanyType, OfferKind, BookingStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 1) Users (password: secret123)
  const passwordHash = await bcrypt.hash('secret123', 10);

  const users = await prisma.$transaction([
    prisma.user.create({ data: { email: 'co1@example.com', passwordHash, role: UserRole.COMPANY } }),
    prisma.user.create({ data: { email: 'co2@example.com', passwordHash, role: UserRole.COMPANY } }),
    prisma.user.create({ data: { email: 'co3@example.com', passwordHash, role: UserRole.COMPANY } }),
    prisma.user.create({ data: { email: 'trav1@example.com', passwordHash, role: UserRole.TRAVELER } }),
    prisma.user.create({ data: { email: 'trav2@example.com', passwordHash, role: UserRole.TRAVELER } }),
    prisma.user.create({ data: { email: 'trav3@example.com', passwordHash, role: UserRole.TRAVELER } }),
    prisma.user.create({ data: { email: 'trav4@example.com', passwordHash, role: UserRole.TRAVELER } }),
  ]);

  const [co1User, co2User, co3User, trav1User, trav2User, trav3User, trav4User] = users;

  // 2) Companies (1:1 link via userId)
  const [nileTours, pyramidAdventures, alpineCo] = await prisma.$transaction([
    prisma.company.create({ data: { name: 'Nile Tours', type: CompanyType.TOURISM, userId: co1User.id } }),
    prisma.company.create({ data: { name: 'Pyramid Adventures', type: CompanyType.TOURISM, userId: co2User.id } }),
    prisma.company.create({ data: { name: 'Alpine Co', type: CompanyType.TRANSPORT, userId: co3User.id } }),
  ]);

  // 3) Travelers (1:1 link via userId)
  const [trav1, trav2, trav3, trav4] = await prisma.$transaction([
    prisma.traveler.create({ data: { name: 'Omar Abd El-Rahman', userId: trav1User.id } }),
    prisma.traveler.create({ data: { name: 'Sara Ahmed', userId: trav2User.id } }),
    prisma.traveler.create({ data: { name: 'John Smith', userId: trav3User.id } }),
    prisma.traveler.create({ data: { name: 'Alice Johnson', userId: trav4User.id } }),
  ]);

  // 4) Offers (rich for analytics)
  const offers = await prisma.$transaction([
    prisma.offer.create({
      data: {
        title: 'Bali Escape',
        description: '7-day tropical getaway with beaches and temples.',
        destination: 'Bali, Indonesia',
        price: 899,
        originalPrice: 1099,
        imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&h=800&fit=crop',
        availableDates: ['2025-10-05', '2025-11-12', '2026-01-20'] as any,
        availableMonths: ['2025-10', '2025-11', '2026-01'] as any,
        durationDays: 7,
        starRating: 4.8,
        transportType: 'flight',
        accommodationLevel: 'standard',
        maxTravelers: 12,
        includes: ['Flights', 'Hotel', 'Breakfast', 'Airport Transfers'] as any,
        providerId: 'prov_1',
        providerName: 'Island Tours',
        isActive: true,
        country: 'Indonesia',
        continent: 'Asia',
        seats: 20,
        startDate: new Date('2025-10-05'),
        endDate: new Date('2025-10-12'),
        impressions: 40000,
        clicks: 3200,
        kind: OfferKind.TRIP,
        companyId: nileTours.id,
      },
    }),
    prisma.offer.create({
      data: {
        title: 'Paris City Lights',
        description: '5 days in the City of Love with museum passes.',
        destination: 'Paris, France',
        price: 1299,
        originalPrice: 1499,
        imageUrl: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=1200&h=800&fit=crop',
        availableDates: ['2025-09-15', '2025-12-01', '2026-02-10'] as any,
        availableMonths: ['2025-09', '2025-12', '2026-02'] as any,
        durationDays: 5,
        starRating: 4.9,
        transportType: 'flight',
        accommodationLevel: 'premium',
        maxTravelers: 8,
        includes: ['Flights', 'Hotel', 'Breakfast', 'Museum Pass'] as any,
        providerId: 'prov_2',
        providerName: 'Elegance Travel',
        isActive: true,
        country: 'France',
        continent: 'Europe',
        seats: 16,
        startDate: new Date('2025-09-15'),
        endDate: new Date('2025-09-20'),
        impressions: 22000,
        clicks: 1500,
        kind: OfferKind.TRIP,
        companyId: pyramidAdventures.id,
      },
    }),
    prisma.offer.create({
      data: {
        title: 'Tokyo Discovery',
        description: '6-day culture and cuisine experience in Tokyo.',
        destination: 'Tokyo, Japan',
        price: 1599,
        originalPrice: 1799,
        imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&h=800&fit=crop',
        availableDates: ['2025-11-05', '2026-01-15', '2026-03-22'] as any,
        availableMonths: ['2025-11', '2026-01', '2026-03'] as any,
        durationDays: 6,
        starRating: 4.7,
        transportType: 'flight',
        accommodationLevel: 'luxury',
        maxTravelers: 10,
        includes: ['Flights', 'Hotel', 'Breakfast', 'City Tour'] as any,
        providerId: 'prov_3',
        providerName: 'Nippon Adventures',
        isActive: true,
        country: 'Japan',
        continent: 'Asia',
        seats: 20,
        startDate: new Date('2025-11-05'),
        endDate: new Date('2025-11-11'),
        impressions: 36000,
        clicks: 2900,
        kind: OfferKind.TRIP,
        companyId: nileTours.id,
      },
    }),
    prisma.offer.create({
      data: {
        title: 'Santorini Sunsets',
        description: '4-day romantic escape with caldera views.',
        destination: 'Santorini, Greece',
        price: 1199,
        originalPrice: 1399,
        imageUrl: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=1200&h=800&fit=crop',
        availableDates: ['2025-10-18', '2026-04-05'] as any,
        availableMonths: ['2025-10', '2026-04'] as any,
        durationDays: 4,
        starRating: 4.9,
        transportType: 'flight',
        accommodationLevel: 'premium',
        maxTravelers: 6,
        includes: ['Flights', 'Hotel', 'Breakfast', 'Sunset Cruise'] as any,
        providerId: 'prov_4',
        providerName: 'Aegean Getaways',
        isActive: true,
        country: 'Greece',
        continent: 'Europe',
        seats: 12,
        startDate: new Date('2025-10-18'),
        endDate: new Date('2025-10-22'),
        impressions: 14000,
        clicks: 1200,
        kind: OfferKind.TRIP,
        companyId: pyramidAdventures.id,
      },
    }),
  ]);

  const [bali, paris, tokyo, santorini] = offers;

  // 4b) Generate many more offers for company 1 (nileTours)
  const destinations = [
    'Bali, Indonesia',
    'Paris, France',
    'Tokyo, Japan',
    'Santorini, Greece',
    'Cairo, Egypt',
    'Dubai, UAE',
    'Rome, Italy',
    'Bangkok, Thailand',
    'Athens, Greece',
    'Barcelona, Spain',
  ];
  const images = [
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=1200&h=800&fit=crop',
  ];
  const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pick = <T,>(arr: T[]) => arr[randInt(0, arr.length - 1)];

  const moreOffersPromises = Array.from({ length: 60 }, (_, i) => {
    const title = `Company1 Offer #${i + 1}`;
    const destination = pick(destinations);
    const price = randInt(400, 2400);
    const seats = randInt(8, 40);
    const start = new Date();
    start.setDate(start.getDate() + randInt(5, 180));
    const end = new Date(start.getTime());
    end.setDate(start.getDate() + randInt(3, 10));
    const impressions = randInt(2000, 50000);
    const clicks = Math.max(0, Math.floor(impressions * (Math.random() * 0.12)));
    const imageUrl = pick(images);
    return prisma.offer.create({
      data: {
        title,
        description: `Auto-generated package ${i + 1} to ${destination}`,
        destination,
        price,
        seats,
        startDate: start,
        endDate: end,
        kind: OfferKind.TRIP,
        companyId: nileTours.id, // company 1
        impressions,
        clicks,
        imageUrl,
        isActive: true,
      },
    });
  });
  const extraOffers = await prisma.$transaction(moreOffersPromises);
  const allOffersForCompany1 = [bali, paris, tokyo, santorini, ...extraOffers].filter(
    (o) => o.companyId === nileTours.id,
  );

  // 5) Transports
  await prisma.transport.createMany({
    data: [
      { type: 'BUS', from: 'Cairo', to: 'Sharm El-Sheikh', price: 800, seats: 40, companyId: alpineCo.id },
      { type: 'TRAIN', from: 'Cairo', to: 'Luxor', price: 1200, seats: 60, companyId: alpineCo.id },
      { type: 'FLIGHT', from: 'Cairo', to: 'Luxor', price: 2200, seats: 50, companyId: alpineCo.id },
      { type: 'FLIGHT', from: 'Cairo', to: 'Sharm El-Sheikh', price: 1800, seats: 45, companyId: alpineCo.id },
    ],
  });

  // 6) Bookings (varied statuses & dates for analytics time series)
  await prisma.$transaction([
    prisma.booking.create({ data: { travelerId: trav1.id, offerId: bali.id, status: BookingStatus.CONFIRMED, createdAt: new Date('2025-09-26T13:48:35Z') } }),
    prisma.booking.create({ data: { travelerId: trav2.id, offerId: paris.id, status: BookingStatus.PENDING, createdAt: new Date('2025-09-26T15:12:59Z') } }),
    prisma.booking.create({ data: { travelerId: trav3.id, offerId: tokyo.id, status: BookingStatus.CONFIRMED, createdAt: new Date('2025-09-28T11:22:10Z') } }),
    prisma.booking.create({ data: { travelerId: trav4.id, offerId: bali.id, status: BookingStatus.CANCELLED, createdAt: new Date('2025-09-29T08:05:00Z') } }),
    prisma.booking.create({ data: { travelerId: trav1.id, offerId: santorini.id, status: BookingStatus.CONFIRMED, createdAt: new Date('2025-10-01T10:00:00Z') } }),
    prisma.booking.create({ data: { travelerId: trav2.id, offerId: bali.id, status: BookingStatus.CONFIRMED, createdAt: new Date('2025-10-02T12:30:00Z') } }),
  ]);

  // 6b) Bulk random bookings for company 1
  const travelers = [trav1, trav2, trav3, trav4];
  const bookingRows: { travelerId: number; offerId: number; status: BookingStatus; createdAt: Date }[] = [];
  for (let i = 0; i < 80; i++) {
    const traveler = pick(travelers);
    const offer = pick(allOffersForCompany1);
    const roll = Math.random();
    const status: BookingStatus = roll < 0.7 ? BookingStatus.CONFIRMED : roll < 0.9 ? BookingStatus.PENDING : BookingStatus.CANCELLED;
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - randInt(0, 60));
    createdAt.setHours(randInt(0, 23), randInt(0, 59), randInt(0, 59), 0);
    bookingRows.push({ travelerId: traveler.id, offerId: offer.id, status, createdAt });
  }
  await prisma.booking.createMany({ data: bookingRows });

  // 7) Reviews
  await prisma.review.createMany({
    data: [
      { travelerId: trav1.id, companyId: nileTours.id, rating: 5, comment: 'Amazing trip! Well organized.' },
      { travelerId: trav2.id, companyId: pyramidAdventures.id, rating: 4, comment: 'Great service but could improve food options.' },
      { travelerId: trav3.id, companyId: alpineCo.id, rating: 3, comment: 'On time and comfortable.' },
    ],
  });

  console.log('✅ Seed done. Accounts: co1@example.com, co2@example.com, co3@example.com, trav1..4@example.com (password: secret123)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });