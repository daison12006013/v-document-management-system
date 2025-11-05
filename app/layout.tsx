import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Vistra Takehome Exam",
  description: "Next.js application for Vistra takehome exam",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('vistra-ui-theme') || 'dark';
                document.documentElement.classList.add(theme);
              })();
            `,
          }}
        />
        <ThemeProvider defaultTheme="dark" storageKey="vistra-ui-theme">
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}

