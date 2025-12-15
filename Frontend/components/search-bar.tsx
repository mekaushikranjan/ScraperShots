"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Search, Filter, User, Menu, Download, X } from "lucide-react"
import { useGallery } from "./gallery-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FilterDropdown } from "./filter-dropdown"
import { ThemeToggle } from "./theme-toggle"
import { LoginModal } from "./login-modal"
import { SignupModal } from "./signup-modal"
import { Logo } from "./logo"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { MobileMenu } from "./mobile-menu"
import Link from "next/link"

export function SearchBar() {
  const { updateFilters, filters } = useGallery()
  const [searchInput, setSearchInput] = useState(filters.search || "")
  const [showFilters, setShowFilters] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  // Sync search input with filters
  useEffect(() => {
    setSearchInput(filters.search || "")
  }, [filters.search])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchInput.trim()) {
      setIsSearching(true)
      updateFilters({ 
        search: searchInput.trim(),
        page: 1 // Reset to first page when searching
      })
      setIsSearching(false)
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchInput(value)
    // Clear search if input is empty
    if (!value.trim()) {
      updateFilters({ 
        search: "",
        page: 1
      })
    }
  }

  const clearSearch = () => {
    setSearchInput("")
    updateFilters({ 
      search: "",
      page: 1
    })
  }

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-2 sm:px-4 py-2 flex items-center gap-2 sm:gap-3">
          <Logo />

          <form onSubmit={handleSubmit} className="flex-1 flex ml-1 sm:ml-2">
            <div className="relative w-full group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by title, category, or tags..."
                value={searchInput}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-8 h-8 sm:h-9 bg-background/50 border-muted text-xs sm:text-sm"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              
            </div>
            <Button 
              type="submit" 
              className="ml-2 h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3"
              disabled={!searchInput.trim() || isSearching}
            >
              {isSearching ? "Searching..." : "Search"}
            </Button>
          </form>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />
            <Link href="/scrape">
              <Button variant="outline" size="icon" className="h-9 w-9">
                <Download className="h-4 w-4" />
                <span className="sr-only">Scrape Images</span>
              </Button>
            </Link>
            <div className="relative">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4" />
                <span className="sr-only">Filters</span>
              </Button>
              {showFilters && <FilterDropdown onClose={() => setShowFilters(false)} />}
            </div>
            <Button variant="ghost" className="h-9 text-sm" onClick={() => setShowLoginModal(true)}>
              Login
            </Button>
            <Button variant="outline" className="h-9 text-sm" onClick={() => setShowSignupModal(true)}>
              Sign Up
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 sm:hidden">
                <Menu className="h-4 w-4" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="p-0">
              <MobileMenu onLogin={() => setShowLoginModal(true)} onSignup={() => setShowSignupModal(true)} />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Spacer to prevent content from being hidden under fixed header */}
      <div className="h-[52px] sm:h-[60px]" />

      <LoginModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSignup={() => {
          setShowLoginModal(false)
          setShowSignupModal(true)
        }}
      />

      <SignupModal
        open={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        onLogin={() => {
          setShowSignupModal(false)
          setShowLoginModal(true)
        }}
      />
    </>
  )
}
