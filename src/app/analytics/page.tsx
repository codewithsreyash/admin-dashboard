"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { TrendingDown, Activity, AlertTriangle } from 'lucide-react';

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
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex flex-col gap-3">
        <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
          Analytics & Trends
        </h2>
        <p className="text-muted-foreground text-sm max-w-lg leading-relaxed">
          Historical data analysis from SafeCity Anomaly Engine
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass-card-elevated group">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-base font-semibold">
              <div className="p-2 rounded-xl bg-destructive/15 border border-destructive/20 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-destructive/20">
                <TrendingDown className="h-4 w-4 text-destructive" />
              </div>
              Incident Reduction (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[320px] w-full flex min-w-0" style={{ minHeight: '320px', minWidth: '0' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(239, 68, 68)" stopOpacity={1}/>
                    <stop offset="100%" stopColor="rgb(239, 68, 68)" stopOpacity={0.6}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.08} vertical={false} />
                <XAxis dataKey="name" stroke="#666" fontSize={11} tickLine={false} axisLine={false} dy={8} />
                <YAxis stroke="#666" fontSize={11} tickLine={false} axisLine={false} dx={-8} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 15, 20, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
                  itemStyle={{ color: '#f87171' }}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Bar dataKey="incidents" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card-elevated group">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-base font-semibold">
              <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/20 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-emerald-500/20">
                <Activity className="h-4 w-4 text-emerald-500" />
              </div>
              System Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[320px] w-full flex min-w-0" style={{ minHeight: '320px', minWidth: '0' }}>
             <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <defs>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.08} vertical={false} />
                <XAxis dataKey="name" stroke="#666" fontSize={11} tickLine={false} axisLine={false} dy={8} />
                <YAxis stroke="#666" fontSize={11} tickLine={false} axisLine={false} dx={-8} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 15, 20, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
                  cursor={{ stroke: 'rgba(255,255,255,0.1)' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Line 
                  type="monotone" 
                  dataKey="alerts" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="glass-card-elevated rounded-2xl p-6 border-l-4 border-destructive/50 bg-gradient-to-r from-destructive/10 to-transparent">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-destructive/15 border border-destructive/20">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-foreground">Technical Insight</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The 72% reduction in major incidents since Monday coincides with the deployment of the 
              <strong className="text-foreground"> Predictive Geo-Fence Warning system</strong>. The system provides immediate haptic 
              feedback to tourists approaching high-risk zones, effectively preventing escalation before it occurs.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
