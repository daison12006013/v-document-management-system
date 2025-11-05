"use client"

import { LoginForm } from "@/components/auth/login-form"
import { ThemeToggle } from "@/components/theme/theme-toggle"

export function LoginPage() {
  return (
    <main className="flex min-h-screen bg-background">
      {/* Theme toggle button */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Left side - Welcome content */}
      <div className="flex-1 flex flex-col items-center justify-center p-12 lg:p-24">
        <div className="max-w-2xl w-full">
          <div className="text-5xl lg:text-6xl font-bold mb-6 text-foreground">
            <img
              src="/vistra-logo.svg"
              alt="Vistra Logo"
              className="h-12"
            />
            Welcome to the Takehome Exam
          </div>
          <p className="text-xl text-muted-foreground mb-12">
            Next.js application with TypeScript, Tailwind CSS, and PostgreSQL
          </p>
        </div>
      </div>

      {/* Right side - Login form modal */}
      <div className="flex-1 flex items-center justify-center p-12 lg:p-24 bg-muted/50">
        <div className="relative w-full max-w-md">
          {/* Modal backdrop effect */}
          <div className="absolute inset-0 bg-muted/50 backdrop-blur-sm rounded-2xl -z-10 transform translate-x-2 translate-y-2"></div>

          {/* Login form */}
          <div className="relative">
            <LoginForm />
          </div>
        </div>
      </div>
    </main>
  )
}

