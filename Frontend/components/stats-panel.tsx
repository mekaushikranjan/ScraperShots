"use client"

import { useGallery } from "./gallery-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Chart, ChartContainer, ChartBar, ChartTooltip, ChartXAxis, ChartYAxis } from "@/components/ui/chart"

export function StatsPanel() {
  const { stats } = useGallery()

  if (!stats) {
    return <div className="p-4 text-center">Loading stats...</div>
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Total Images</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{stats.totalImages.toLocaleString()}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Top Tags</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1">
            {stats.topTags.map((tag) => (
              <li key={tag.tag} className="flex justify-between items-center text-sm">
                <span>#{tag.tag}</span>
                <span className="text-muted-foreground">{tag.count}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Source Distribution</CardTitle>
        </CardHeader>
        <CardContent className="h-48">
          <ChartContainer className="h-full w-full">
            <Chart
              data={stats.sourceDistribution.map((item) => ({
                name: item.source,
                value: item.count,
              }))}
              margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
            >
              <ChartXAxis dataKey="name" />
              <ChartYAxis />
              <ChartBar dataKey="value" fill="#8884d8" />
              <ChartTooltip />
            </Chart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
