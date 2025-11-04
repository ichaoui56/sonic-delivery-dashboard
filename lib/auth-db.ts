import { prisma } from '@/lib/db'

// Input validation and sanitization
function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function isValidUserId(id: string): boolean {
  // Validate that ID is a valid UUID or numeric ID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  const numericRegex = /^\d+$/
  return uuidRegex.test(id) || numericRegex.test(id)
}

export async function getUserFromDb(email: string) {
  // Validate input
  if (!email || typeof email !== 'string') {
    console.warn('Invalid email input:', email)
    return null
  }

  const sanitizedEmail = sanitizeEmail(email)
  
  if (!isValidEmail(sanitizedEmail)) {
    console.warn('Invalid email format:', sanitizedEmail)
    return null
  }

  try {
    // Using Prisma's parameterized queries (built-in SQL injection protection)
    const user = await prisma.user.findUnique({
      where: { 
        email: sanitizedEmail 
      },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return user
  } catch (error) {
    // Log error without exposing database details
    console.error('Database error while fetching user')
    return null
  }
}

// Additional security function to check user by ID
export async function getUserById(id: string) {
  if (!isValidUserId(id)) {
    console.warn('Invalid user ID:', id)
    return null
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return user
  } catch (error) {
    console.error('Database error while fetching user by ID')
    return null
  }
}

// Function to log authentication attempts (for monitoring)
export async function logAuthAttempt(email: string, success: boolean, ipAddress?: string) {
  try {
    // You can implement logging to a separate table
    console.log(`Auth attempt: ${email}, success: ${success}, IP: ${ipAddress}`)
    
    // Example: Store in database if you have an auth_logs table
    /*
    await prisma.authLog.create({
      data: {
        email,
        success,
        ipAddress,
        timestamp: new Date()
      }
    })
    */
  } catch (error) {
    console.error('Failed to log auth attempt')
  }
}