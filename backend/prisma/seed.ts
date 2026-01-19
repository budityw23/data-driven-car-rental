import { PrismaClient, CarType, Transmission, FuelType, CarStatus, UserRole, BookingStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // ============================================
  // 1. Clear existing data (in correct order)
  // ============================================
  console.log('🗑️  Clearing existing data...');
  await prisma.auditLog.deleteMany();
  await prisma.bookingAddon.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.addon.deleteMany();
  await prisma.location.deleteMany();
  await prisma.car.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Existing data cleared');

  // ============================================
  // 2. Create Users (2 admins + 10 customers)
  // ============================================
  console.log('👥 Creating users...');
  const passwordHash = await bcrypt.hash('password123', 10);

  const admin1 = await prisma.user.create({
    data: {
      email: 'admin@carrental.com',
      name: 'Admin User',
      passwordHash,
      role: UserRole.ADMIN,
    },
  });

  const admin2 = await prisma.user.create({
    data: {
      email: 'support@carrental.com',
      name: 'Support Admin',
      passwordHash,
      role: UserRole.ADMIN,
    },
  });

  const customers = await Promise.all([
    prisma.user.create({
      data: { email: 'john.doe@example.com', name: 'John Doe', passwordHash, role: UserRole.CUSTOMER },
    }),
    prisma.user.create({
      data: { email: 'jane.smith@example.com', name: 'Jane Smith', passwordHash, role: UserRole.CUSTOMER },
    }),
    prisma.user.create({
      data: { email: 'bob.wilson@example.com', name: 'Bob Wilson', passwordHash, role: UserRole.CUSTOMER },
    }),
    prisma.user.create({
      data: { email: 'alice.brown@example.com', name: 'Alice Brown', passwordHash, role: UserRole.CUSTOMER },
    }),
    prisma.user.create({
      data: { email: 'charlie.davis@example.com', name: 'Charlie Davis', passwordHash, role: UserRole.CUSTOMER },
    }),
    prisma.user.create({
      data: { email: 'emma.taylor@example.com', name: 'Emma Taylor', passwordHash, role: UserRole.CUSTOMER },
    }),
    prisma.user.create({
      data: { email: 'david.miller@example.com', name: 'David Miller', passwordHash, role: UserRole.CUSTOMER },
    }),
    prisma.user.create({
      data: { email: 'sarah.anderson@example.com', name: 'Sarah Anderson', passwordHash, role: UserRole.CUSTOMER },
    }),
    prisma.user.create({
      data: { email: 'michael.thomas@example.com', name: 'Michael Thomas', passwordHash, role: UserRole.CUSTOMER },
    }),
    prisma.user.create({
      data: { email: 'lisa.jackson@example.com', name: 'Lisa Jackson', passwordHash, role: UserRole.CUSTOMER },
    }),
  ]);
  console.log(`✅ Created ${customers.length + 2} users (2 admins, ${customers.length} customers)`);

  // ============================================
  // 3. Create Locations (8 locations)
  // ============================================
  console.log('📍 Creating locations...');
  const locations = await Promise.all([
    prisma.location.create({
      data: {
        name: 'Jakarta Airport (CGK)',
        address: 'Soekarno-Hatta International Airport, Tangerang, Banten',
        isActive: true,
      },
    }),
    prisma.location.create({
      data: {
        name: 'Jakarta Downtown',
        address: 'Jl. Sudirman, Central Jakarta, DKI Jakarta',
        isActive: true,
      },
    }),
    prisma.location.create({
      data: {
        name: 'Surabaya Airport (SUB)',
        address: 'Juanda International Airport, Sidoarjo, East Java',
        isActive: true,
      },
    }),
    prisma.location.create({
      data: {
        name: 'Bali Airport (DPS)',
        address: 'Ngurah Rai International Airport, Badung, Bali',
        isActive: true,
      },
    }),
    prisma.location.create({
      data: {
        name: 'Bali Ubud',
        address: 'Jl. Raya Ubud, Gianyar, Bali',
        isActive: true,
      },
    }),
    prisma.location.create({
      data: {
        name: 'Bandung City Center',
        address: 'Jl. Asia Afrika, Bandung, West Java',
        isActive: true,
      },
    }),
    prisma.location.create({
      data: {
        name: 'Yogyakarta Airport (JOG)',
        address: 'Yogyakarta International Airport, Kulon Progo, DIY',
        isActive: true,
      },
    }),
    prisma.location.create({
      data: {
        name: 'Medan City',
        address: 'Jl. Imam Bonjol, Medan, North Sumatra',
        isActive: true,
      },
    }),
  ]);
  console.log(`✅ Created ${locations.length} locations`);

  // ============================================
  // 4. Create Add-ons (10 add-ons)
  // ============================================
  console.log('🎁 Creating add-ons...');
  const addons = await Promise.all([
    prisma.addon.create({
      data: {
        name: 'GPS Navigation',
        description: 'Garmin GPS device with Indonesia maps',
        pricePerBooking: 50000,
        isActive: true,
      },
    }),
    prisma.addon.create({
      data: {
        name: 'Child Safety Seat',
        description: 'Child car seat for kids 0-4 years',
        pricePerBooking: 75000,
        isActive: true,
      },
    }),
    prisma.addon.create({
      data: {
        name: 'Extra Driver',
        description: 'Add an additional authorized driver',
        pricePerBooking: 100000,
        isActive: true,
      },
    }),
    prisma.addon.create({
      data: {
        name: 'WiFi Hotspot',
        description: 'Portable WiFi device with 10GB data',
        pricePerBooking: 80000,
        isActive: true,
      },
    }),
    prisma.addon.create({
      data: {
        name: 'Insurance Premium',
        description: 'Full coverage insurance with zero deductible',
        pricePerBooking: 150000,
        isActive: true,
      },
    }),
    prisma.addon.create({
      data: {
        name: 'Fuel Pre-pay',
        description: 'Pre-pay for full tank of fuel',
        pricePerBooking: 200000,
        isActive: true,
      },
    }),
    prisma.addon.create({
      data: {
        name: 'Phone Holder',
        description: 'Magnetic phone mount for dashboard',
        pricePerBooking: 25000,
        isActive: true,
      },
    }),
    prisma.addon.create({
      data: {
        name: 'Dash Camera',
        description: 'Front and rear dash camera recording',
        pricePerBooking: 100000,
        isActive: true,
      },
    }),
    prisma.addon.create({
      data: {
        name: 'Toll Pass',
        description: 'E-toll card with Rp 200,000 balance',
        pricePerBooking: 220000,
        isActive: true,
      },
    }),
    prisma.addon.create({
      data: {
        name: 'Baby Stroller',
        description: 'Compact foldable baby stroller',
        pricePerBooking: 60000,
        isActive: true,
      },
    }),
  ]);
  console.log(`✅ Created ${addons.length} add-ons`);

  // ============================================
  // 5. Create Cars (30 cars - diverse fleet)
  // ============================================
  console.log('🚗 Creating cars...');
  const carData = [
    // SUVs (8 cars)
    { brand: 'Toyota', model: 'Fortuner', year: 2023, type: CarType.SUV, seats: 7, transmission: Transmission.AT, fuel: FuelType.DIESEL, dailyPrice: 850000, status: CarStatus.ACTIVE, images: ['fortuner-1.jpg', 'fortuner-2.jpg'] },
    { brand: 'Honda', model: 'CR-V', year: 2023, type: CarType.SUV, seats: 5, transmission: Transmission.AT, fuel: FuelType.GAS, dailyPrice: 750000, status: CarStatus.ACTIVE, images: ['crv-1.jpg', 'crv-2.jpg'] },
    { brand: 'Mitsubishi', model: 'Pajero Sport', year: 2022, type: CarType.SUV, seats: 7, transmission: Transmission.AT, fuel: FuelType.DIESEL, dailyPrice: 800000, status: CarStatus.ACTIVE, images: ['pajero-1.jpg'] },
    { brand: 'Mazda', model: 'CX-5', year: 2023, type: CarType.SUV, seats: 5, transmission: Transmission.AT, fuel: FuelType.GAS, dailyPrice: 700000, status: CarStatus.ACTIVE, images: ['cx5-1.jpg'] },
    { brand: 'Hyundai', model: 'Santa Fe', year: 2022, type: CarType.SUV, seats: 7, transmission: Transmission.AT, fuel: FuelType.DIESEL, dailyPrice: 780000, status: CarStatus.ACTIVE, images: ['santafe-1.jpg'] },
    { brand: 'Nissan', model: 'X-Trail', year: 2023, type: CarType.SUV, seats: 5, transmission: Transmission.AT, fuel: FuelType.GAS, dailyPrice: 680000, status: CarStatus.ACTIVE, images: ['xtrail-1.jpg'] },
    { brand: 'Toyota', model: 'Rush', year: 2022, type: CarType.SUV, seats: 7, transmission: Transmission.AT, fuel: FuelType.GAS, dailyPrice: 550000, status: CarStatus.ACTIVE, images: ['rush-1.jpg'] },
    { brand: 'Daihatsu', model: 'Terios', year: 2021, type: CarType.SUV, seats: 7, transmission: Transmission.MT, fuel: FuelType.GAS, dailyPrice: 450000, status: CarStatus.ACTIVE, images: ['terios-1.jpg'] },

    // Sedans (8 cars)
    { brand: 'Toyota', model: 'Camry', year: 2023, type: CarType.SEDAN, seats: 5, transmission: Transmission.AT, fuel: FuelType.GAS, dailyPrice: 750000, status: CarStatus.ACTIVE, images: ['camry-1.jpg'] },
    { brand: 'Honda', model: 'Accord', year: 2022, type: CarType.SEDAN, seats: 5, transmission: Transmission.AT, fuel: FuelType.GAS, dailyPrice: 720000, status: CarStatus.ACTIVE, images: ['accord-1.jpg'] },
    { brand: 'Mercedes-Benz', model: 'C-Class', year: 2023, type: CarType.SEDAN, seats: 5, transmission: Transmission.AT, fuel: FuelType.GAS, dailyPrice: 1200000, status: CarStatus.ACTIVE, images: ['cclass-1.jpg'] },
    { brand: 'BMW', model: '3 Series', year: 2022, type: CarType.SEDAN, seats: 5, transmission: Transmission.AT, fuel: FuelType.GAS, dailyPrice: 1150000, status: CarStatus.ACTIVE, images: ['bmw3-1.jpg'] },
    { brand: 'Toyota', model: 'Corolla Altis', year: 2023, type: CarType.SEDAN, seats: 5, transmission: Transmission.AT, fuel: FuelType.GAS, dailyPrice: 550000, status: CarStatus.ACTIVE, images: ['altis-1.jpg'] },
    { brand: 'Honda', model: 'Civic', year: 2022, type: CarType.SEDAN, seats: 5, transmission: Transmission.AT, fuel: FuelType.GAS, dailyPrice: 580000, status: CarStatus.ACTIVE, images: ['civic-1.jpg'] },
    { brand: 'Mazda', model: 'Mazda3', year: 2023, type: CarType.SEDAN, seats: 5, transmission: Transmission.AT, fuel: FuelType.GAS, dailyPrice: 520000, status: CarStatus.ACTIVE, images: ['mazda3-1.jpg'] },
    { brand: 'Hyundai', model: 'Elantra', year: 2021, type: CarType.SEDAN, seats: 5, transmission: Transmission.AT, fuel: FuelType.GAS, dailyPrice: 480000, status: CarStatus.ACTIVE, images: ['elantra-1.jpg'] },

    // Hatchbacks (6 cars)
    { brand: 'Toyota', model: 'Yaris', year: 2023, type: CarType.HATCHBACK, seats: 5, transmission: Transmission.AT, fuel: FuelType.GAS, dailyPrice: 400000, status: CarStatus.ACTIVE, images: ['yaris-1.jpg'] },
    { brand: 'Honda', model: 'Jazz', year: 2022, type: CarType.HATCHBACK, seats: 5, transmission: Transmission.AT, fuel: FuelType.GAS, dailyPrice: 420000, status: CarStatus.ACTIVE, images: ['jazz-1.jpg'] },
    { brand: 'Suzuki', model: 'Swift', year: 2023, type: CarType.HATCHBACK, seats: 5, transmission: Transmission.MT, fuel: FuelType.GAS, dailyPrice: 350000, status: CarStatus.ACTIVE, images: ['swift-1.jpg'] },
    { brand: 'Mazda', model: 'Mazda2', year: 2022, type: CarType.HATCHBACK, seats: 5, transmission: Transmission.AT, fuel: FuelType.GAS, dailyPrice: 390000, status: CarStatus.ACTIVE, images: ['mazda2-1.jpg'] },
    { brand: 'Hyundai', model: 'i20', year: 2021, type: CarType.HATCHBACK, seats: 5, transmission: Transmission.AT, fuel: FuelType.GAS, dailyPrice: 360000, status: CarStatus.ACTIVE, images: ['i20-1.jpg'] },
    { brand: 'Toyota', model: 'Agya', year: 2022, type: CarType.HATCHBACK, seats: 5, transmission: Transmission.MT, fuel: FuelType.GAS, dailyPrice: 280000, status: CarStatus.ACTIVE, images: ['agya-1.jpg'] },

    // MPVs (5 cars)
    { brand: 'Toyota', model: 'Innova Reborn', year: 2023, type: CarType.MPV, seats: 7, transmission: Transmission.AT, fuel: FuelType.DIESEL, dailyPrice: 650000, status: CarStatus.ACTIVE, images: ['innova-1.jpg'] },
    { brand: 'Honda', model: 'Mobilio', year: 2022, type: CarType.MPV, seats: 7, transmission: Transmission.MT, fuel: FuelType.GAS, dailyPrice: 450000, status: CarStatus.ACTIVE, images: ['mobilio-1.jpg'] },
    { brand: 'Suzuki', model: 'Ertiga', year: 2023, type: CarType.MPV, seats: 7, transmission: Transmission.AT, fuel: FuelType.GAS, dailyPrice: 480000, status: CarStatus.ACTIVE, images: ['ertiga-1.jpg'] },
    { brand: 'Mitsubishi', model: 'Xpander', year: 2022, type: CarType.MPV, seats: 7, transmission: Transmission.AT, fuel: FuelType.GAS, dailyPrice: 520000, status: CarStatus.ACTIVE, images: ['xpander-1.jpg'] },
    { brand: 'Wuling', model: 'Cortez', year: 2021, type: CarType.MPV, seats: 7, transmission: Transmission.MT, fuel: FuelType.GAS, dailyPrice: 420000, status: CarStatus.ACTIVE, images: ['cortez-1.jpg'] },

    // Vans (3 cars)
    { brand: 'Toyota', model: 'Hiace', year: 2023, type: CarType.VAN, seats: 14, transmission: Transmission.MT, fuel: FuelType.DIESEL, dailyPrice: 950000, status: CarStatus.ACTIVE, images: ['hiace-1.jpg'] },
    { brand: 'Isuzu', model: 'Elf', year: 2022, type: CarType.VAN, seats: 16, transmission: Transmission.MT, fuel: FuelType.DIESEL, dailyPrice: 1000000, status: CarStatus.ACTIVE, images: ['elf-1.jpg'] },
    { brand: 'Nissan', model: 'Urvan', year: 2021, type: CarType.VAN, seats: 15, transmission: Transmission.MT, fuel: FuelType.DIESEL, dailyPrice: 900000, status: CarStatus.ACTIVE, images: ['urvan-1.jpg'] },
  ];

  const cars = await Promise.all(
    carData.map((car) => prisma.car.create({ data: car }))
  );
  console.log(`✅ Created ${cars.length} cars`);

  // ============================================
  // 6. Create Bookings (45 bookings with variety)
  // ============================================
  console.log('📅 Creating bookings...');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const bookingData = [];

  // Helper function to create date
  const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  // Past completed bookings (20 bookings)
  for (let i = 0; i < 20; i++) {
    const startOffset = -60 + i * 2; // Spread over past 60 days
    const duration = Math.floor(Math.random() * 5) + 2; // 2-6 days
    const startDate = addDays(today, startOffset);
    const endDate = addDays(startDate, duration);
    const customerIndex = i % customers.length;
    const carIndex = i % cars.length;
    const locationIndex = i % locations.length;
    const dropoffLocationIndex = (i + 1) % locations.length;

    const basePrice = Number(cars[carIndex].dailyPrice) * duration;
    const addonPrice = Math.random() > 0.5 ? 150000 : 0; // 50% chance of addons

    bookingData.push({
      userId: customers[customerIndex].id,
      carId: cars[carIndex].id,
      pickupLocationId: locations[locationIndex].id,
      dropoffLocationId: locations[dropoffLocationIndex].id,
      startDate,
      endDate,
      days: duration,
      basePrice,
      addonPrice,
      totalPrice: basePrice + addonPrice,
      status: BookingStatus.RETURNED,
    });
  }

  // Current active bookings (10 bookings)
  for (let i = 0; i < 10; i++) {
    const startOffset = -3 + i; // Some started in past, some today
    const duration = Math.floor(Math.random() * 4) + 3; // 3-6 days
    const startDate = addDays(today, startOffset);
    const endDate = addDays(startDate, duration);
    const customerIndex = i % customers.length;
    const carIndex = (i + 20) % cars.length;
    const locationIndex = i % locations.length;
    const dropoffLocationIndex = (i + 2) % locations.length;

    const basePrice = Number(cars[carIndex].dailyPrice) * duration;
    const addonPrice = Math.random() > 0.3 ? 200000 : 0; // 70% chance of addons

    bookingData.push({
      userId: customers[customerIndex].id,
      carId: cars[carIndex].id,
      pickupLocationId: locations[locationIndex].id,
      dropoffLocationId: locations[dropoffLocationIndex].id,
      startDate,
      endDate,
      days: duration,
      basePrice,
      addonPrice,
      totalPrice: basePrice + addonPrice,
      status: startDate <= today ? BookingStatus.PICKED_UP : BookingStatus.CONFIRMED,
    });
  }

  // Future confirmed bookings (10 bookings)
  for (let i = 0; i < 10; i++) {
    const startOffset = 5 + i * 3; // Future bookings
    const duration = Math.floor(Math.random() * 6) + 2; // 2-7 days
    const startDate = addDays(today, startOffset);
    const endDate = addDays(startDate, duration);
    const customerIndex = i % customers.length;
    const carIndex = (i + 10) % cars.length;
    const locationIndex = i % locations.length;
    const dropoffLocationIndex = (i + 3) % locations.length;

    const basePrice = Number(cars[carIndex].dailyPrice) * duration;
    const addonPrice = Math.random() > 0.4 ? 180000 : 0; // 60% chance of addons

    bookingData.push({
      userId: customers[customerIndex].id,
      carId: cars[carIndex].id,
      pickupLocationId: locations[locationIndex].id,
      dropoffLocationId: locations[dropoffLocationIndex].id,
      startDate,
      endDate,
      days: duration,
      basePrice,
      addonPrice,
      totalPrice: basePrice + addonPrice,
      status: BookingStatus.CONFIRMED,
    });
  }

  // Cancelled bookings (3 bookings)
  for (let i = 0; i < 3; i++) {
    const startOffset = 10 + i * 5;
    const duration = 4;
    const startDate = addDays(today, startOffset);
    const endDate = addDays(startDate, duration);
    const customerIndex = i % customers.length;
    const carIndex = i % cars.length;

    const basePrice = Number(cars[carIndex].dailyPrice) * duration;

    bookingData.push({
      userId: customers[customerIndex].id,
      carId: cars[carIndex].id,
      pickupLocationId: locations[0].id,
      dropoffLocationId: locations[1].id,
      startDate,
      endDate,
      days: duration,
      basePrice,
      addonPrice: 0,
      totalPrice: basePrice,
      status: BookingStatus.CANCELLED,
      cancelReason: ['Customer changed plans', 'Found alternative', 'Travel postponed'][i],
    });
  }

  // Pending bookings (2 bookings)
  for (let i = 0; i < 2; i++) {
    const startOffset = 2 + i;
    const duration = 3;
    const startDate = addDays(today, startOffset);
    const endDate = addDays(startDate, duration);
    const customerIndex = i % customers.length;
    const carIndex = (i + 5) % cars.length;

    const basePrice = Number(cars[carIndex].dailyPrice) * duration;

    bookingData.push({
      userId: customers[customerIndex].id,
      carId: cars[carIndex].id,
      pickupLocationId: locations[i].id,
      dropoffLocationId: locations[i + 1].id,
      startDate,
      endDate,
      days: duration,
      basePrice,
      addonPrice: 100000,
      totalPrice: basePrice + 100000,
      status: BookingStatus.PENDING,
    });
  }

  const bookings = await Promise.all(
    bookingData.map((booking) => prisma.booking.create({ data: booking }))
  );
  console.log(`✅ Created ${bookings.length} bookings (20 returned, 10 active, 10 future, 3 cancelled, 2 pending)`);

  // ============================================
  // 7. Create Booking Add-ons (for bookings with addonPrice > 0)
  // ============================================
  console.log('🎁 Creating booking add-ons...');
  const bookingAddonsData = [];

  for (const booking of bookings) {
    if (Number(booking.addonPrice) > 0) {
      // Randomly add 1-3 addons per booking
      const numAddons = Math.floor(Math.random() * 3) + 1;
      const selectedAddonIndices = new Set<number>();

      while (selectedAddonIndices.size < numAddons) {
        selectedAddonIndices.add(Math.floor(Math.random() * addons.length));
      }

      for (const addonIndex of selectedAddonIndices) {
        bookingAddonsData.push({
          bookingId: booking.id,
          addonId: addons[addonIndex].id,
          price: addons[addonIndex].pricePerBooking,
        });
      }
    }
  }

  await Promise.all(
    bookingAddonsData.map((ba) => prisma.bookingAddon.create({ data: ba }))
  );
  console.log(`✅ Created ${bookingAddonsData.length} booking add-ons`);

  // ============================================
  // 8. Create Audit Logs (sample activities)
  // ============================================
  console.log('📝 Creating audit logs...');
  const auditLogs = [];

  // Log car creations by admin1
  for (let i = 0; i < 5; i++) {
    auditLogs.push({
      actorId: admin1.id,
      entityType: 'Car',
      entityId: cars[i].id,
      action: 'CREATE',
      beforeJson: null,
      afterJson: { brand: cars[i].brand, model: cars[i].model, status: cars[i].status },
    });
  }

  // Log booking status changes
  for (let i = 0; i < 10; i++) {
    auditLogs.push({
      actorId: admin2.id,
      entityType: 'Booking',
      entityId: bookings[i].id,
      action: 'UPDATE',
      beforeJson: { status: 'CONFIRMED' },
      afterJson: { status: bookings[i].status },
    });
  }

  await Promise.all(
    auditLogs.map((log) => prisma.auditLog.create({ data: log }))
  );
  console.log(`✅ Created ${auditLogs.length} audit log entries`);

  // ============================================
  // Summary
  // ============================================
  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - Users: ${customers.length + 2} (2 admins, ${customers.length} customers)`);
  console.log(`   - Locations: ${locations.length}`);
  console.log(`   - Add-ons: ${addons.length}`);
  console.log(`   - Cars: ${cars.length} (8 SUVs, 8 Sedans, 6 Hatchbacks, 5 MPVs, 3 Vans)`);
  console.log(`   - Bookings: ${bookings.length} (20 returned, 10 active, 10 future, 3 cancelled, 2 pending)`);
  console.log(`   - Booking Add-ons: ${bookingAddonsData.length}`);
  console.log(`   - Audit Logs: ${auditLogs.length}`);
  console.log('\n🔐 Test Credentials:');
  console.log('   Admin: admin@carrental.com / password123');
  console.log('   Support: support@carrental.com / password123');
  console.log('   Customer: john.doe@example.com / password123');
  console.log('   (All users have the same password: password123)\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
