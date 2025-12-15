"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Chrome, Twitter } from "lucide-react"
import { Logo } from "./logo"

interface LoginModalProps {
  open: boolean
  onClose: () => void
  onSignup: () => void
}

export function LoginModal({ open, onClose, onSignup }: LoginModalProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle login logic here
    console.log("Login with:", email, password)
    onClose()
  }

  const handleGoogleLogin = () => {
    // Handle Google login
    console.log("Login with Google")
  }

  const handleTwitterLogin = () => {
    // Handle Twitter login
    console.log("Login with Twitter")
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex flex-col items-center space-y-2 pb-2">
          <Logo size="sm" />
          <DialogTitle className="text-xl font-bold">Login to ScraperShots</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2 h-9"
              onClick={handleGoogleLogin}
            >
              <Chrome className="h-4 w-4" />
              <span className="text-xs">Google</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2 h-9"
              onClick={handleTwitterLogin}
            >
              <Twitter className="h-4 w-4" />
              <span className="text-xs">Twitter</span>
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="email" className="text-xs">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-9"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs">
                  Password
                </Label>
                <Button variant="link" className="h-auto p-0 text-xs">
                  Forgot password?
                </Button>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-9"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="remember" />
              <Label htmlFor="remember" className="text-xs">
                Remember me
              </Label>
            </div>

            <Button type="submit" className="w-full">
              Login
            </Button>
          </form>

          <div className="text-center text-xs">
            Don't have an account?{" "}
            <Button variant="link" className="p-0 h-auto text-xs" onClick={onSignup}>
              Join ScraperShots
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
