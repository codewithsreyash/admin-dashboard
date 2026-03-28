"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

const data = [
  { name: 'Mon', incidents: 42, alerts: 104 },
  { name: 'Tue', incidents: 38, alerts: 98 },
  { name: 'Wed', incidents: 30, alerts: 85 },
  { name: 'Thu', incidents: 25, alerts: 70 },
  { name: 'Fri', incidents: 18, alerts: 62 },
  { name: 'Sat', incidents: 12, alerts: 55 },
  { name: 'Sun', incidents: 8, alerts: 48 },
];

export default function AnalyticsPage() {
  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-black tracking-tight uppercase italic">Analytics & Crime Prevention Trends</h2>
        <p className="text-muted-foreground text-sm uppercase tracking-widest font-bold">Historical data analysis from SafeCity Anomaly Engine</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-2xl border-primary/20 bg-muted/10 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary">Incident Reduction (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#ec4899' }}
                />
                <Bar dataKey="incidents" fill="rgb(239, 68, 68)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-2xl border-green-500/20 bg-muted/10 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-green-500">System Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                   contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Legend />
                <Line type="monotone" dataKey="alerts" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="bg-destructive/10 border-l-4 border-destructive p-6 rounded-r-lg">
        <h4 className="font-bold text-destructive uppercase text-xs tracking-[0.2em] mb-2">Technical Insight</h4>
        <p className="text-sm text-foreground/80 leading-relaxed">
          The 72% reduction in major incidents since Monday coincides with the deployment of the 
          <strong> Predictive Geo-Fence Warning system</strong>. The system provides immediate haptic 
          feedback to tourists approaching high-risk zones, effectively preventing escalation before it occurs.
        </p>
      </div>
    </div>
  )
}
