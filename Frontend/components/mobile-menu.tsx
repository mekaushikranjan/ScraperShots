"use client"

import { useState } from "react"
import { useGallery } from "./gallery-context"
import { Button } from "@/components/ui/button"
import { Logo } from "./logo"
import { ThemeToggle } from "./theme-toggle"
import { cn } from "@/lib/utils"
import { Download, Filter } from "lucide-react"
import Link from "next/link"

interface MobileMenuProps {
  onLogin: () => void
  onSignup: () => void
}

const categories = [
  { id: "all", label: "All" },
  { id: "editorial", label: "Editorial" },
  { id: "wallpapers", label: "Wallpapers" },
  { id: "3d", label: "3D Renders" },
  { id: "nature", label: "Nature" },
  { id: "architecture", label: "Architecture" },
  { id: "people", label: "People" },
  { id: "film", label: "Film" },
  { id: "travel", label: "Travel" },
  { id: "animals", label: "Animals" },
  { id: "food", label: "Food & Drink" },
  { id: "technology", label: "Technology" },
  { id: "business", label: "Business" },
  { id: "sports", label: "Sports" },
  { id: "art", label: "Art" },
  { id: "fashion", label: "Fashion" },
  { id: "music", label: "Music" },
  { id: "education", label: "Education" },
  { id: "health", label: "Health" },
  { id: "automotive", label: "Automotive" },
  { id: "abstract", label: "Abstract" },
  { id: "other", label: "Other" }
]

export function MobileMenu({ onLogin, onSignup }: MobileMenuProps) {
  const { updateFilters } = useGallery()
  const [activeCategory, setActiveCategory] = useState("all")

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId)
    updateFilters({ 
      category: categoryId,
      page: 1 
    })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b flex items-center justify-between">
        <Logo />
        <p>ScraperShorts</p>
        <ThemeToggle />
      </div>

      <div className="p-4 border-b space-y-3">
        <Link href="/scrape" className="w-full">
          <Button variant="outline" className="w-full justify-start gap-2">
            <Download className="h-4 w-4" />
            Scrape Images
          </Button>
        </Link>
       
      </div>

      <div className="p-4 border-b">
        <div className="flex gap-2">
          <Button className="flex-1" onClick={onLogin}>
            Login
          </Button>
          <Button variant="outline" className="flex-1" onClick={onSignup}>
            Sign Up
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <h3 className="font-medium mb-3 text-sm">Categories</h3>
        <div className="grid gap-1">
          {categories.map((category) => (
            <button
              key={category.id}
              className={cn(
                "text-sm py-2 px-3 rounded-md text-left transition-colors",
                activeCategory === category.id
                  ? "bg-secondary font-medium"
                  : "hover:bg-secondary/50 text-muted-foreground",
              )}
              onClick={() => handleCategoryClick(category.id)}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 border-t text-xs text-muted-foreground">© 2023 ScraperShots. All rights reserved.</div>
    </div>
  )
}
