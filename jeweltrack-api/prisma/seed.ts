import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create Default Plans
  const plans = [
    {
      name: 'BASIC',
      price: 99900, // Rs. 999/month (in paise)
      max_users: 1,
      max_invoices_per_month: 100,
      max_branches: 1,
      features: {
        billing: true,
        gst_reports: true,
        inventory: false,
        gold_loans: false,
        multi_branch: false,
      },
      note: 'Ideal for small jewellery shops starting digital billing',
      is_active: true,
    },
    {
      name: 'PRO',
      price: 199900, // Rs. 1999/month (in paise)
      max_users: 3,
      max_invoices_per_month: 500,
      max_branches: 1,
      features: {
        billing: true,
        gst_reports: true,
        inventory: true,
        gold_loans: true,
        multi_branch: false,
      },
      note: 'Best for growing jewellery stores with staff and inventory needs',
      is_active: true,
    },
    {
      name: 'ENTERPRISE',
      price: 399900, // Rs. 3999/month (in paise)
      max_users: 10,
      max_invoices_per_month: null, // unlimited
      max_branches: 3,
      features: {
        billing: true,
        gst_reports: true,
        inventory: true,
        gold_loans: true,
        multi_branch: true,
      },
      note: 'Complete suite for multi-counter & multi-branch jewellery businesses',
      is_active: true,
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { name: plan.name },
      update: {
        price: plan.price,
        max_users: plan.max_users,
        max_invoices_per_month: plan.max_invoices_per_month,
        max_branches: plan.max_branches,
        features: plan.features,
        note: plan.note,
        is_active: plan.is_active,
      },
      create: plan,
    });
  }
  console.log('✓ Default plans seeded');

  // 2. Create Super Admin User
  const adminPhone = '9999999999';
  const adminPassword = await bcrypt.hash('AdminPassword123', 10);

  const superAdmin = await prisma.user.upsert({
    where: { phone: adminPhone },
    update: {
      role: Role.SUPER_ADMIN,
    },
    create: {
      name: 'Super Admin',
      phone: adminPhone,
      email: 'admin@jeweltrack.com',
      password: adminPassword,
      role: Role.SUPER_ADMIN,
      is_active: true,
    },
  });
  console.log(`✓ Super Admin created (${superAdmin.phone} / AdminPassword123)`);

  // 3. For any existing Shop without a User, create a default SHOP_OWNER user
  const shops = await prisma.shop.findMany({
    include: { users: true },
  });

  for (const shop of shops) {
    if (shop.users.length === 0) {
      const defaultPhone = `9${Math.floor(100000000 + Math.random() * 900000000)}`;
      const defaultPassword = await bcrypt.hash('ShopOwner123', 10);
      await prisma.user.create({
        data: {
          shop_id: shop.id,
          name: `${shop.name} Owner`,
          phone: defaultPhone,
          password: defaultPassword,
          role: Role.SHOP_OWNER,
        },
      });
      console.log(`✓ Created owner user for shop: ${shop.name}`);
    }
  }

  console.log('Database seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
