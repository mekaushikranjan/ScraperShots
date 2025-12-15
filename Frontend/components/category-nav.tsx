"use client"

import { useGallery } from "./gallery-context"
import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

interface Category {
  id: string
  label: string
}

const categories: Category[] = [
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

export function CategoryNav() {
  const { updateFilters, filters } = useGallery()
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const categoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const navRef = useRef<HTMLDivElement>(null)

  const handleCategoryClick = (categoryId: string, event: React.MouseEvent<HTMLButtonElement>) => {
    const categoryElement = categoryRefs.current[categoryId]
    if (categoryElement) {
      const rect = categoryElement.getBoundingClientRect()
      const navRect = navRef.current?.getBoundingClientRect()
      if (navRect) {
        // setSubcategoryPosition({
        //   left: rect.left - navRect.left,
        //   width: rect.width
        // })
      }
    }
    updateFilters({ category: categoryId, page: 1, search: "" })
    setExpandedCategory(categoryId === expandedCategory ? null : categoryId)
  }

  // Close subcategories when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (expandedCategory && !(event.target as Element).closest('.category-nav')) {
        setExpandedCategory(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [expandedCategory])

  return (
    <div className="fixed top-[52px] sm:top-[60px] left-0 right-0 z-40 category-nav" ref={navRef}>
      {/* Main Navigation */}
      <nav className="bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-2 sm:px-4">
          <div className="flex items-center py-1.5 gap-3 sm:gap-4 overflow-x-auto scrollbar-hide">
            {categories.map((category) => (
              <div 
                key={category.id} 
                className="relative flex-shrink-0"
                ref={(el) => {
                  categoryRefs.current[category.id] = el
                }}
              >
                <button
                  onClick={(e) => handleCategoryClick(category.id, e)}
                  className={cn(
                    "px-2.5 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap",
                    filters.category === category.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  {category.label}
                </button>
              </div>
            ))}
          </div>
        </div>
      </nav>

      {/* Subcategories Box */}
      {/* expandedCategory && expandedCategory !== "all" && (
        <div 
          className="absolute bg-background/80 backdrop-blur-md border border-border/50 rounded-md shadow-lg z-50"
          style={{
            left: `${subcategoryPosition.left}px`,
            top: '100%',
            minWidth: `${subcategoryPosition.width}px`
          }}
        >
          <div className="p-2">
            <div className="grid grid-cols-2 gap-1">
              {getSubcategories(expandedCategory).map((subcategory) => (
                <button
                  key={subcategory}
                  onClick={() => handleSubcategoryClick(expandedCategory, subcategory)}
                  className={cn(
                    "px-2 py-1 rounded text-xs sm:text-sm font-medium transition-colors whitespace-nowrap text-left",
                    filters.subcategory === subcategory
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  {subcategory.charAt(0).toUpperCase() + subcategory.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) */}
    </div>
  )
}
