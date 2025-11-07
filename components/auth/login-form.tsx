"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { auth, ApiError } from "@/lib/api"

export const LoginForm = () => {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await auth.login(email, password)
      // Success - wait a moment for cookies to be set, then do full page navigation
      // This ensures cookies are available when the page loads
      await new Promise(resolve => setTimeout(resolve, 300))
      // Force a full page reload to ensure session cookie is read
      window.location.href = "/"
    } catch (err) {
      console.error('Login error:', err)
      setIsLoading(false)
      if (err instanceof ApiError) {
        // Extract error message from API error
        const errorMessage = err.message || err.data?.message || "Login failed"
        setError(errorMessage)
      } else if (err instanceof Error) {
        setError(err.message || "An unexpected error occurred. Please try again.")
      } else {
        setError("An unexpected error occurred. Please try again.")
      }
    }
  }

  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
        <CardDescription>
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="admin@vistra.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
              {error}
            </div>
          )}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
};

