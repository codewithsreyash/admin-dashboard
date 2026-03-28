"use client"
import Link from "next/link"
import { ShieldAlert, BarChart3, Fingerprint, Map, Users, Settings, LogOut, Home } from "lucide-react"
import { usePathname } from "next/navigation"

export function Sidebar() {
  const pathname = usePathname()
  
  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card px-4 py-8">
      <div className="flex items-center gap-2 mb-10 px-2">
        <ShieldAlert className="h-8 w-8 text-destructive" />
        <h1 className="text-xl font-bold tracking-tight">SafeGuard<span className="text-primary">.io</span></h1>
      </div>
      
      <nav className="flex-1 space-y-2">
        <NavItem href="/" icon={<Home className="h-5 w-5" />} label="Dashboard" active={pathname === "/"} />
        <NavItem href="/analytics" icon={<BarChart3 className="h-5 w-5" />} label="Analytics & Trends" active={pathname === "/analytics"} />
        <NavItem href="/verify" icon={<Fingerprint className="h-5 w-5" />} label="Verify Tourist ID" active={pathname === "/verify"} />
        <div className="pt-4 pb-2 px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Fleet Management</div>
        <NavItem href="/map" icon={<Map className="h-5 w-5" />} label="Live Map" active={pathname === "/map"} />
        <NavItem href="/tourists" icon={<Users className="h-5 w-5" />} label="Tourists" active={pathname === "/tourists"} />
      </nav>

      <div className="mt-auto">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
          <LogOut className="h-5 w-5" />
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
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      }`}
    >
      {icon}
      {label}
    </Link>
  )
}
