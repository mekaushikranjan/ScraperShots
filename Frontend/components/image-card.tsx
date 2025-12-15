"use client"

import type React from "react"
import { useState, useRef } from "react"
import Image from "next/image"
import { Heart, Download, Plus, Share2 } from "lucide-react"
import { useGallery } from "./gallery-context"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ImageCardProps {
  image: {
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
    category: string
    subcategories?: string[]
  }
}

export function ImageCard({ image }: ImageCardProps) {
  const { selectImage } = useGallery()
  const [isLiked, setIsLiked] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isTouched, setIsTouched] = useState(false)
  const [naturalAspectRatio, setNaturalAspectRatio] = useState<number | null>(null)
  const imageRef = useRef<HTMLImageElement>(null)

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
      const imageUrl = image.full_size_url || image.url
      
      // Fetch the image as a blob
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      
      // Create object URL from blob
      const objectUrl = window.URL.createObjectURL(blob)
      
      // Create and trigger download
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = `${image.title || 'image'}.jpg`
      document.body.appendChild(link)
      link.click()
      
      // Cleanup
      document.body.removeChild(link)
      window.URL.revokeObjectURL(objectUrl)
    } catch (error) {
      console.error('Error downloading image:', error)
    } finally {
      // Reset button state
      downloadButton.innerHTML = originalContent
      downloadButton.disabled = false
    }
  }

  const handleAddToCollection = (e: React.MouseEvent) => {
    e.stopPropagation()
    console.log("Adding to collection:", image.id)
  }

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    try {
      const shareData = {
        title: image.title,
        text: `Check out this image: ${image.title}`,
        url: image.url
      }

      // Try to use Web Share API if available
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        // Fallback: Copy URL to clipboard
        await navigator.clipboard.writeText(image.url)
        
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

  const handleTouchStart = () => {
    setIsTouched(true)
  }

  const handleTouchEnd = () => {
    setTimeout(() => setIsTouched(false), 1000)
  }

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    const aspectRatio = img.naturalHeight / img.naturalWidth
    setNaturalAspectRatio(aspectRatio)
  }

  // Calculate grid span based on natural aspect ratio
  const getGridSpan = () => {
    if (!naturalAspectRatio) return ""
    
    if (naturalAspectRatio > 1.8) {
      return "row-span-2" // Very tall images
    } else if (naturalAspectRatio < 0.6) {
      return "col-span-2" // Very wide images
    } else if (naturalAspectRatio > 1.4) {
      return "row-span-1.5" // Tall images
    } else if (naturalAspectRatio < 0.7) {
      return "col-span-1.5" // Wide images
    } else if (naturalAspectRatio > 1.2) {
      return "row-span-1.2" // Slightly tall images
    } else if (naturalAspectRatio < 0.8) {
      return "col-span-1.2" // Slightly wide images
    }
    return "" // Square-ish images
  }

  return (
    <div
      className={cn(
        "relative w-full rounded-lg overflow-hidden bg-muted/20 cursor-zoom-in transition-all duration-300 hover:shadow-lg",
        getGridSpan()
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={() => selectImage(image)}
    >
      <div className="relative w-full h-full">
        <Image
          ref={imageRef}
          src={image.thumbnailUrl || "/placeholder.svg"}
          alt={image.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className={cn(
            "object-cover transition-all duration-500",
            isHovered || isTouched ? "scale-110 brightness-110" : "scale-100"
          )}
          priority={image.height / image.width > 1.5}
          onLoad={handleImageLoad}
        />

        {/* Hover overlay with gradient */}
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/60 opacity-0 transition-opacity duration-300",
            (isHovered || isTouched) && "opacity-100"
          )}
        />

        {/* Top action buttons (visible on hover/touch) */}
        <div
          className={cn(
            "absolute top-2 sm:top-3 right-2 sm:right-3 flex gap-1 sm:gap-2 opacity-0 transition-all duration-300 translate-y-2",
            (isHovered || isTouched) && "opacity-100 translate-y-0"
          )}
        >
          <Button
            size="icon"
            variant="secondary"
            className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-white/80 hover:bg-white text-black shadow-sm"
            onClick={handleLike}
          >
            <Heart className={cn("h-3 w-3 sm:h-4 sm:w-4", isLiked && "fill-red-500 text-red-500")} />
            <span className="sr-only">Like</span>
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-white/80 hover:bg-white text-black shadow-sm"
            onClick={handleAddToCollection}
          >
            <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="sr-only">Add to collection</span>
          </Button>
        </div>

        {/* Bottom info (visible on hover/touch) */}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 p-2 sm:p-4 opacity-0 transition-all duration-300 translate-y-2",
            (isHovered || isTouched) && "opacity-100 translate-y-0"
          )}
        >
          <div className="flex justify-between items-center">
            <div className="flex flex-col text-white">
              <span className="text-xs sm:text-sm font-medium line-clamp-2">{image.title}</span>
            </div>
            <div className="flex gap-1 sm:gap-2">
              <Button
                size="icon"
                variant="secondary"
                className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-white/80 hover:bg-white text-black shadow-sm"
                onClick={handleShare}
              >
                <Share2 className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="sr-only">Share</span>
              </Button>
              <Button
                size="icon"
                variant="secondary"
                className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-white/80 hover:bg-white text-black shadow-sm"
                onClick={handleDownload}
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="sr-only">Download</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
