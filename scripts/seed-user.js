import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

const MAX_PASSWORD_LENGTH = 128
const SALT_ROUNDS = 10

export function saltAndHashPassword(password) {
  if (!password || typeof password !== "string") {
    throw new Error("كلمة المرور غير صالحة")
  }

  if (password.length < 8) {
    throw new Error("يجب أن تكون كلمة المرور 8 أحرف على الأقل")
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    throw new Error(`يجب ألا تزيد كلمة المرور عن ${MAX_PASSWORD_LENGTH} حرفًا`)
  }

  const commonPasswords = ["12345678", "password", "qwertyui", "11111111", "admin123"]
  if (commonPasswords.includes(password.toLowerCase())) {
    throw new Error("كلمة المرور ضعيفة جدًا")
  }

  try {
    const salt = bcrypt.genSaltSync(SALT_ROUNDS)
    return bcrypt.hashSync(password, salt)
  } catch (error) {
    console.error("Password hashing error:", error)
    throw new Error("فشل في تشفير كلمة المرور")
  }
}

async function main() {
  console.log("🌱 بدء إنشاء المستخدمين...")

  // Create Admin User
  const adminPassword = saltAndHashPassword("Admin@123")
  const admin = await prisma.user.upsert({
    where: { email: "admin@ditalogs.com" },
    update: {},
    create: {
      name: "مدير النظام",
      email: "admin@ditalogs.com",
      phone: "+212600000001",
      password: adminPassword,
      role: "ADMIN",
      admin: {
        create: {},
      },
    },
  })
  console.log("✅ تم إنشاء المدير:", admin.email)

  // Create Merchant User
  const merchantPassword = saltAndHashPassword("Merchant@123")
  const merchant = await prisma.user.upsert({
    where: { email: "merchant@ditalogs.com" },
    update: {},
    create: {
      name: "محمد التاجر",
      email: "merchant@ditalogs.com",
      phone: "+212600000002",
      password: merchantPassword,
      role: "MERCHANT",
      merchant: {
        create: {
          companyName: "شركة التجارة الإلكترونية",
          rib: "123456789012345678901234",
          bankName: "البنك الشعبي",
          balance: 0,
          totalEarned: 0,
        },
      },
    },
  })
  console.log("✅ تم إنشاء التاجر:", merchant.email)

  // Create Delivery Person User
  const deliveryPassword = saltAndHashPassword("Delivery@123")
  const deliveryPerson = await prisma.user.upsert({
    where: { email: "delivery@ditalogs.com" },
    update: {},
    create: {
      name: "أحمد المسلم",
      email: "delivery@ditalogs.com",
      phone: "+212600000003",
      password: deliveryPassword,
      role: "DELIVERYMAN",
      deliveryMan: {
        create: {
          vehicleType: "دراجة نارية",
          active: true,
          totalDeliveries: 0,
          successfulDeliveries: 0,
          totalEarned: 0,
        },
      },
    },
  })
  console.log("✅ تم إنشاء عامل التوصيل:", deliveryPerson.email)

  console.log("\n📋 معلومات تسجيل الدخول:")
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log("\n👨‍💼 المدير (Admin):")
  console.log("   البريد الإلكتروني: admin@ditalogs.com")
  console.log("   كلمة المرور: Admin@123")
  console.log("\n🏪 التاجر (Merchant):")
  console.log("   البريد الإلكتروني: merchant@ditalogs.com")
  console.log("   كلمة المرور: Merchant@123")
  console.log("\n🚚 عامل التوصيل (Delivery Person):")
  console.log("   البريد الإلكتروني: delivery@ditalogs.com")
  console.log("   كلمة المرور: Delivery@123")
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log("\n✨ تم إنشاء جميع المستخدمين بنجاح!")
}

main()
  .catch((e) => {
    console.error("❌ خطأ في إنشاء المستخدمين:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
