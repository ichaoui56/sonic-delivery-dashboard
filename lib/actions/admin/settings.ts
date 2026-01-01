"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

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
                },
            },
        }
    } catch (error) {
        console.error("[v0] Error fetching admin settings:", error)
        return { success: false, error: "حدث خطأ أثناء جلب البيانات" }
    }
}

export async function updateUserProfile(data: {
  name: string
  phone: string | null
  profileImage: string | null
}) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      throw new Error('غير مصرح')
    }

    const userId = Number.parseInt(session.user.id)

    await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        phone: data.phone,
        image: data.profileImage,
      },
    })

    return { success: true }
  } catch (error) {
    console.error('[v0] Error updating user profile:', error)
    throw new Error('حدث خطأ أثناء تحديث الملف الشخصي')
  }
}

export async function updateAdminProfile() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      throw new Error('غير مصرح')
    }

    // No specific admin fields to update yet
    return { success: true }
  } catch (error) {
    console.error('[v0] Error updating admin profile:', error)
    throw new Error('حدث خطأ أثناء تحديث إعدادات المشرف')
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
        },
      },
    }
  } catch (error) {
    console.error("Error fetching admin settings:", error)
    return { success: false, error: "حدث خطأ أثناء جلب البيانات" }
  }
}

