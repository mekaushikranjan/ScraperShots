"use client"

import { useState } from "react"
import { Download, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useScraper } from "@/hooks/useScraper"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ImageData } from "@/lib/api-config"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"

export default function ScrapePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [maxImages, setMaxImages] = useState(20) // Default to 20 images
  const { isLoading, startScraping, taskStatus, images, error } = useScraper()
  const router = useRouter()

  const handleScrape = async () => {
    if (!searchQuery.trim()) return
    await startScraping({
      category: searchQuery,
      max_images: maxImages,
    })
  }

  const handleClose = () => {
    router.back()
  }

  // Loading skeleton for images
  const ImageSkeleton = () => (
    <Card className="overflow-hidden">
      <div className="aspect-square relative">
        <Skeleton className="w-full h-full" />
      </div>
      <div className="p-2">
        <Skeleton className="h-4 w-3/4 mb-2" />
        <div className="flex gap-1">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </Card>
  )

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100]">
      <div className="w-full max-w-7xl mx-auto h-full flex flex-col">
        {/* Fixed header and search section */}
        <div className="bg-background border-b shadow-sm">
          {/* Header with close button */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b">
            <h1 className="text-lg sm:text-xl font-semibold">Scrape Images</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>

          {/* Search section */}
          <div className="p-3 sm:p-4 border-b">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter a category name to automatically scrape related images from various websites
              </p>

              <Card className="p-3 sm:p-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Enter category (e.g., nature, animals, food)"
                        className="pl-10"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={maxImages}
                        onChange={(e) => setMaxImages(Math.min(1000, Math.max(1, Number(e.target.value))))}
                        min={1}
                        max={1000}
                        className="w-20 sm:w-24"
                        disabled={isLoading}
                      />
                      <Button 
                        onClick={handleScrape} 
                        disabled={isLoading || !searchQuery.trim()}
                        className="whitespace-nowrap"
                      >
                        {isLoading ? (
                          <>
                            <Download className="mr-2 h-4 w-4 animate-spin" />
                            Scraping...
                          </>
                        ) : (
                          'Start Scraping'
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {taskStatus && (
                  <div className="space-y-2">
                    <Badge variant={taskStatus.status === 'completed' ? 'default' : 'secondary'}>
                      {taskStatus.status}
                    </Badge>
                    {taskStatus.message && (
                      <p className="text-sm text-muted-foreground">{taskStatus.message}</p>
                    )}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>

        {/* Scrollable image grid */}
        <div className="flex-1 overflow-y-auto bg-background">
          <div className="p-3 sm:p-4">
            {isLoading && !images?.length ? (
              <div className="space-y-3">
                <h2 className="text-base sm:text-lg font-semibold">Loading Images...</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <ImageSkeleton key={i} />
                  ))}
                </div>
              </div>
            ) : images && images.length > 0 ? (
              <div className="space-y-3">
                <h2 className="text-base sm:text-lg font-semibold">Scraped Images</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
                  {images.map((image: ImageData) => (
                    <Card key={image._id} className="overflow-hidden">
                      <div className="aspect-square relative">
                        <img
                          src={image.r2_url || image.image_url}
                          alt={image.title}
                          className="object-cover w-full h-full"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder-image.jpg'; // Add a placeholder image
                          }}
                        />
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-medium truncate">
                          {image.title}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {image.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-[10px]">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ) : !isLoading && (
              <div className="text-center py-8 text-muted-foreground">
                No images scraped yet. Enter a category and click "Start Scraping" to begin.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 