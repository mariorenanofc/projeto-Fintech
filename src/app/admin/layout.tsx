import React from "react";
import { redirect } from "next/navigation";
import { checkAdminAccess } from "@/actions/admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdmin } = await checkAdminAccess();

  if (!isAdmin) {
    // Redireciona o usuário comum de volta para o Dashboard com mensagem de acesso negado
    redirect("/dashboard?error=access_denied");
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {children}
    </div>
  );
}
