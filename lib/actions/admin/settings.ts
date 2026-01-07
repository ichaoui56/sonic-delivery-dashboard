"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs" // Import bcrypt for password verification

export async function getAdminSettings() {
    try {
        const session = await auth()

        if (!session?.user || session.user.role !== "ADMIN") {
            return { success: false, error: "غير مصرح" }
        }

        const userId = Number.parseInt(session.user.id)

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                admin: true,
            },
        })

        if (!user || !user.admin) {
            return { success: false, error: "المستخدم غير موجود" }
        }

        return {
            success: true,
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    image: user.image,
                },
                admin: {
                    id: user.admin.id,
                    address: user.admin.address,
                },
            },
        }
    } catch (error) {
        console.error("[v0] Error fetching admin settings:", error)
        return { success: false, error: "حدث خطأ أثناء جلب البيانات" }
    }
}

// Combined update function for both user and admin
export async function updateAdminSettings(data: {
  name: string
  email: string // Added email
  phone: string | null
  profileImage: string | null
  address: string | null
  currentPassword?: string // For email verification
}) {
  try {
    const session = await auth()

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      throw new Error('غير مصرح')
    }

    const userId = Number.parseInt(session.user.id)

    // Get current user to verify password if email is changing
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, password: true }
    })

    if (!currentUser) {
      throw new Error('المستخدم غير موجود')
    }

    // Check if email is being changed
    const isEmailChanging = data.email !== currentUser.email
    
    if (isEmailChanging) {
      // Require password verification for email changes
      if (!data.currentPassword) {
        throw new Error('الرجاء إدخال كلمة المرور الحالية لتغيير البريد الإلكتروني')
      }
      
      // Verify current password
      const isPasswordValid = await bcrypt.compare(data.currentPassword, currentUser.password)
      if (!isPasswordValid) {
        throw new Error('كلمة المرور الحالية غير صحيحة')
      }
    }

    // Check if new email already exists (only if changing)
    if (isEmailChanging) {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
        select: { id: true }
      })
      
      if (existingUser && existingUser.id !== userId) {
        throw new Error('البريد الإلكتروني مستخدم بالفعل')
      }
    }

    // Update both user and admin in a transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          name: data.name,
          email: data.email, // Update email
          phone: data.phone,
          image: data.profileImage,
        },
      }),
      prisma.admin.update({
        where: { userId: userId },
        data: {
          address: data.address,
        },
      }),
    ])

    return { 
      success: true,
      message: isEmailChanging 
        ? 'تم تحديث البيانات بنجاح. يرجى تسجيل الدخول مرة أخرى باستخدام البريد الإلكتروني الجديد.' 
        : 'تم تحديث البيانات بنجاح'
    }
  } catch (error: any) {
    console.error('[v0] Error updating admin settings:', error)
    throw new Error(error.message || 'حدث خطأ أثناء تحديث الإعدادات')
  }
}

// Admin settings types
export interface AdminSettingsData {
  user: {
    id: number
    name: string
    email: string
    phone: string | null
    image: string | null
  }
  admin: {
    id: number
    address: string | null
  }
}

export async function fetchAdminSettings() {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "غير مصرح" }
    }

    const userId = Number.parseInt(session.user.id)

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        admin: true,
      },
    })

    if (!user || !user.admin) {
      return { success: false, error: "المستخدم غير موجود" }
    }

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          image: user.image,
        },
        admin: {
          id: user.admin.id,
          address: user.admin.address,
        },
      },
    }
  } catch (error) {
    console.error("Error fetching admin settings:", error)
    return { success: false, error: "حدث خطأ أثناء جلب البيانات" }
  }
}

export async function getAdminCompanyInfo() {
  try {
    const session = await auth()

    // Allow all authenticated users to see admin info (or adjust as needed)
    if (!session?.user) {
      return { success: false, error: "غير مصرح" }
    }

    // Get the first admin from database
    const admin = await prisma.admin.findFirst({
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            image: true,
          }
        },
      },
      orderBy: {
        id: 'asc'
      }
    })

    if (!admin) {
      return { success: false, error: "بيانات المشرف غير موجودة" }
    }

    const companyInfo = {
      companyName: admin.user.name || "Sonixpress",
      email: admin.user.email || "deliverysonicdak@gmail.com",
      phone: admin.user.phone || "+212601717961",
      address: admin.address || "الداخلة - المركز - الحي الحسني",
    }

    return {
      success: true,
      data: companyInfo,
    }
  } catch (error) {
    console.error("[v0] Error fetching admin display info:", error)
    return { 
      success: false, 
      error: "حدث خطأ أثناء جلب بيانات الشركة",
      data: {
        companyName: "Sonixpress",
        email: "deliverysonicdak@gmail.com",
        phone: "+212601717961",
        address: "الداخلة - المركز - الحي الحسني",
      }
    }
  }
}