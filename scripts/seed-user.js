import { PrismaClient, Role } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("[v0] Starting database seeding...")

  const Admin_Hashed_Password = await bcrypt.hash("Admin@123", 10)
  const Merchant_Hashed_Password = await bcrypt.hash("Merchant@123", 10)
  const Delivery_Hashed_Password = await bcrypt.hash("Delivery@123", 10)
  

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@sonic-delivery.com" },
    update: {},
    create: {
      email: "admin@sonic-delivery.com",
      name: "مدير النظام",
      password: Admin_Hashed_Password,
      phone: "+212600000001",
      role: Role.ADMIN,
      image: null,
    },
  })

  const admin = await prisma.admin.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
    },
  })

  console.log("[v0] Created admin user:", adminUser.email)

  const merchantDakhla = await prisma.user.upsert({
    where: { email: "merchant.dakhla@sonic-delivery.com" },
    update: {},
    create: {
      email: "merchant.dakhla@sonic-delivery.com",
      name: "محمد التاجر",
      password: Merchant_Hashed_Password,
      phone: "+212600000002",
      role: Role.MERCHANT,
      image: null,
    },
  })

  const merchantDataDakhla = await prisma.merchant.upsert({
    where: { userId: merchantDakhla.id },
    update: {},
    create: {
      userId: merchantDakhla.id,
      companyName: "متجر الداخلة",
      rib: "1234567890123456789012",
      bankName: "البنك الشعبي",
      balance: 0,
    },
  })

  const merchantBoujdour = await prisma.user.upsert({
    where: { email: "merchant.boujdour@sonic-delivery.com" },
    update: {},
    create: {
      email: "merchant.boujdour@sonic-delivery.com",
      name: "أحمد البوجدوري",
      password: Merchant_Hashed_Password,
      phone: "+212600000003",
      role: Role.MERCHANT,
      image: null,
    },
  })

  const merchantDataBoujdour = await prisma.merchant.upsert({
    where: { userId: merchantBoujdour.id },
    update: {},
    create: {
      userId: merchantBoujdour.id,
      companyName: "متجر بوجدور",
      rib: "2234567890123456789012",
      bankName: "بنك المغرب",
      balance: 0,
    },
  })

  const merchantLaayoune = await prisma.user.upsert({
    where: { email: "merchant.laayoune@sonic-delivery.com" },
    update: {},
    create: {
      email: "merchant.laayoune@sonic-delivery.com",
      name: "عبد الله العيوني",
      password: Merchant_Hashed_Password,
      phone: "+212600000004",
      role: Role.MERCHANT,
      image: null,
    },
  })

  const merchantDataLaayoune = await prisma.merchant.upsert({
    where: { userId: merchantLaayoune.id },
    update: {},
    create: {
      userId: merchantLaayoune.id,
      companyName: "متجر العيون",
      rib: "3234567890123456789012",
      bankName: "التجاري وفا بنك",
      balance: 0,
    },
  })

  console.log("[v0] Created merchant users for all 3 cities")

  const deliveryDakhla = await prisma.user.upsert({
    where: { email: "delivery.dakhla@sonic-delivery.com" },
    update: {},
    create: {
      email: "delivery.dakhla@sonic-delivery.com",
      name: "يوسف السائق",
      password: Delivery_Hashed_Password,
      phone: "+212600000005",
      role: Role.DELIVERYMAN,
      image: null,
    },
  })

  const deliveryManDakhla = await prisma.deliveryMan.upsert({
    where: { userId: deliveryDakhla.id },
    update: {},
    create: {
      userId: deliveryDakhla.id,
      city: "الداخلة", // Added city field for Dakhla
      vehicleType: "دراجة نارية",
      active: true,
      totalEarned: 0,
    },
  })

  const deliveryBoujdour = await prisma.user.upsert({
    where: { email: "delivery.boujdour@sonic-delivery.com" },
    update: {},
    create: {
      email: "delivery.boujdour@sonic-delivery.com",
      name: "إبراهيم الموزع",
      password: Delivery_Hashed_Password,
      phone: "+212600000006",
      role: Role.DELIVERYMAN,
      image: null,
    },
  })

  const deliveryManBoujdour = await prisma.deliveryMan.upsert({
    where: { userId: deliveryBoujdour.id },
    update: {},
    create: {
      userId: deliveryBoujdour.id,
      city: "بوجدور", // Added city field for Boujdour
      vehicleType: "سيارة",
      active: true,
      totalEarned: 0,
    },
  })

  const deliveryLaayoune = await prisma.user.upsert({
    where: { email: "delivery.laayoune@sonic-delivery.com" },
    update: {},
    create: {
      email: "delivery.laayoune@sonic-delivery.com",
      name: "حسن المرسال",
      password: Delivery_Hashed_Password,
      phone: "+212600000007",
      role: Role.DELIVERYMAN,
      image: null,
    },
  })

  const deliveryManLaayoune = await prisma.deliveryMan.upsert({
    where: { userId: deliveryLaayoune.id },
    update: {},
    create: {
      userId: deliveryLaayoune.id,
      city: "العيون", // Added city field for Laayoune
      vehicleType: "دراجة نارية",
      active: true,
      totalEarned: 0,
    },
  })

  console.log("[v0] Created delivery men users for all 3 cities with city assignments")

  const product1 = await prisma.product.create({
    data: {
      name: "منتج تجريبي 1",
      description: "وصف المنتج التجريبي",
      price: 150.00,
      stockQuantity: 50,
      merchantId: merchantDataDakhla.id,
      isActive: true,
      image: null,
    },
  })

  const product2 = await prisma.product.create({
    data: {
      name: "منتج تجريبي 2",
      description: "وصف المنتج التجريبي",
      price: 200.00,
      stockQuantity: 30,
      merchantId: merchantDataBoujdour.id,
      isActive: true,
      image: null,
    },
  })

  console.log("[v0] Created sample products")

  console.log("[v0] ✅ Database seeding completed successfully!")
  console.log("[v0] Test credentials (all passwords: password123):")
  console.log("[v0]   Admin: admin@sonic-delivery.com")
  console.log("[v0]   Merchant Dakhla: merchant.dakhla@sonic-delivery.com")
  console.log("[v0]   Merchant Boujdour: merchant.boujdour@sonic-delivery.com")
  console.log("[v0]   Merchant Laayoune: merchant.laayoune@sonic-delivery.com")
  console.log("[v0]   Delivery Dakhla: delivery.dakhla@sonic-delivery.com")
  console.log("[v0]   Delivery Boujdour: delivery.boujdour@sonic-delivery.com")
  console.log("[v0]   Delivery Laayoune: delivery.laayoune@sonic-delivery.com")
}

main()
  .catch((e) => {
    console.error("[v0] ❌ Error during seeding:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
