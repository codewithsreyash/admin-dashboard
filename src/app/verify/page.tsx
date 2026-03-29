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
    <div className="mx-auto max-w-4xl space-y-12 p-8 animate-in slide-in-from-bottom duration-500">
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Fingerprint className="h-10 w-10 text-primary" />
        </div>
        <div className="space-y-1">
          <h2 className="text-4xl font-black uppercase italic tracking-tighter">Identity Verification Portal</h2>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
            Secure Mock-Chain Validation Node: active-04
          </p>
        </div>
      </div>

      <Card className="border-primary/20 bg-muted/5 shadow-2xl">
        <CardContent className="space-y-6 pt-6 text-center">
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            Input a tourist secure digital ID to verify its cryptographic integrity against the mock blockchain ledger.
          </p>
          <div className="mx-auto flex max-w-lg gap-4">
            <input
              value={inputId}
              onChange={(event) => setInputId(event.target.value)}
              placeholder="Paste Tourist ID (e.g. TX-XYZ...)"
              className="h-10 flex-1 rounded-lg border-2 border-primary/20 bg-background px-4 font-mono text-sm outline-none transition-all focus:border-primary"
            />
            <Button disabled={loading || !inputId} onClick={handleVerify} className="h-10 font-bold uppercase tracking-wider">
              {loading ? <Loader2 className="animate-spin" /> : <ShieldCheck className="mr-2 h-5 w-5" />}
              {loading ? "Decrypting..." : "Verify ID"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {verified && (
        <div className="animate-in zoom-in duration-300">
          <div className="relative overflow-hidden rounded-2xl border-2 border-green-500/30 bg-green-500/10 p-8">
            <div className="absolute right-0 top-0 p-4 opacity-10">
              <ShieldCheck size={120} className="text-green-500" />
            </div>

            <div className="relative z-10 flex items-start gap-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500 shadow-[0_0_30px_rgba(34,197,94,0.4)]">
                <ShieldCheck className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1 space-y-6">
                <div>
                  <h3 className="text-2xl font-black uppercase italic text-green-500">Match Confirmed</h3>
                  <p className="text-xs font-bold uppercase italic tracking-widest text-muted-foreground">
                    Secure blockchain integrity check successful
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      System Hash (Mock-Chain)
                    </p>
                    <p className="truncate rounded bg-background/50 p-2 font-mono text-xs">
                      SHA256: 4f1a23b9d0e8c7f6e5...f4c3b2a1
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Passport Hash (Physical)
                    </p>
                    <p className="truncate rounded bg-background/50 p-2 font-mono text-xs">
                      0x7f6e5d4c3b2a1...9c8b7a6e5d4
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-4 text-xs font-bold text-muted-foreground">
                  <span className="rounded-full border border-green-500/30 bg-green-500/20 px-3 py-1 font-mono text-green-500">
                    ENCRYPTED
                  </span>
                  <span className="rounded-full border border-green-500/30 bg-green-500/20 px-3 py-1 font-mono text-green-500">
                    NON-MUTABLE
                  </span>
                  <span className="rounded-full border border-green-500/30 bg-green-500/20 px-3 py-1 font-mono text-green-500">
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
