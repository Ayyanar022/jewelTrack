const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const plans = [
  {
    name: 'BASIC',
    price: 29900,
    max_users: 1,
    max_invoices_per_month: 100,
    max_branches: 1,
    features: {
      billing: true,
      gst_reports: true,
      custom_branding: true,
      inventory: false,
      gold_loans: false,
      gold_schemes: false,
      dealer_approval: false,
    },
    note: 'Essential GST billing and daily gold rates for single-counter jewellery stores',
    is_active: true,
  },
  {
    name: 'PRO',
    price: 69900,
    max_users: 3,
    max_invoices_per_month: 500,
    max_branches: 1,
    features: {
      billing: true,
      gst_reports: true,
      custom_branding: true,
      inventory: true,
      gold_loans: true,
      gold_schemes: true,
      dealer_approval: false,
    },
    note: 'Advanced management with Inventory, Jewel Loans, and Gold Schemes for growing stores',
    is_active: true,
  },
  {
    name: 'ENTERPRISE',
    price: 89900,
    max_users: 10,
    max_invoices_per_month: null,
    max_branches: 1,
    features: {
      billing: true,
      gst_reports: true,
      custom_branding: true,
      inventory: true,
      gold_loans: true,
      gold_schemes: true,
      dealer_approval: true,
    },
    note: 'Complete Jewellery ERP suite with Dealer Consignment (Jangat) & Unlimited Billing',
    is_active: true,
  },
];

async function main() {
  console.log('Seeding plans into database...');
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
  console.log('✓ All subscription plans successfully seeded/updated!');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
