import { LoginForm } from "@/components/login-form"

export default function Home() {
  return (
    <main className="flex min-h-screen bg-black">
      {/* Left side - Welcome content */}
      <div className="flex-1 flex flex-col items-center justify-center p-12 lg:p-24">
        <div className="max-w-2xl w-full">
          <h1 className="text-5xl lg:text-6xl font-bold mb-6 text-white">
            Welcome to Vistra Takehome Exam
          </h1>
          <p className="text-xl text-gray-400 mb-12">
            Next.js application with TypeScript, Tailwind CSS, and PostgreSQL
          </p>
        </div>
      </div>

      {/* Right side - Login form modal */}
      <div className="flex-1 flex items-center justify-center p-12 lg:p-24 bg-gradient-to-br from-gray-900 to-black">
        <div className="relative w-full max-w-md">
          {/* Modal backdrop effect */}
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm rounded-2xl -z-10 transform translate-x-2 translate-y-2"></div>

          {/* Login form */}
          <div className="relative">
            <LoginForm />
          </div>
        </div>
      </div>
    </main>
  )
}

