"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Download, Heart, X, Share2, Plus, Info, ChevronLeft, ChevronRight } from "lucide-react"
import { useGallery } from "./gallery-context"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-media-query"

export function ImageModal() {
  const { selectedImage, selectImage, images } = useGallery()
  const [isLiked, setIsLiked] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Close info panel on mobile when orientation changes
  useEffect(() => {
    if (isMobile && showInfo) {
      setShowInfo(false)
    }
  }, [isMobile])

  if (!selectedImage) return null

  const currentIndex = images.findIndex((img) => img.id === selectedImage.id)

  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (currentIndex > 0) {
      selectImage(images[currentIndex - 1])
    }
  }

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (currentIndex < images.length - 1) {
      selectImage(images[currentIndex + 1])
    }
  }

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsLiked(!isLiked)
  }

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const downloadButton = e.currentTarget as HTMLButtonElement
    const originalContent = downloadButton.innerHTML
    
    try {
      // Show loading state
      downloadButton.innerHTML = '<span class="animate-spin">⌛</span>'
      downloadButton.disabled = true

      // Get the full-size URL
      const imageUrl = selectedImage.full_size_url || selectedImage.url
      
      // Fetch the image as a blob
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      
      // Create object URL from blob
      const objectUrl = window.URL.createObjectURL(blob)
      
      // Create and trigger download
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = `${selectedImage.title || 'image'}.jpg`
      document.body.appendChild(link)
      link.click()
      
      // Cleanup
      document.body.removeChild(link)
      window.URL.revokeObjectURL(objectUrl)
      
      // Close the modal
      selectImage(null)
    } catch (error) {
      console.error('Error downloading image:', error)
    } finally {
      // Reset button state
      downloadButton.innerHTML = originalContent
      downloadButton.disabled = false
    }
  }

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    try {
      const shareData = {
        title: selectedImage.title,
        text: `Check out this image: ${selectedImage.title}`,
        url: selectedImage.url
      }

      // Try to use Web Share API if available
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        // Fallback: Copy URL to clipboard
        await navigator.clipboard.writeText(selectedImage.url)
        
        // Show temporary success message
        const shareButton = e.currentTarget as HTMLButtonElement
        const originalContent = shareButton.innerHTML
        shareButton.innerHTML = '<span class="text-green-500">✓</span>'
        setTimeout(() => {
          shareButton.innerHTML = originalContent
        }, 2000)
      }
    } catch (error) {
      console.error('Error sharing image:', error)
    }
  }

  return (
    <Dialog open={!!selectedImage} onOpenChange={(open) => !open && selectImage(null)}>
      <DialogContent className="max-w-7xl w-[95vw] max-h-[95vh] p-0 overflow-hidden bg-background/95 backdrop-blur-sm [&>button]:hidden sm:[&>button]:block">
        {/* Accessibility: DialogTitle for screen readers */}
        <DialogTitle className="sr-only">{selectedImage.title || "Image details"}</DialogTitle>
        <div className="relative h-full flex flex-col">
          {/* Top navigation bar */}
          <div className="flex justify-between items-center p-2 sm:p-4 border-b border-border/30">
            <div className="flex items-center gap-2 sm:gap-3">
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8" onClick={() => selectImage(null)}>
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="sr-only">Close</span>
              </Button>

              {currentIndex > 0 && (
                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 md:hidden" onClick={handlePrevious}>
                  <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="sr-only">Previous</span>
                </Button>
              )}

              {currentIndex < images.length - 1 && (
                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 md:hidden" onClick={handleNext}>
                  <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="sr-only">Next</span>
                </Button>
              )}
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-8 w-8"
                onClick={() => setShowInfo(!showInfo)}
              >
                <Info className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="sr-only">Info</span>
              </Button>

              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8" onClick={handleLike}>
                <Heart className={cn("h-4 w-4 sm:h-5 sm:w-5", isLiked && "fill-red-500 text-red-500")} />
                <span className="sr-only">Like</span>
              </Button>

              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8" onClick={(e) => e.stopPropagation()}>
                <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="sr-only">Add to collection</span>
              </Button>

              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8" onClick={handleShare}>
                <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="sr-only">Share</span>
              </Button>

              <Button className="h-8 text-xs sm:text-sm hidden sm:flex" onClick={handleDownload}>
                <Download className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Download
              </Button>

              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 sm:hidden" onClick={handleDownload}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Main content area */}
          <div className="flex-1 overflow-hidden relative">
            {/* Previous button (desktop) */}
            {currentIndex > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 h-8 w-8 sm:h-12 sm:w-12 rounded-full bg-background/50 backdrop-blur-sm z-10 hidden md:flex"
                onClick={handlePrevious}
              >
                <ChevronLeft className="h-4 w-4 sm:h-6 sm:w-6" />
                <span className="sr-only">Previous</span>
              </Button>
            )}

            {/* Image container */}
            <div className="h-full w-full flex items-center justify-center p-2 sm:p-4">
              <div className="relative w-full h-full flex items-center justify-center">
                <Image
                  src={selectedImage.url || "/placeholder.svg"}
                  alt={selectedImage.title}
                  width={selectedImage.width || 1200}
                  height={selectedImage.height || 800}
                  className="object-contain w-auto h-auto max-w-full max-h-[calc(95vh-120px)]"
                  priority
                />
              </div>
            </div>

            {/* Next button (desktop) */}
            {currentIndex < images.length - 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 h-8 w-8 sm:h-12 sm:w-12 rounded-full bg-background/50 backdrop-blur-sm z-10 hidden md:flex"
                onClick={handleNext}
              >
                <ChevronRight className="h-4 w-4 sm:h-6 sm:w-6" />
                <span className="sr-only">Next</span>
              </Button>
            )}

            {/* Info panel */}
            {showInfo && (
              <div className="absolute right-0 top-0 bottom-0 w-full md:w-80 bg-background/95 backdrop-blur-sm border-l border-border/30 p-4 sm:p-6 overflow-y-auto md:block">
                <h2 className="text-lg sm:text-xl font-semibold mb-4">{selectedImage.title}</h2>

                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-1 sm:mb-2">Photographer</h3>
                    <p className="text-xs sm:text-sm">{selectedImage.photographer || "Unknown"}</p>
                  </div>

                  <div>
                    <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-1 sm:mb-2">Source</h3>
                    <p className="text-xs sm:text-sm">{selectedImage.source}</p>
                  </div>

                  <div>
                    <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-1 sm:mb-2">Date Added</h3>
                    <p className="text-xs sm:text-sm">{selectedImage.scrapedDate}</p>
                  </div>

                  <div>
                    <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-1 sm:mb-2">Dimensions</h3>
                    <p className="text-xs sm:text-sm">
                      {selectedImage.width} × {selectedImage.height}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-1 sm:mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      {selectedImage.tags.map((tag) => (
                        <span key={tag} className="px-2 py-1 bg-muted rounded-md text-[10px] sm:text-xs">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
