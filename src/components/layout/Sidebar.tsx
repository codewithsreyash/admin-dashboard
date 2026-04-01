"use client"
import Link from "next/link"
import { ShieldAlert, BarChart3, Fingerprint, Map, Users, LogOut, Home, Route, Sparkles } from "lucide-react"
import { usePathname } from "next/navigation"

export function Sidebar() {
  const pathname = usePathname()
  
  return (
    <div className="flex h-screen w-72 flex-col border-r border-border/30 bg-sidebar backdrop-blur-2xl px-5 py-8 relative overflow-hidden">
      {/* Ambient glow effect */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-primary/3 to-transparent pointer-events-none" />
      
      {/* Logo Section */}
      <div className="flex items-center gap-3 mb-12 px-2 relative">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
          <div className="relative p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
            <ShieldAlert className="h-7 w-7 text-primary" />
          </div>
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            SafeGuard<span className="text-primary">.io</span>
          </h1>
          <p className="text-[10px] text-muted-foreground font-medium tracking-wide">Security Dashboard</p>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 space-y-1.5 relative">
        <NavItem href="/" icon={<Home className="h-[18px] w-[18px]" />} label="Dashboard" active={pathname === "/"} />
        <NavItem href="/analytics" icon={<BarChart3 className="h-[18px] w-[18px]" />} label="Analytics & Trends" active={pathname === "/analytics"} />
        <NavItem href="/verify" icon={<Fingerprint className="h-[18px] w-[18px]" />} label="Verify Tourist ID" active={pathname === "/verify"} />
        
        <div className="pt-6 pb-3 px-3">
          <div className="flex items-center gap-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em]">
            <Sparkles className="h-3 w-3" />
            Fleet Management
          </div>
        </div>
        
        <NavItem href="/map" icon={<Map className="h-[18px] w-[18px]" />} label="Live Map" active={pathname === "/map"} />
        <NavItem href="/trips" icon={<Route className="h-[18px] w-[18px]" />} label="Trip Management" active={pathname === "/trips"} />
        <NavItem href="/tourists" icon={<Users className="h-[18px] w-[18px]" />} label="Tourists" active={pathname === "/tourists"} />
      </nav>

      {/* Footer */}
      <div className="mt-auto pt-4 border-t border-border/30">
        <button className="group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition-all duration-300 hover:bg-destructive/10 hover:text-destructive">
          <LogOut className="h-[18px] w-[18px] transition-transform duration-300 group-hover:-translate-x-0.5" />
          Logout
        </button>
      </div>
    </div>
  )
}

function NavItem({ href, icon, label, active = false }: { href: string; icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
        active 
          ? "bg-primary/15 text-primary border border-primary/20 shadow-lg shadow-primary/5" 
          : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground border border-transparent"
      }`}
    >
      {/* Active indicator glow */}
      {active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-full shadow-[0_0_10px_var(--primary)]" />
      )}
      <span className={`transition-transform duration-300 ${active ? "text-primary" : "group-hover:scale-110"}`}>
        {icon}
      </span>
      <span className="relative">
        {label}
        {active && (
          <span className="absolute -bottom-0.5 left-0 w-full h-px bg-gradient-to-r from-primary/50 to-transparent" />
        )}
      </span>
    </Link>
  )
}
