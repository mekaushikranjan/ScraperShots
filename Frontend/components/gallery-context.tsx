"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { ApiService } from "@/lib/api-service"
import { ImageData as BackendImageData, StatsData as BackendStatsData } from "@/lib/api-config"
import { GetImagesParams } from "@/lib/api-config"

type Source = "All" | "Web" | "Social" | "Local"
type SortOption = "newest" | "oldest" | "a-z" | "popular" | "downloads"
type Orientation = "any" | "landscape" | "portrait" | "square"

interface Filters {
  search: string
  source: Source
  dateFrom: string | null
  dateTo: string | null
  sort: SortOption
  page: number
  orientation?: string
  color?: string
  category: string
}

interface Image {
  id: string
  title: string
  url: string
  full_size_url?: string
  thumbnailUrl: string
  source: string
  scrapedDate: string
  tags: string[]
  width: number
  height: number
  photographer?: string
  displayUrl?: string
  category: string
}

interface Stats {
  totalImages: number
  topTags: { tag: string; count: number }[]
  sourceDistribution: { source: string; count: number }[]
  categoryBreakdown: { category: string; count: number; subcategories?: { name: string; count: number }[] }[]
}

interface GalleryContextType {
  images: Image[]
  loading: boolean
  filters: Filters
  stats: Stats | null
  selectedImage: Image | null
  hasMore: boolean
  updateFilters: (newFilters: Partial<Filters>) => void
  resetFilters: () => void
  selectImage: (image: Image | null) => void
  loadMore: () => void
  getSubcategories: (category: string) => string[]
}

const defaultFilters: Filters = {
  search: "",
  source: "All",
  dateFrom: null,
  dateTo: null,
  sort: "newest",
  page: 1,
  orientation: "any",
  category: "all"
}

const GalleryContext = createContext<GalleryContextType | undefined>(undefined)

