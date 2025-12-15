"use client"

import { useRef, useEffect } from "react"
import { useGallery } from "./gallery-context"
import { ImageCard } from "./image-card"
import { ImageModal } from "./image-modal"

export default function ImageGallery() {
  const { images, loading, loadMore, selectedImage } = useGallery()
  const observerRef = useRef<HTMLDivElement>(null)

  // Implement infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          loadMore()
        }
      },
      { threshold: 0.1 },
    )

    if (observerRef.current) {
      observer.observe(observerRef.current)
    }

    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current)
      }
    }
  }, [loading, loadMore])

  if (images.length === 0 && !loading) {
    return (
      <div className="text-center py-10">
        <p className="text-xl mb-4">No images found</p>
        <p className="text-muted-foreground">Try adjusting your search or filters</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="image-grid">
        {images.map((image) => (
          <ImageCard key={image.id} image={image} />
        ))}
      </div>

      <div ref={observerRef} className="flex justify-center py-8">
        {loading && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }}></div>
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }}></div>
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }}></div>
          </div>
        )}
      </div>

      {selectedImage && <ImageModal />}
    </div>
  )
}
