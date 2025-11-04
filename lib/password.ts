import bcrypt from 'bcryptjs'

// Configuration
const SALT_ROUNDS = 12
const MAX_PASSWORD_LENGTH = 72 // bcrypt limit

export function saltAndHashPassword(password: string): string {
  // Validate password input
  if (!password || typeof password !== 'string') {
    throw new Error('كلمة المرور غير صالحة')
  }

  if (password.length < 8) {
    throw new Error('يجب أن تكون كلمة المرور 8 أحرف على الأقل')
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    throw new Error(`يجب ألا تزيد كلمة المرور عن ${MAX_PASSWORD_LENGTH} حرفًا`)
  }

  // Check for common passwords (basic check)
  const commonPasswords = ['12345678', 'password', 'qwertyui', '11111111', 'admin123']
  if (commonPasswords.includes(password.toLowerCase())) {
    throw new Error('كلمة المرور ضعيفة جدًا')
  }

  try {
    const salt = bcrypt.genSaltSync(SALT_ROUNDS)
    return bcrypt.hashSync(password, salt)
  } catch (error) {
    console.error('Password hashing error:', error)
    throw new Error('فشل في تشفير كلمة المرور')
  }
}

export function verifyPassword(password: string, hashedPassword: string): boolean {
  // Input validation
  if (!password || !hashedPassword || 
      typeof password !== 'string' || 
      typeof hashedPassword !== 'string') {
    return false
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    return false
  }

  try {
    // Use timing-safe comparison
    return bcrypt.compareSync(password, hashedPassword)
  } catch (error) {
    console.error('Password verification error')
    return false
  }
}

// Function to validate password strength
export function validatePasswordStrength(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'يجب أن تكون كلمة المرور 8 أحرف على الأقل' }
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    return { valid: false, message: `يجب ألا تزيد كلمة المرور عن ${MAX_PASSWORD_LENGTH} حرفًا` }
  }

  // Check for character variety
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)

  const strengthScore = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length

  if (strengthScore < 3) {
    return { 
      valid: false, 
      message: 'يجب أن تحتوي كلمة المرور على مزيج من الأحرف الكبيرة والصغيرة والأرقام والرموز' 
    }
  }

  return { valid: true }
}