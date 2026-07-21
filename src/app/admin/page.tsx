"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  Users, 
  Receipt, 
  FileText, 
  ArrowLeft, 
  Search, 
  Calendar as CalendarIcon, 
  UserCheck, 
  Lock, 
  RefreshCw,
  Activity,
  User
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  getAdminMetrics, 
  getAuditLogs, 
  getAdminUsersList, 
  logImpersonationAttempt, 
  AuditLogItem 
} from "@/actions/admin";

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"audit" | "users">("audit");
  
  // Métricas
  const [metrics, setMetrics] = useState({
    totalFamilyGroups: 0,
    totalTransactions: 0,
    totalProfiles: 0,
    totalAuditLogs: 0
  });

  // Logs de Auditoria
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Lista de Usuários
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      fetchMetrics(),
      fetchAuditLogs(),
      fetchUsers()
    ]);
    setLoading(false);
  };

  const fetchMetrics = async () => {
    const res = await getAdminMetrics();
    if (res.success && res.metrics) {
      setMetrics(res.metrics);
    } else if (res.error) {
      toast.error("Erro ao carregar métricas: " + res.error);
    }
  };

  const fetchAuditLogs = async () => {
    setLoadingLogs(true);
    const res = await getAuditLogs({
      search: searchTerm,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      limit: 100
    });

    if (res.success && res.data) {
      setAuditLogs(res.data);
    } else if (res.error) {
      toast.error("Erro ao buscar logs: " + res.error);
    }
    setLoadingLogs(false);
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    const res = await getAdminUsersList();
    if (res.success && res.data) {
      setUsersList(res.data);
    }
    setLoadingUsers(false);
  };

  const handleImpersonate = async (userItem: any) => {
    try {
      setImpersonatingId(userItem.id);
      const userName = userItem.full_name || userItem.email || "Usuário";
      const res = await logImpersonationAttempt(userItem.id, userName);

      if (res.success) {
        toast.info(res.message, { duration: 5000 });
        await fetchAuditLogs();
      } else {
        toast.error("Falha ao registrar simulação: " + res.error);
      }
    } finally {
      setImpersonatingId(null);
    }
  };

  const handleApplyLogFilters = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAuditLogs();
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto bg-zinc-950 flex flex-col min-h-screen px-4 py-6 md:px-8 md:py-10">
      
      {/* Header do Backoffice */}
      <header className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-8 pb-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 rounded-xl bg-zinc-900 border border-white/5 hover:border-yellow-500/20 text-zinc-400 hover:text-yellow-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-white sm:text-xl">Painel do Dono (Backoffice)</h1>
              <Badge className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[9px] font-extrabold uppercase">
                ADMIN MODE
              </Badge>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">Gestão central, integridade multi-tenant e auditoria imutável</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            onClick={loadData} 
            disabled={loading}
            className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/10 font-bold text-xs h-10 rounded-xl px-4 flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-400" : ""}`} />
            Atualizar Dados
          </Button>
        </div>
      </header>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-8">
        {/* Casais Cadastrados */}
        <Card className="bg-zinc-900/40 border-white/5 shadow-xl backdrop-blur-md">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Grupos Familiares</span>
              <span className="text-2xl font-black text-amber-400 mt-1 block">
                {loading ? "..." : metrics.totalFamilyGroups}
              </span>
              <span className="text-[9px] text-zinc-400 mt-0.5 block">Casais na plataforma</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Transações Ativas */}
        <Card className="bg-zinc-900/40 border-white/5 shadow-xl backdrop-blur-md">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Transações Ativas</span>
              <span className="text-2xl font-black text-emerald-400 mt-1 block">
                {loading ? "..." : metrics.totalTransactions}
              </span>
              <span className="text-[9px] text-zinc-400 mt-0.5 block">Registros financeiros no BD</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Receipt className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Total Usuários */}
        <Card className="bg-zinc-900/40 border-white/5 shadow-xl backdrop-blur-md">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Total de Usuários</span>
              <span className="text-2xl font-black text-zinc-200 mt-1 block">
                {loading ? "..." : metrics.totalProfiles}
              </span>
              <span className="text-[9px] text-zinc-400 mt-0.5 block">Perfis vinculados</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-white/5 flex items-center justify-center text-zinc-300">
              <UserCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Logs de Auditoria */}
        <Card className="bg-zinc-900/40 border-white/5 shadow-xl backdrop-blur-md">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Trilha de Auditoria</span>
              <span className="text-2xl font-black text-amber-300 mt-1 block">
                {loading ? "..." : metrics.totalAuditLogs}
              </span>
              <span className="text-[9px] text-zinc-400 mt-0.5 block">Eventos imutáveis gravados</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-300">
              <FileText className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navegação entre Módulos */}
      <div className="flex gap-2 mb-6 border-b border-white/5 pb-3">
        <Button
          onClick={() => setActiveTab("audit")}
          variant={activeTab === "audit" ? "default" : "outline"}
          className={`h-10 rounded-xl font-bold text-xs px-5 flex items-center gap-2 ${
            activeTab === "audit"
              ? "bg-amber-500 hover:bg-amber-400 text-zinc-950 border-none shadow-[0_0_15px_rgba(245,158,11,0.25)]"
              : "border-white/5 bg-zinc-900/50 text-zinc-400 hover:text-white"
          }`}
        >
          <FileText className="w-4 h-4" />
          Trilha de Auditoria (Audit Logs)
        </Button>
        
        <Button
          onClick={() => setActiveTab("users")}
          variant={activeTab === "users" ? "default" : "outline"}
          className={`h-10 rounded-xl font-bold text-xs px-5 flex items-center gap-2 ${
            activeTab === "users"
              ? "bg-amber-500 hover:bg-amber-400 text-zinc-950 border-none shadow-[0_0_15px_rgba(245,158,11,0.25)]"
              : "border-white/5 bg-zinc-900/50 text-zinc-400 hover:text-white"
          }`}
        >
          <Users className="w-4 h-4" />
          Gestão de Usuários & Simulação (Impersonation)
        </Button>
      </div>

      {/* CONTEÚDO TAB 1: LOGS DE AUDITORIA */}
      {activeTab === "audit" && (
        <Card className="bg-zinc-900/40 border-white/5 shadow-xl backdrop-blur-md">
          <CardHeader className="p-6 pb-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-center">
              <div>
                <CardTitle className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-5 h-5 text-amber-400" />
                  Registros de Auditoria Imutáveis
                </CardTitle>
                <CardDescription className="text-xs text-zinc-400 mt-1">
                  Exibindo requisições e ações críticas auditadas no PostgreSQL. Impossível deletar ou alterar via API.
                </CardDescription>
              </div>

              {/* Filtros de Busca */}
              <form onSubmit={handleApplyLogFilters} className="flex flex-wrap gap-2 items-center">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Filtrar por Usuário, Ação ou Metadata..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="bg-zinc-950 border border-white/10 rounded-xl text-zinc-200 text-xs pl-9 pr-3 py-2 focus:border-amber-500/50 focus:outline-none w-56 sm:w-72"
                  />
                </div>

                <div className="flex items-center gap-1">
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="bg-zinc-950 border border-white/10 rounded-xl text-zinc-300 text-xs px-2.5 py-1.5 focus:outline-none [color-scheme:dark]"
                    title="Data Inicial"
                  />
                  <span className="text-zinc-500 text-xs">-</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="bg-zinc-950 border border-white/10 rounded-xl text-zinc-300 text-xs px-2.5 py-1.5 focus:outline-none [color-scheme:dark]"
                    title="Data Final"
                  />
                </div>

                <Button type="submit" className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs h-9 rounded-xl font-bold px-3">
                  Filtrar
                </Button>
              </form>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="overflow-x-auto rounded-xl border border-white/5">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950 text-zinc-400 uppercase text-[9px] font-extrabold tracking-wider border-b border-white/5">
                  <tr>
                    <th className="p-3.5">Data/Hora</th>
                    <th className="p-3.5">Executado por</th>
                    <th className="p-3.5">Ação</th>
                    <th className="p-3.5">Alvo (Target ID)</th>
                    <th className="p-3.5">Metadata / Snapshot</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loadingLogs ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-zinc-500 animate-pulse uppercase tracking-wider font-bold">
                        Buscando registros de auditoria...
                      </td>
                    </tr>
                  ) : auditLogs.length > 0 ? (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-zinc-900/60 transition-colors">
                        <td className="p-3.5 text-zinc-400 font-mono text-[11px] whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString("pt-BR")}
                        </td>
                        <td className="p-3.5">
                          {log.performer_profile ? (
                            <div>
                              <span className="font-bold text-zinc-200 block">{log.performer_profile.full_name}</span>
                              <span className="text-[10px] text-zinc-500 block">{log.performer_profile.email}</span>
                            </div>
                          ) : (
                            <span className="text-zinc-500 font-mono text-[10px]">{log.performed_by || "Sistema / Anon"}</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <Badge className={`font-mono text-[9px] uppercase font-bold py-0.5 px-2 ${
                            log.action === "TRANSACTION_DELETED"
                              ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                              : log.action.includes("IMPERSONATION")
                              ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                              : "bg-zinc-800 text-zinc-300 border-white/10"
                          }`}>
                            {log.action}
                          </Badge>
                        </td>
                        <td className="p-3.5 text-zinc-400 font-mono text-[10px]">
                          {log.target_user_id || "-"}
                        </td>
                        <td className="p-3.5">
                          <pre className="text-[10px] text-zinc-400 font-mono bg-zinc-950/80 p-2 rounded-lg border border-white/5 max-w-xs md:max-w-md overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-zinc-500">
                        Nenhum registro de auditoria encontrado para os filtros selecionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CONTEÚDO TAB 2: GESTÃO DE USUÁRIOS E IMPERSONATION */}
      {activeTab === "users" && (
        <Card className="bg-zinc-900/40 border-white/5 shadow-xl backdrop-blur-md">
          <CardHeader className="p-6 pb-4">
            <CardTitle className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-amber-400" />
              Base de Usuários do Sistema
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400 mt-1">
              Visualize os membros ativos e simule a visualização de conta para suporte ao cliente (ação totalmente auditada).
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="overflow-x-auto rounded-xl border border-white/5">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950 text-zinc-400 uppercase text-[9px] font-extrabold tracking-wider border-b border-white/5">
                  <tr>
                    <th className="p-3.5">Usuário</th>
                    <th className="p-3.5">E-mail</th>
                    <th className="p-3.5">Grupo Familiar</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Data Cadastro</th>
                    <th className="p-3.5 text-right">Ação de Suporte</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loadingUsers ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-zinc-500 animate-pulse uppercase tracking-wider font-bold">
                        Carregando lista de usuários...
                      </td>
                    </tr>
                  ) : usersList.length > 0 ? (
                    usersList.map((userItem) => (
                      <tr key={userItem.id} className="hover:bg-zinc-900/60 transition-colors">
                        <td className="p-3.5 font-bold text-zinc-200 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-xs">
                            {userItem.avatar_url ? (
                              <img src={userItem.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <User className="w-3.5 h-3.5 text-zinc-400" />
                            )}
                          </div>
                          {userItem.full_name || "Usuário sem nome"}
                        </td>
                        <td className="p-3.5 text-zinc-400 font-mono text-[11px]">{userItem.email || "-"}</td>
                        <td className="p-3.5 text-zinc-300">
                          {userItem.family_groups?.name || "Grupo Padrão"}
                        </td>
                        <td className="p-3.5">
                          <Badge className={`text-[9px] uppercase font-bold py-0.5 px-2 ${
                            userItem.role === "admin" 
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/40" 
                              : "bg-zinc-800 text-zinc-400 border-white/5"
                          }`}>
                            {userItem.role || "user"}
                          </Badge>
                        </td>
                        <td className="p-3.5 text-zinc-500 text-[11px]">
                          {new Date(userItem.created_at).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="p-3.5 text-right">
                          <Button
                            onClick={() => handleImpersonate(userItem)}
                            disabled={impersonatingId === userItem.id}
                            className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-[10px] h-8 rounded-lg px-3 transition-all"
                          >
                            {impersonatingId === userItem.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                            ) : (
                              <UserCheck className="w-3.5 h-3.5 mr-1" />
                            )}
                            Logar como
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-zinc-500">
                        Nenhum usuário encontrado na base de dados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
