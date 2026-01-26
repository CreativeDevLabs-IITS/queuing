import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('Checking database for users...\n');

    // Check admins
    const admins = await prisma.admin.findMany();
    console.log(`Admins found: ${admins.length}`);
    admins.forEach(admin => {
      console.log(`  - ${admin.username} (ID: ${admin.id})`);
    });

    // Check staff
    const staff = await prisma.staff.findMany();
    console.log(`\nStaff found: ${staff.length}`);
    staff.forEach(s => {
      console.log(`  - ${s.username} (${s.name}) - Active: ${s.isActive}`);
    });

    if (admins.length === 0 && staff.length === 0) {
      console.log('\n⚠️  No users found! You need to run the seed script:');
      console.log('   npm run seed');
    } else if (admins.length === 0) {
      console.log('\n⚠️  No admin accounts found! Run: npm run seed');
    } else if (staff.length === 0) {
      console.log('\n⚠️  No staff accounts found! Run: npm run seed');
    } else {
      console.log('\n✅ Users found in database');
    }
  } catch (error) {
    console.error('Error checking users:', error);
    console.error('\nThis might mean:');
    console.error('1. Database is not set up - run: npx prisma migrate dev');
    console.error('2. Prisma client not generated - run: npx prisma generate');
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
