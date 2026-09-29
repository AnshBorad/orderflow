/**
 * OrderFlow seed — safe to run MULTIPLE times.
 * Uses upsert (insert if missing, update if exists) so re-running
 * never creates duplicates = IDEMPOTENT. Same idea you'll later
 * apply to payment webhooks (same event twice? process once).
 *
 * Run:  npm run db:seed
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Dev-only password for ALL seeded users. NEVER do this in production seeds.
const DEV_PASSWORD = 'Password123!';

async function seedUsers() {
    const passwordHash = await bcrypt.hash(DEV_PASSWORD, 10);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@orderflow.dev' },
        update: {}, // already exists? touch nothing
        create: {
            email: 'admin@orderflow.dev',
            name: 'OrderFlow Admin',
            passwordHash,
            role: 'ADMIN',
        },
    });

    const customer = await prisma.user.upsert({
        where: { email: 'customer@orderflow.dev' },
        update: {},
        create: {
            email: 'customer@orderflow.dev',
            name: 'Test Customer',
            passwordHash,
            role: 'CUSTOMER',
        },
    });

    const customer2 = await prisma.user.upsert({
        where: { email: 'customer2@orderflow.dev' },
        update: {},
        create: {
            email: 'customer2@orderflow.dev',
            name: 'Second Customer (for race-condition testing)',
            passwordHash,
            role: 'CUSTOMER',
        },
    });

    console.log(`✅ users: ${admin.email}, ${customer.email}, ${customer2.email}`);
    return { admin, customer, customer2 };
}

async function seedProducts() {
    // NOTE: priceCents is INTEGER PAISE. ₹499.00 = 49900. Never floats.
    // stock: 1 on the last product — deliberately! You'll use it in Week 2
    // to prove optimistic locking: two users buy it, only one wins.
    const products = [
        { name: 'Mechanical Keyboard', description: 'Hot-swappable, 65%, brown switches', priceCents: 349900, stock: 15 },
        { name: 'USB-C Hub 7-in-1', description: 'HDMI 4K, 100W PD, SD reader', priceCents: 249900, stock: 30 },
        { name: 'Noise-Cancelling Headphones', description: 'Over-ear, 40h battery', priceCents: 799900, stock: 8 },
        { name: 'SSD 1TB NVMe', description: 'Gen4, 7000MB/s read', priceCents: 649900, stock: 25 },
        { name: 'Webcam 1080p', description: 'Autofocus, privacy shutter', priceCents: 199900, stock: 40 },
        { name: 'Limited Edition Deskmat', description: 'Rare — only ONE in stock (for stock-race testing)', priceCents: 99900, stock: 1 },
    ];

    for (const p of products) {
        await prisma.product.upsert({
            where: { id: `seed-${p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` },
            update: {}, // keep existing stock/price — don't reset if you've been testing
            create: {
                id: `seed-${p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
                ...p,
            },
        });
    }

    console.log(`✅ products: ${products.length} seeded (last one has stock = 1 on purpose)`);
}

async function main() {
    console.log('🌱 Seeding OrderFlow...');
    await seedUsers();
    await seedProducts();
    console.log('\n📋 Dev login (all seeded users):');
    console.log(`   email:    customer@orderflow.dev`);
    console.log(`   password: ${DEV_PASSWORD}`);
    console.log('\nDone. Re-running this script is always safe (idempotent upserts).');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
