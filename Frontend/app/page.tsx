import { Suspense } from "react"
import ImageGallery from "@/components/image-gallery"
import { SearchBar } from "@/components/search-bar"
import { GalleryProvider } from "@/components/gallery-context"
import { CategoryNav } from "@/components/category-nav"

export default function Home() {
  return (
    <main className="min-h-screen">
      <GalleryProvider>
        <SearchBar />
        <CategoryNav />
        <div className="container mx-auto px-2 pt-[60px] sm:pt-[60px]">
          <ImageGallery />
        </div>
      </GalleryProvider>
    </main>
  )
}
