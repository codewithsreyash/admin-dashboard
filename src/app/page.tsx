import { LiveMap } from "@/components/map/LiveMap"
import { AlertsFeed } from "@/components/alerts/AlertsFeed"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Activity, ShieldAlert, Fingerprint } from "lucide-react"

export default function Dashboard() {
  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">System Overview</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Active Tourists tracked" value="1,204" icon={<Users />} />
        <MetricCard title="System Pings / min" value="45.2K" icon={<Activity />} />
        <MetricCard title="High-Risk Alerts" value="3" icon={<ShieldAlert className="text-destructive animate-pulse" />} />
        <MetricCard title="Blockchain Verifications" value="100%" icon={<Fingerprint className="text-green-500" />} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 h-[600px]">
        <div className="col-span-4 h-full flex flex-col">
          <Card className="flex-1 border shadow-sm">
            <CardHeader className="py-4">
              <CardTitle>Live Map & Heatmap</CardTitle>
            </CardHeader>
            <CardContent className="h-[520px] p-0 pb-4 px-4 overflow-hidden rounded-b-xl">
              <LiveMap />
            </CardContent>
          </Card>
        </div>
        <div className="col-span-3 h-full">
          <AlertsFeed />
        </div>
      </div>
    </div>
  )
}

function MetricCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-4 w-4 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}
