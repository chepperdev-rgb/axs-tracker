'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Mail, Lock, Eye, EyeOff, User } from 'lucide-react'
import { toast } from 'sonner'
import TachometerAnimation from '@/components/animations/TachometerAnimation'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showAnimation, setShowAnimation] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password.length < 1) {
      toast.error('Password is required')
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
          emailRedirectTo: undefined,
        },
      })

      if (error) {
        toast.error(error.message)
        return
      }

      // If we have a session, user is logged in (no email confirmation required)
      if (data.session) {
        setShowAnimation(true)
      } else {
        // Fallback: if Supabase still requires email confirmation
        toast.success('Account created! Check your email to verify.')
        router.push('/login')
      }
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnimationComplete = () => {
    router.push('/dashboard')
    router.refresh()
  }

  if (showAnimation) {
    return <TachometerAnimation onComplete={handleAnimationComplete} />
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#d4af37]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#d4af37]/5 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative">
        <CardHeader className="text-center space-y-2">
          {/* Logo */}
          <div className="mx-auto mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#d4af37] to-[#f0d060] flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.3)]">
              <span className="text-2xl font-bold text-[#0a0a0a]">AXS</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gold-gradient">Create Account</CardTitle>
          <CardDescription className="text-[#a0a0a0]">
            Start your journey to better habits
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4">
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[#f5f5f5]">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a0a0a0]" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pl-10 bg-[#1c1c1c] border-[#2a2a2a] text-[#f5f5f5] placeholder:text-[#606060] focus:border-[#d4af37] focus:ring-[#d4af37]/20"
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#f5f5f5]">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a0a0a0]" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pl-10 bg-[#1c1c1c] border-[#2a2a2a] text-[#f5f5f5] placeholder:text-[#606060] focus:border-[#d4af37] focus:ring-[#d4af37]/20"
                />
              </div>
            </div>

            {/* Password Field - Single, No Restrictions */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#f5f5f5]">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a0a0a0]" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pl-10 pr-10 bg-[#1c1c1c] border-[#2a2a2a] text-[#f5f5f5] placeholder:text-[#606060] focus:border-[#d4af37] focus:ring-[#d4af37]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a0a0a0] hover:text-[#d4af37] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full btn-luxury rounded-xl h-11 text-base"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>

            <p className="text-sm text-[#a0a0a0] text-center">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-[#d4af37] hover:text-[#f0d060] transition-colors font-medium"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
