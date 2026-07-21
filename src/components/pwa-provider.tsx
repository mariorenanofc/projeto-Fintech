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
          
          // Solicita permissão para Notificações caso ainda não tenha sido decidida
          if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission().then((permission) => {
              if (permission === "granted") {
                console.log("Permissão de notificações concedida para Fintech Casal!");
              }
            });
          }
        })
        .catch((error) => {
          console.error("Erro ao registrar o Service Worker (PWA):", error);
        });
    }
  }, []);

  return null;
}
