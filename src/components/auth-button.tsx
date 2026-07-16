"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function AuthButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      const supabase = createClient();
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
            include_granted_scopes: "true", // Resolve o aviso de "Autorização Incremental" do Google
          },
          scopes: "https://www.googleapis.com/auth/calendar.events",
        },
      });

      if (error) throw error;
    } catch (err) {
      console.error("Erro ao iniciar login com Google OAuth:", err);
      toast.error("Falha ao iniciar autenticação com o Google. Verifique o console.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleGoogleLogin}
      disabled={isLoading}
      className="relative w-full max-w-xs h-12 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 hover:text-yellow-300 font-extrabold text-xs uppercase tracking-wider border border-yellow-500/30 hover:border-yellow-400/80 shadow-[0_4px_12px_rgba(234,179,8,0.1)] hover:shadow-[0_0_20px_rgba(234,179,8,0.25)] rounded-xl transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] flex items-center justify-center gap-3 px-6"
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin text-yellow-400" />
      ) : (
        /* Ícone oficial e colorido do Google em alta fidelidade */
        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
        </svg>
      )}
      Conectar com o Google
    </Button>
  );
}
