"use client"
import { X } from "lucide-react"
import { useState } from "react"
import { useGallery } from "./gallery-context"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatsPanel } from "./stats-panel"
import { cn } from "@/lib/utils"

export function Sidebar() {
  const { stats } = useGallery()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

  return (
    <>
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden" onClick={toggleSidebar} />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-80 bg-card border-r border-border/30 p-6 transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:z-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">ScraperShorts</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:hidden">
            <X className="h-5 w-5" />
            <span className="sr-only">Close sidebar</span>
          </Button>
        </div>

        <Tabs defaultValue="stats">
          <TabsList className="grid w-full grid-cols-1 mb-6">
            <TabsTrigger value="stats">Statistics</TabsTrigger>
          </TabsList>

          <TabsContent value="stats">
            <StatsPanel />
          </TabsContent>
        </Tabs>
      </aside>
    </>
  )
}
