import Link from "next/link";
import { Activity, Mail, Lock } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-accent/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-positive/10 blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="glass-card p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-2xl gradient-accent flex items-center justify-center mb-4 shadow-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">GOVMIND</h1>
            <p className="text-sm text-muted">Sentimen Warga Command Center</p>
          </div>

          <form className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/60" />
                <input 
                  type="email" 
                  placeholder="admin@govmind.local"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background/50 border border-card-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent/50 transition-smooth"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/60" />
                <input 
                  type="password" 
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background/50 border border-card-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent/50 transition-smooth"
                />
              </div>
            </div>

            <div className="pt-2">
              <Link href="/dashboard" className="block">
                <button 
                  type="button"
                  className="w-full py-2.5 rounded-xl gradient-accent text-white text-sm font-medium hover:opacity-90 transition-smooth shadow-lg shadow-accent/20"
                >
                  Masuk Dashboard
                </button>
              </Link>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-muted">
              Prototype Version • Bypass login untuk demo
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
