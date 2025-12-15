"use client"

import { useRef, useEffect, useState } from "react"
import { useGallery } from "./gallery-context"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface FilterDropdownProps {
  onClose: () => void
}

export function FilterDropdown({ onClose }: FilterDropdownProps) {
  const { filters, updateFilters, resetFilters } = useGallery()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [selectedColor, setSelectedColor] = useState<string | null>(filters.color || null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [onClose])

  const handleColorSelect = (color: string) => {
    if (selectedColor === color) {
      // If clicking the same color, deselect it
      setSelectedColor(null)
      updateFilters({ color: undefined })
    } else {
      setSelectedColor(color)
      updateFilters({ color })
    }
  }

  const colors = [
    { value: "#000000", label: "Black" },
    { value: "#FFFFFF", label: "White" },
    { value: "#0000FF", label: "Blue" },
    { value: "#FF0000", label: "Red" },
    { value: "#FFFF00", label: "Yellow" },
    { value: "#00FF00", label: "Green" },
  ]

  const handleReset = () => {
    setSelectedColor(null)
    resetFilters()
  }

  return (
    <Card ref={dropdownRef} className="absolute right-0 top-12 w-80 p-0 z-30 shadow-lg">
      <div className="p-4 border-b border-border/50">
        <h3 className="font-medium">Filter by</h3>
      </div>

      <Tabs defaultValue="relevance" className="w-full">
        <div className="px-4 pt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="relevance">Relevance</TabsTrigger>
            <TabsTrigger value="date">Date</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="relevance" className="p-4 space-y-6">
          <div className="space-y-3">
            <Label htmlFor="orientation" className="text-sm font-medium">
              Orientation
            </Label>
            <Select
              value={filters.orientation || "any"}
              onValueChange={(value) => updateFilters({ orientation: value })}
            >
              <SelectTrigger id="orientation" className="w-full">
                <SelectValue placeholder="Any orientation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any orientation</SelectItem>
                <SelectItem value="landscape">Landscape</SelectItem>
                <SelectItem value="portrait">Portrait</SelectItem>
                <SelectItem value="square">Square</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label htmlFor="source" className="text-sm font-medium">
              Source
            </Label>
            <Select value={filters.source} onValueChange={(value) => updateFilters({ source: value as any })}>
              <SelectTrigger id="source" className="w-full">
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Sources</SelectItem>
                <SelectItem value="Web">Web</SelectItem>
                <SelectItem value="Social">Social</SelectItem>
                <SelectItem value="Local">Local</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="color" className="text-sm font-medium">
                Color
              </Label>
              <span className="text-xs text-muted-foreground">
                {selectedColor ? colors.find((c) => c.value === selectedColor)?.label || "Selected" : "Any color"}
              </span>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {colors.map((color) => (
                <button
                  key={color.value}
                  className={cn(
                    "w-full aspect-square rounded-md border border-border hover:opacity-80 relative",
                    selectedColor === color.value && "ring-2 ring-primary ring-offset-1",
                  )}
                  style={{ backgroundColor: color.value }}
                  onClick={() => handleColorSelect(color.value)}
                  title={color.label}
                >
                  {selectedColor === color.value && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check
                        className={cn(
                          "h-4 w-4",
                          // Use white check on dark colors, black check on light colors
                          ["#000000", "#0000FF", "#FF0000"].includes(color.value) ? "text-white" : "text-black",
                        )}
                      />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="date" className="p-4 space-y-6">
          <div className="space-y-3">
            <Label htmlFor="sort" className="text-sm font-medium">
              Sort By
            </Label>
            <Select value={filters.sort} onValueChange={(value) => updateFilters({ sort: value as any })}>
              <SelectTrigger id="sort" className="w-full">
                <SelectValue placeholder="Select sort option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="a-z">A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label htmlFor="date-from" className="text-sm font-medium">
              Date Range
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="date-from" className="text-xs text-muted-foreground">
                  From
                </Label>
                <input
                  id="date-from"
                  type="date"
                  value={filters.dateFrom || ""}
                  onChange={(e) => updateFilters({ dateFrom: e.target.value || null })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                />
              </div>
              <div>
                <Label htmlFor="date-to" className="text-xs text-muted-foreground">
                  To
                </Label>
                <input
                  id="date-to"
                  type="date"
                  value={filters.dateTo || ""}
                  onChange={(e) => updateFilters({ dateTo: e.target.value || null })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="p-4 border-t border-border/50 flex gap-3">
        <Button variant="outline" className="flex-1" onClick={handleReset}>
          Clear
        </Button>
        <Button className="flex-1" onClick={onClose}>
          Apply Filters
        </Button>
      </div>
    </Card>
  )
}
