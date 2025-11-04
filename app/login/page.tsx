import { LoginForm } from "@/components/login-form"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function LoginPage() {

  const session = await auth()

  if (session) {
    return redirect("/dashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <LoginForm />
    </div>
  )
}
