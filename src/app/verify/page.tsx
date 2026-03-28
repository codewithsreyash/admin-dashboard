"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShieldCheck, Loader2, Fingerprint, Search } from "lucide-react"

export default function VerifyPage() {
  const [loading, setLoading] = useState(false)
  const [verified, setVerified] = useState(false)
  const [inputId, setInputId] = useState("")

  const handleVerify = () => {
    if (!inputId) return
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setVerified(true)
    }, 1500)
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-12 animate-in slide-in-from-bottom duration-500">
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <Fingerprint className="w-10 h-10 text-primary" />
        </div>
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tighter uppercase italic">Identity Verification Portal</h2>
          <p className="text-muted-foreground uppercase tracking-[0.3em] text-[10px] font-bold">Secure Mock-Chain Validation Node: active-04</p>
        </div>
      </div>

      <Card className="shadow-2xl border-primary/20 bg-muted/5">
        <CardContent className="pt-6 text-center space-y-6">
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Input a Tourist's Secure Digital ID to verify its cryptographic integrity against the mock blockchain ledger.
          </p>
          <div className="flex gap-4 max-w-lg mx-auto">
            <input 
              value={inputId}
              onChange={(e) => setInputId(e.target.value)}
              placeholder="Paste Tourist ID (e.g. TX-XYZ...)"
              className="flex-1 bg-background h-10 border-2 border-primary/20 rounded-lg px-4 font-mono text-sm focus:border-primary outline-none transition-all"
            />
            <Button disabled={loading || !inputId} onClick={handleVerify} className="font-bold h-10 uppercase tracking-wider">
              {loading ? <Loader2 className="animate-spin" /> : <ShieldCheck className="mr-2 h-5 w-5" />}
              {loading ? "Decrypting..." : "Verify ID"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {verified && (
        <div className="animate-in zoom-in duration-300">
          <div className="bg-green-500/10 border-2 border-green-500/30 rounded-2xl p-8 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
               <ShieldCheck size={120} className="text-green-500" />
             </div>
             
             <div className="flex items-start gap-6 relative z-10">
               <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.4)]">
                 <ShieldCheck className="w-8 h-8 text-white" />
               </div>
               <div className="space-y-6 flex-1">
                 <div>
                   <h3 className="text-2xl font-black text-green-500 uppercase italic">MATCH CONFIRMED ✅</h3>
                   <p className="text-xs text-muted-foreground font-bold tracking-widest uppercase italic">Secure Blockchain Integrity Check Successful</p>
                 </div>

                 <div className="grid gap-4 md:grid-cols-2">
                   <div className="space-y-1">
                     <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">System Hash (Mock-Chain)</p>
                     <p className="text-xs font-mono bg-background/50 p-2 rounded truncate">SHA256: 4f1a23b9d0e8c7f6e5...f4c3b2a1</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Passport Hash (Physical)</p>
                      <p className="text-xs font-mono bg-background/50 p-2 rounded truncate">0x7f6e5d4c3b2a1...9c8b7a6e5d4</p>
                   </div>
                 </div>

                 <div className="pt-4 flex items-center gap-4 text-xs font-bold text-muted-foreground">
                   <span className="bg-green-500/20 text-green-500 px-3 py-1 rounded-full border border-green-500/30 font-mono">ENCRYPTED</span>
                   <span className="bg-green-500/20 text-green-500 px-3 py-1 rounded-full border border-green-500/30 font-mono">NON-MUTABLE</span>
                   <span className="bg-green-500/20 text-green-500 px-3 py-1 rounded-full border border-green-500/30 font-mono">TIMESTAMPED</span>
                 </div>
               </div>
             </div>
          </div>
        </div>
      )}
    </div>
  )
}
