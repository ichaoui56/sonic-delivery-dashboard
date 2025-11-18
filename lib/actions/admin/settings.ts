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

export async function updateAdminProfile(data: {
    name: string
    phone: string | null
    profileImage: string | null
}) {
    try {
        const session = await auth()

        if (!session?.user || session.user.role !== "ADMIN") {
            return { success: false, error: "غير مصرح" }
        }

        const updatedUser = await prisma.user.update({
            where: { id: Number.parseInt(session.user.id) },
            data: {
                name: data.name,
                phone: data.phone,
                image: data.profileImage,
            },
        })

        return { success: true, data: updatedUser }
    } catch (error) {
        console.error("[v0] Error updating admin profile:", error)
        return { success: false, error: "حدث خطأ أثناء تحديث البيانات" }
    }
}
