import { object, string } from "zod"

// XSS prevention - sanitize input
function sanitizeString(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim()
}

// Email validation with strict rules
const emailValidation = string({ required_error: "البريد الإلكتروني مطلوب" })
  .min(1, "البريد الإلكتروني مطلوب")
  .max(254, "يجب ألا يزيد البريد الإلكتروني عن 254 حرفًا")
  .email("يرجى إدخال بريد إلكتروني صالح")
  .transform((email) => sanitizeString(email.toLowerCase()))

// Password validation with security rules
const passwordValidation = string({ required_error: "كلمة المرور مطلوبة" })
  .min(8, "يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل")
  .max(32, "يجب ألا تزيد كلمة المرور عن 32 حرفًا")
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "يجب أن تحتوي كلمة المرور على حرف كبير وحرف صغير ورقم واحد على الأقل")
  .transform((pwd) => sanitizeString(pwd))

export const signInSchema = object({
  email: emailValidation,
  password: passwordValidation,
})

export const signInDefaultValues = {
  email: "",
  password: "",
}