export function GalleryProvider({ children }: { children: ReactNode }) {
  const [images, setImages] = useState<Image[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<Filters>(defaultFilters)
  const [stats, setStats] = useState<Stats | null>(null)
  const [selectedImage, setSelectedImage] = useState<Image | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [loadedImageIds, setLoadedImageIds] = useState<Set<string>>(new Set())

  // Category to subcategory mapping
  const categoryMapping = {
    sports: [
      "football", "soccer", "basketball", "tennis", "golf", "baseball",
      "cricket", "rugby", "hockey", "volleyball", "swimming", "athletics",
      "boxing", "martial arts", "wrestling", "gymnastics", "cycling",
      "racing", "surfing", "skiing", "snowboarding", "skateboarding"
    ],
    nature: [
      "landscape", "mountains", "forest", "ocean", "beach", "sunset",
      "wildlife", "flowers", "garden", "plants", "trees", "waterfall"
    ],
    technology: [
      "computer", "smartphone", "robot", "ai", "gadget", "electronics",
      "software", "hardware", "internet", "data", "cybersecurity"
    ],
    business: [
      "office", "meeting", "presentation", "startup", "entrepreneur",
      "corporate", "finance", "marketing", "team", "workplace"
    ],
    art: [
      "painting", "sculpture", "drawing", "illustration", "digital art",
      "gallery", "museum", "exhibition", "artist", "creative"
    ],
    fashion: [
      "clothing", "accessories", "runway", "model", "style", "designer",
      "fashion show", "outfit", "trend", "luxury"
    ],
    music: [
      "concert", "band", "musician", "instrument", "performance",
      "studio", "recording", "sound", "dj", "festival"
    ],
    education: [
      "school", "university", "classroom", "student", "teacher",
      "learning", "study", "campus", "library", "research"
    ],
    health: [
      "fitness", "wellness", "medical", "doctor", "hospital",
      "healthcare", "exercise", "yoga", "meditation", "nutrition"
    ],
    automotive: [
      "car", "vehicle", "automobile", "transportation", "driving",
      "road", "highway", "racing", "motorcycle", "luxury car"
    ],
    abstract: [
      "pattern", "texture", "background", "minimal", "geometric",
      "shape", "form", "color", "design", "artistic"
    ],
    editorial: [
      "magazine", "cover", "story", "feature", "journalism",
      "press", "media", "publication", "article", "news"
    ],
    film: [
      "movie", "cinema", "theater", "actor", "actress", "director",
      "scene", "set", "production", "hollywood"
    ],
    "3d": [
      "3d-rendering", "3d-model", "3d-art", "digital-art", "animation",
      "cg", "computer-graphics", "virtual", "simulation", "3d-design"
    ],
    architecture: [
      "building", "city", "urban", "interior", "design", "modern",
      "house", "apartment", "structure", "construction"
    ],
    people: [
      "portrait", "person", "human", "face", "lifestyle", "fashion",
      "beauty", "model", "family", "friends"
    ],
    animals: [
      "pet", "dog", "cat", "wildlife", "bird", "mammal", "reptile",
      "fish", "insect", "zoo"
    ],
    food: [
      "meal", "restaurant", "cooking", "recipe", "cuisine", "dessert",
      "breakfast", "lunch", "dinner", "snack"
    ],
    travel: [
      "vacation", "tourism", "destination", "journey", "adventure",
      "explore", "trip", "holiday", "backpacking", "roadtrip"
    ]
  }

  // Fetch images based on filters
  useEffect(() => {
    const fetchImages = async () => {
      if (!hasMore && filters.page > 1) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const params: GetImagesParams = {
          search: filters.search || undefined,
          source: filters.source !== "All" ? filters.source : undefined,
          date_from: filters.dateFrom ? new Date(filters.dateFrom).toISOString() : undefined,
          date_to: filters.dateTo ? new Date(filters.dateTo).toISOString() : undefined,
          sort_by: filters.sort,
          sort_order: filters.sort === "oldest" ? "asc" : "desc" as const,
          page: filters.page,
          limit: 20,
          category: filters.category !== "all" ? filters.category : undefined,
        }

        const backendImages = await ApiService.getImages(params)
        
        // Filter out duplicates using loadedImageIds
        const newImages = backendImages.filter(img => !loadedImageIds.has(img._id))
        
        // Update loaded image IDs
        const newImageIds = new Set([...loadedImageIds, ...newImages.map(img => img._id)])
        setLoadedImageIds(newImageIds)
        
        // Map backend image data to frontend image interface
        const mappedImages: Image[] = newImages.map((img: BackendImageData) => ({
          id: img._id,
          title: img.title,
          url: img.r2_url || img.image_url,
          full_size_url: img.r2_url || img.full_size_url || img.image_url,
          thumbnailUrl: img.r2_url || img.image_url,
          source: img.source_url,
          scrapedDate: img.scraped_at,
          tags: img.tags,
          width: img.width || 1200,
          height: img.height || 800,
          photographer: undefined,
          displayUrl: undefined,
          category: img.category || "other",
        }))

        setImages((prev) => (filters.page === 1 ? mappedImages : [...prev, ...mappedImages]))
      } catch (error) {
        console.error("Error fetching images:", error)
        setHasMore(false)
      } finally {
        setLoading(false)
      }
    }

    fetchImages()
  }, [filters, hasMore])

  // Reset loaded images when filters change
  useEffect(() => {
    setLoadedImageIds(new Set())
    setHasMore(true)
    setImages([]) // Clear images when filters change
  }, [filters.search, filters.source, filters.dateFrom, filters.dateTo, filters.sort, filters.category])

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const backendStats = await ApiService.getStats()
        
        // Map backend stats to frontend stats interface
        const mappedStats: Stats = {
          totalImages: backendStats.total_images,
          topTags: (backendStats.top_tags ?? []).map(tag => ({
            tag: tag._id,
            count: tag.count
          })),
          sourceDistribution: (backendStats.source_breakdown ?? []).map(source => ({
            source: source._id,
            count: source.count
          })),
          categoryBreakdown: (backendStats.category_breakdown ?? []).map(cat => ({
            category: cat._id,
            count: cat.count,
            subcategories: categoryMapping[cat._id as keyof typeof categoryMapping]?.map(sub => ({
              name: sub,
              count: 0 // This will be updated when we have subcategory stats
            }))
          }))
        }

        setStats(mappedStats)
      } catch (error) {
        console.error("Error fetching stats:", error)
      }
    }

    fetchStats()
  }, [])

  const updateFilters = (newFilters: Partial<Filters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }))
    setHasMore(true)
    setLoadedImageIds(new Set()) // Reset loaded images when filters change
  }

  const resetFilters = () => {
    setFilters(defaultFilters)
    setHasMore(true)
    setLoadedImageIds(new Set()) // Reset loaded images when filters are reset
  }

  const selectImage = (image: Image | null) => {
    setSelectedImage(image)
  }

  const loadMore = () => {
    if (!loading && hasMore) {
      setFilters((prev) => ({ ...prev, page: prev.page + 1 }))
    }
  }

  const getSubcategories = (category: string): string[] => {
    return categoryMapping[category as keyof typeof categoryMapping] || []
  }

  return (
    <GalleryContext.Provider
      value={{
        images,
        loading,
        filters,
        stats,
        selectedImage,
        hasMore,
        updateFilters,
        resetFilters,
        selectImage,
        loadMore,
        getSubcategories
      }}
    >
      {children}
    </GalleryContext.Provider>
  )
}

export function useGallery() {
  const context = useContext(GalleryContext)
  if (context === undefined) {
    throw new Error("useGallery must be used within a GalleryProvider")
  }
  return context
}
