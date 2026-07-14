"use client";

import { useEffect } from "react";

export function PWAProvider() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator
    ) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker registrado com sucesso (PWA):", registration.scope);
        })
        .catch((error) => {
          console.error("Erro ao registrar o Service Worker (PWA):", error);
        });
    }
  }, []);

  return null;
}
