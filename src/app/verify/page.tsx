"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShieldCheck, Loader2, Fingerprint } from "lucide-react"

export default function VerifyPage() {
  const [loading, setLoading] = useState(false)
  const [verified, setVerified] = useState(false)
  const [inputId, setInputId] = useState("")

  const handleVerify = () => {
    if (!inputId) {
      return
    }

    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setVerified(true)
    }, 1500)
  }

  return (
    <div className="mx-auto max-w-4xl space-y-12 p-8 pt-12 animate-fade-in">
      <div className="space-y-6 text-center">
        <div className="mx-auto relative">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150" />
          <div className="relative flex h-20 w-20 mx-auto items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 shadow-xl shadow-primary/20">
            <Fingerprint className="h-10 w-10 text-primary" />
          </div>
        </div>
        <div className="space-y-3">
          <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            Identity Verification
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            Secure Mock-Chain Validation Node: active-04
          </p>
        </div>
      </div>

      <Card className="glass-card-elevated">
        <CardContent className="space-y-8 pt-8 pb-8 text-center">
          <p className="mx-auto max-w-md text-sm text-muted-foreground leading-relaxed">
            Input a tourist secure digital ID to verify its cryptographic integrity against the mock blockchain ledger.
          </p>
          <div className="mx-auto flex max-w-lg gap-4">
            <input
              value={inputId}
              onChange={(event) => setInputId(event.target.value)}
              placeholder="Paste Tourist ID (e.g. TX-XYZ...)"
              className="h-12 flex-1 rounded-xl border border-border/50 bg-secondary/30 backdrop-blur-xl px-5 font-mono text-sm outline-none transition-all duration-300 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 hover:bg-secondary/50"
            />
            <Button 
              disabled={loading || !inputId} 
              onClick={handleVerify} 
              className="h-12 px-6 rounded-xl font-semibold"
            >
              {loading ? <Loader2 className="animate-spin mr-2" /> : <ShieldCheck className="mr-2 h-5 w-5" />}
              {loading ? "Verifying..." : "Verify ID"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {verified && (
        <div className="animate-slide-up">
          <div className="relative overflow-hidden glass-card-elevated rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 p-8">
            <div className="absolute right-0 top-0 p-6 opacity-5">
              <ShieldCheck size={140} className="text-emerald-500" />
            </div>

            <div className="relative z-10 flex items-start gap-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-xl shadow-emerald-500/30">
                <ShieldCheck className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-emerald-400">Match Confirmed</h3>
                  <p className="text-xs text-muted-foreground">
                    Secure blockchain integrity check successful
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 p-4 rounded-xl bg-secondary/30 backdrop-blur-xl border border-border/30">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                      System Hash (Mock-Chain)
                    </p>
                    <p className="truncate rounded-lg bg-background/50 p-3 font-mono text-xs text-foreground/80">
                      SHA256: 4f1a23b9d0e8c7f6e5...f4c3b2a1
                    </p>
                  </div>
                  <div className="space-y-2 p-4 rounded-xl bg-secondary/30 backdrop-blur-xl border border-border/30">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                      Passport Hash (Physical)
                    </p>
                    <p className="truncate rounded-lg bg-background/50 p-3 font-mono text-xs text-foreground/80">
                      0x7f6e5d4c3b2a1...9c8b7a6e5d4
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-4">
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-4 py-1.5 font-mono text-xs text-emerald-400 font-medium">
                    ENCRYPTED
                  </span>
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-4 py-1.5 font-mono text-xs text-emerald-400 font-medium">
                    NON-MUTABLE
                  </span>
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-4 py-1.5 font-mono text-xs text-emerald-400 font-medium">
                    TIMESTAMPED
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
