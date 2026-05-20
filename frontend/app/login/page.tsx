"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { loginAction } from "@/features/auth/actions";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, isPending] = useActionState(loginAction, null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (state?.success) {
      router.push("/dashboard");
    }
  }, [state, router]);

  const autofillAdmin = () => {
    setEmail("admin@govmind.local");
    setPassword("admin123");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Dynamic Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-accent/15 blur-[120px] animate-pulse" 
          style={{ animationDuration: '8s' }} 
        />
        <div 
          className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-positive/10 blur-[120px] animate-pulse" 
          style={{ animationDuration: '10s' }} 
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="glass-card p-8 shadow-2xl relative border border-card-border/80 backdrop-blur-xl">
          {/* Top subtle glow bar */}
          <div className="absolute top-0 inset-x-0 h-[2px] gradient-accent rounded-t-2xl" />

          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl gradient-accent flex items-center justify-center mb-4 shadow-xl shadow-accent/20 border border-white/10 hover:scale-105 transition-smooth cursor-pointer">
              <Activity className="w-7 h-7 text-white animate-pulse" />
            </div>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">GOVMIND</h1>
            <p className="text-sm text-muted mt-1">Sentimen Warga Command Center</p>
          </div>

          {state?.error && (
            <div className="mb-6 p-4 rounded-xl bg-negative/10 border border-negative/25 text-negative text-sm flex items-start gap-3 animate-fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-negative" />
              <span>{state.error}</span>
            </div>
          )}

          <form action={formAction} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted/80">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/60" />
                <input 
                  type="email" 
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@govmind.local"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-background/40 border border-card-border text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/40 transition-smooth backdrop-blur-md"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted/80">Password</label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/60" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-11 py-3 rounded-xl bg-background/40 border border-card-border text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/40 transition-smooth backdrop-blur-md"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted/60 hover:text-muted transition-smooth"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button 
                type="submit"
                disabled={isPending}
                className="w-full py-3 rounded-xl gradient-accent text-white text-sm font-semibold hover:opacity-95 transition-smooth shadow-lg shadow-accent/25 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Memverifikasi...
                  </>
                ) : (
                  "Masuk Sistem"
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Autofill section */}
          <div className="mt-8 pt-6 border-t border-card-border/50 text-center">
            <button
              onClick={autofillAdmin}
              type="button"
              className="text-xs text-accent hover:text-accent-hover font-medium underline transition-smooth"
            >
              Autofill Super Admin Credentials (Demo)
            </button>
            <p className="text-[10px] text-muted/50 mt-2">
              Keamanan Terjamin • Password terenkripsi penuh via Bcrypt
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
