import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

export function Logo({ className, size = "md" }: LogoProps) {
  const sizes = {
    sm: "h-8",
    md: "h-10",
    lg: "h-12",
  }

  return (
    <div className={cn("flex items-center gap-3 group", className)}>
      <div className="relative flex items-center justify-center">
        <div className="flex items-center justify-center bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold rounded-lg overflow-hidden shadow-lg transform transition-all duration-300 group-hover:rotate-3 group-hover:scale-105 group-hover:shadow-xl">
          <div className="flex">
            <div className={cn("flex items-center justify-center px-2 relative", sizes[size])}>
              <span className="text-xl tracking-tight transform transition-transform duration-300 group-hover:scale-110">S</span>
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-lg blur-sm transform -rotate-3 scale-105 opacity-0 group-hover:opacity-100 transition-all duration-300" />
      </div>
      <div className="flex flex-col">
        <span className="font-bold text-lg hidden md:block bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent group-hover:from-primary group-hover:to-primary/80 transition-all duration-300">
          ScraperShots
        </span>
        <span className="text-xs text-muted-foreground hidden md:block transform transition-all duration-300 group-hover:translate-x-1">
          Capture. Collect. Create.
        </span>
      </div>
    </div>
  )
}

