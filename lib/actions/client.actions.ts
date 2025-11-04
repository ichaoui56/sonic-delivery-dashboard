// lib/actions/client.actions.ts
"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getAllClients() {
    try {
        const clients = await prisma.client.findMany({
            include: {
                transactions: true,
                clientPayments: true,
            },
            orderBy: { createdAt: "desc" }
        })

        // Calculate balances and totals for each client
        const clientsWithCalculations = clients.map(client => {
            // FIX: Use totalAmount instead of amount
            const totalSales = client.transactions.reduce((sum, transaction) => sum + transaction.totalAmount, 0)
            const totalPayments = client.clientPayments.reduce((sum, payment) => sum + payment.amount, 0)
            const balance = totalSales - totalPayments

            return {
                ...client,
                totalSales,
                totalPayments,
                balance
            }
        })

        return { success: true, data: clientsWithCalculations }
    } catch (error) {
        console.error("Error fetching clients:", error)
        return { success: false, error: "فشل في جلب بيانات العملاء" }
    }
}

export async function getClientById(id: string) {
    try {
        const client = await prisma.client.findUnique({
            where: { id },
            include: {
                transactions: {
                    orderBy: { date: "desc" }
                },
                clientPayments: {
                    orderBy: { date: "desc" }
                },
            },
        })

        if (!client) {
            return { success: false, error: "العميل غير موجود" }
        }

        // FIX: Use totalAmount instead of amount
        const totalSales = client.transactions.reduce((sum, transaction) => sum + transaction.totalAmount, 0)
        const totalPayments = client.clientPayments.reduce((sum, payment) => sum + payment.amount, 0)
        const balance = totalSales - totalPayments

        const clientWithCalculations = {
            ...client,
            totalSales,
            totalPayments,
            balance
        }

        return { success: true, data: clientWithCalculations }
    } catch (error) {
        console.error("Error fetching client:", error)
        return { success: false, error: "فشل في جلب بيانات العميل" }
    }
}

export async function createClient(data: {
    name: string
    city: string
    phoneNumber: string
}) {
    try {
        const client = await prisma.client.create({
            data: {
                name: data.name,
                city: data.city,
                phoneNumber: data.phoneNumber,
            },
        })

        revalidatePath("/clients")
        return { success: true, data: client }
    } catch (error) {
        console.error("Error creating client:", error)
        return { success: false, error: "فشل في إضافة العميل" }
    }
}

export async function updateClient(
    id: string,
    data: {
        name?: string
        city?: string
        phoneNumber?: string
    }
) {
    try {
        const client = await prisma.client.update({
            where: { id },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.city && { city: data.city }),
                ...(data.phoneNumber && { phoneNumber: data.phoneNumber }),
            },
        })

        revalidatePath("/clients")
        revalidatePath(`/clients/${id}`)
        return { success: true, data: client }
    } catch (error) {
        console.error("Error updating client:", error)
        return { success: false, error: "فشل في تحديث بيانات العميل" }
    }
}

export async function deleteClient(id: string) {
    try {
        await prisma.client.delete({
            where: { id },
        })

        revalidatePath("/clients")
        return { success: true }
    } catch (error) {
        console.error("Error deleting client:", error)
        return { success: false, error: "فشل في حذف العميل" }
    }
}

export async function createTransaction(data: {
    clientId: string
    productName: string
    unitPrice: number
    quantity: number
    note?: string
    date?: Date
}) {
    try {
        // Calculate total amount
        const totalAmount = data.unitPrice * data.quantity

        const transaction = await prisma.transaction.create({
            data: {
                clientId: data.clientId,
                productName: data.productName,
                unitPrice: data.unitPrice,
                quantity: data.quantity,
                totalAmount: totalAmount,
                note: data.note,
                date: data.date || new Date(),
            },
        })

        revalidatePath("/clients")
        revalidatePath(`/clients/${data.clientId}`)
        return { success: true, data: transaction }
    } catch (error) {
        console.error("Error creating transaction:", error)
        return { success: false, error: "فشل في إضافة معاملة" }
    }
}

export async function createClientPayment(data: {
    clientId: string
    amount: number
    note?: string
    date?: Date
}) {
    try {
        const payment = await prisma.clientPayment.create({
            data: {
                clientId: data.clientId,
                amount: data.amount,
                note: data.note,
                date: data.date || new Date(),
            },
        })

        revalidatePath("/clients")
        revalidatePath(`/clients/${data.clientId}`)
        return { success: true, data: payment }
    } catch (error) {
        console.error("Error creating client payment:", error)
        return { success: false, error: "فشل في تسجيل الدفعة" }
    }
}

// lib/actions/client.actions.ts - Add these new functions

export async function updateTransaction(
    id: string,
    data: {
        productName?: string
        unitPrice?: number
        quantity?: number
        note?: string
        date?: Date
    }
) {
    try {
        const updateData: any = {}

        if (data.productName) updateData.productName = data.productName
        if (data.unitPrice !== undefined) updateData.unitPrice = data.unitPrice
        if (data.quantity !== undefined) updateData.quantity = data.quantity
        if (data.note !== undefined) updateData.note = data.note
        if (data.date) updateData.date = data.date

        // Recalculate totalAmount if unitPrice or quantity changed
        if (data.unitPrice !== undefined || data.quantity !== undefined) {
            const existingTransaction = await prisma.transaction.findUnique({
                where: { id }
            })

            if (existingTransaction) {
                const finalUnitPrice = data.unitPrice ?? existingTransaction.unitPrice
                const finalQuantity = data.quantity ?? existingTransaction.quantity
                updateData.totalAmount = finalUnitPrice * finalQuantity
            }
        }

        const transaction = await prisma.transaction.update({
            where: { id },
            data: updateData,
        })

        revalidatePath("/clients")
        revalidatePath(`/clients/${transaction.clientId}`)
        return { success: true, data: transaction }
    } catch (error) {
        console.error("Error updating transaction:", error)
        return { success: false, error: "فشل في تحديث المعاملة" }
    }
}

export async function updateClientPayment(
    id: string,
    data: {
        amount?: number
        note?: string
        date?: Date
    }
) {
    try {
        const payment = await prisma.clientPayment.update({
            where: { id },
            data: {
                ...(data.amount && { amount: data.amount }),
                ...(data.note !== undefined && { note: data.note }),
                ...(data.date && { date: data.date }),
            },
        })

        revalidatePath("/clients")
        revalidatePath(`/clients/${payment.clientId}`)
        return { success: true, data: payment }
    } catch (error) {
        console.error("Error updating client payment:", error)
        return { success: false, error: "فشل في تحديث الدفعة" }
    }
}

export async function deleteTransaction(id: string) {
    try {
        const transaction = await prisma.transaction.findUnique({
            where: { id }
        })

        await prisma.transaction.delete({
            where: { id },
        })

        revalidatePath("/clients")
        if (transaction) {
            revalidatePath(`/clients/${transaction.clientId}`)
        }
        return { success: true }
    } catch (error) {
        console.error("Error deleting transaction:", error)
        return { success: false, error: "فشل في حذف المعاملة" }
    }
}

export async function deleteClientPayment(id: string) {
    try {
        const payment = await prisma.clientPayment.findUnique({
            where: { id }
        })

        await prisma.clientPayment.delete({
            where: { id },
        })

        revalidatePath("/clients")
        if (payment) {
            revalidatePath(`/clients/${payment.clientId}`)
        }
        return { success: true }
    } catch (error) {
        console.error("Error deleting client payment:", error)
        return { success: false, error: "فشل في حذف الدفعة" }
    }
}