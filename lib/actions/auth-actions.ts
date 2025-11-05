"use server"
import { signInSchema } from "@/lib/zod"
import { signIn, signOut } from "@/auth"
import { AuthError } from "next-auth"
import { headers } from "next/headers"

export type FormState = {
  errors?: {
    email?: string[]
    password?: string[]
  }
  message?: string
  values?: {
    email?: string
    password?: string
  }
  success?: boolean
  redirectUrl?: string
}

const rateLimitStore = new Map()

function getClientIP(): string {
  try {
    const headersList = headers()
    const forwardedFor = headersList.get("x-forwarded-for")
    const realIP = headersList.get("x-real-ip")

    if (forwardedFor) {
      return forwardedFor.split(",")[0].trim()
    }

    if (realIP) {
      return realIP
    }

    return "unknown"
  } catch (error) {
    console.error("Error getting client IP:", error)
    return "unknown"
  }
}

function checkRateLimit(identifier: string, limit = 10, windowMs: number = 15 * 60 * 1000): boolean {
  const now = Date.now()
  const windowStart = now - windowMs

  const attempts = rateLimitStore.get(identifier) || []
  const recentAttempts = attempts.filter((timestamp: number) => timestamp > windowStart)

  if (recentAttempts.length >= limit) {
    return false
  }

  recentAttempts.push(now)
  rateLimitStore.set(identifier, recentAttempts)
  return true
}

export async function signInAction(prevState: FormState | null, formData: FormData): Promise<FormState> {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  const ip = getClientIP()

  const submittedValues = {
    email,
    password,
  }

  try {
    if (!checkRateLimit(ip, 10, 15 * 60 * 1000)) {
      return {
        message: "تم تجاوز عدد المحاولات المسموح بها. يرجى المحاولة مرة أخرى بعد 15 دقيقة",
        values: submittedValues,
      }
    }

    if (!checkRateLimit(email, 10, 15 * 60 * 1000)) {
      return {
        message: "تم تجاوز عدد المحاولات المسموح بها. يرجى المحاولة مرة أخرى بعد 15 دقيقة",
        values: submittedValues,
      }
    }

    const validatedFields = signInSchema.safeParse({
      email,
      password,
    })

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        values: submittedValues,
      }
    }

    const result = await signIn("credentials", {
      email: validatedFields.data.email,
      password: validatedFields.data.password,
      redirect: false,
    })

    if (result?.error) {
      return {
        message: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
        values: submittedValues,
      }
    }

    return {
      success: true,
      message: "تم تسجيل الدخول بنجاح!",
      redirectUrl: "/dashboard",
    }
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error
    }

    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return {
            message: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
            values: submittedValues,
          }
        default:
          return {
            message: "حدث خطأ ما. يرجى المحاولة مرة أخرى",
            values: submittedValues,
          }
      }
    }

    console.error("Sign in error:", error)
    return {
      message: "حدث خطأ ما. يرجى المحاولة مرة أخرى",
      values: submittedValues,
    }
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: "/login" })
}
