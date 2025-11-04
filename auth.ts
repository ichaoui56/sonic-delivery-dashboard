import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { verifyPassword } from "./lib/password"
import { getUserFromDb } from "./lib/auth-db"
import { CredentialsSignin } from "next-auth"
import { signInSchema } from "./lib/zod"
import { headers } from "next/headers"

// Rate limiting configuration
const loginAttempts = new Map()

function getClientIP(request?: Request): string {
  try {
    if (!request) return 'unknown'
    
    // Get headers from the request
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    
    if (forwardedFor) {
      // x-forwarded-for may contain multiple IPs, first one is the client IP
      return forwardedFor.split(',')[0].trim()
    }
    
    if (realIP) {
      return realIP
    }
    
    return 'unknown'
  } catch (error) {
    console.error('Error getting client IP:', error)
    return 'unknown'
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "البريد الإلكتروني", type: "email" },
        password: { label: "كلمة المرور", type: "password" },
      },
      authorize: async (credentials, request) => {
        const ip = getClientIP(request)
        const now = Date.now()
        const windowTime = 15 * 60 * 1000 // 15 minutes
        const maxAttempts = 10

        try {
          // Validate credentials with Zod
          const validatedFields = signInSchema.safeParse(credentials)
          
          if (!validatedFields.success) {
            throw new CredentialsSignin("تنسيق الإدخال غير صالح")
          }

          const { email, password } = validatedFields.data

          // Input sanitization
          const sanitizedEmail = email.toLowerCase().trim()
          
          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(sanitizedEmail)) {
            throw new CredentialsSignin("تنسيق البريد الإلكتروني غير صالح")
          }

          // Rate limiting check
          const userAttempts = loginAttempts.get(sanitizedEmail) || { count: 0, lastAttempt: 0 }
          
          // Reset counter if window has passed
          if (now - userAttempts.lastAttempt > windowTime) {
            userAttempts.count = 0
          }

          // Check if exceeded max attempts
          if (userAttempts.count >= maxAttempts) {
            throw new CredentialsSignin("تم تجاوز عدد المحاولات المسموح بها. يرجى المحاولة مرة أخرى بعد 15 دقيقة")
          }

          // Get user from database with timeout
          const user = await Promise.race([
            getUserFromDb(sanitizedEmail),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), 5000)
            )
          ]) as Awaited<ReturnType<typeof getUserFromDb>>

          if (!user) {
            // Increment failed attempts
            userAttempts.count += 1
            userAttempts.lastAttempt = now
            loginAttempts.set(sanitizedEmail, userAttempts)
            
            // Use generic error message to prevent user enumeration
            throw new CredentialsSignin("بيانات الاعتماد غير صالحة")
          }

          // Verify password with timing-safe comparison
          const isValidPassword = verifyPassword(password, user.password)
          if (!isValidPassword) {
            // Increment failed attempts
            userAttempts.count += 1
            userAttempts.lastAttempt = now
            loginAttempts.set(sanitizedEmail, userAttempts)
            
            // Use generic error message to prevent user enumeration
            throw new CredentialsSignin("بيانات الاعتماد غير صالحة")
          }

          // Reset attempts on successful login
          loginAttempts.delete(sanitizedEmail)

          // Return user object (without password)
          return {
            id: user.id,
            name: user.name,
            email: user.email,
          }
        } catch (error) {
          if (error instanceof CredentialsSignin) {
            throw error
          }
          if (error instanceof Error && error.message === 'Timeout') {
            throw new CredentialsSignin("انتهت مهلة الخادم. يرجى المحاولة مرة أخرى")
          }
          console.error('Auth error:', error)
          throw new CredentialsSignin("فشل المصادقة")
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth/sign-in",
    signOut: "/auth/sign-out",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
      }
      return session
    },
  },
})