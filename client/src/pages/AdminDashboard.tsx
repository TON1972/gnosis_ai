import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { APP_LOGO, APP_TITLE } from "@/const";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  Users,
  DollarSign,
  AlertTriangle,
  Home,
  LogOut,
  Calendar,
  Mail,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import AdminManagement from "@/components/AdminManagement";

export default function AdminDashboard() {
  const { user, loading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedStartDate, setSelectedStartDate] = useState("");
  const [selectedEndDate, setSelectedEndDate] = useState("");

  // Temporarily disabled role check for debugging
  // useEffect(() => {
  //   if (loading) return;
  //   if (!user) {
  //     toast.error("Você precisa fazer login.");
  //     setLocation("/");
  //     return;
  //   }
  //   if (user.role !== "admin" && user.role !== "super_admin") {
  //     toast.error("Acesso negado. Apenas administradores podem acessar esta página.");
  //     setLocation("/dashboard");
  //   }
  // }, [user, loading, setLocation]);

  // Check if user is super admin
  const isSuperAdmin = user?.role === 'super_admin';

  // Queries with auto-refresh every minute
  const { data: userStats, refetch: refetchUserStats } = trpc.admin.userStats.useQuery(undefined, {
    refetchInterval: 60000,
  });

  const { data: financialCalendar, refetch: refetchFinancial } = trpc.admin.financialCalendar.useQuery(undefined, {
    refetchInterval: 60000,
  });

  // Refresh session mutation
  const refreshSession = trpc.auth.refreshSession.useMutation({
    onSuccess: (freshUser) => {
      toast.success('Sessão atualizada com sucesso!');
      console.log('Fresh user data:', freshUser);
      // Force page reload to update context
      window.location.reload();
    },
    onError: (error) => {
      toast.error('Erro ao atualizar sessão: ' + error.message);
    },
  });

  // Altere esta parte no seu AdminDashboard.tsx
  const { data: delinquentUsers, refetch: refetchDelinquent } = trpc.admin.delinquentUsers.useQuery(
    // Criamos um objeto que sempre existe para satisfazer o TS, 
    // mas com valores que podem ser undefined
    { 
      startDate: selectedStartDate || undefined, 
      endDate: selectedEndDate || undefined 
    },
    {
      refetchInterval: 60000,
      // Opcional: só executa a busca se as duas datas estiverem preenchidas
      // enabled: !!selectedStartDate && !!selectedEndDate 
    }
  );

  const handleRefreshAll = () => {
    refetchUserStats();
    refetchFinancial();
    refetchDelinquent();
    toast.success("Dados atualizados!");
  };

  const handleSendEmailToAll = () => {
    toast.info("Funcionalidade de envio de email será implementada em breve.");
  };

  const handleSendEmailByDate = () => {
    if (!selectedStartDate || !selectedEndDate) {
      toast.error("Selecione as datas de início e fim.");
      return;
    }
    toast.info(`Enviar emails para inadimplentes entre ${selectedStartDate} e ${selectedEndDate}`);
  };

  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return (
      <div className="min-h-screen bg-gradient-radial from-[#d4af37] via-[#DAA520] to-[#FFFACD] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-[#1e3a5f] mb-4">Acesso Negado</h1>
          <p className="text-lg text-[#8b6f47] mb-6">
            Apenas administradores podem acessar esta página.
          </p>
          <Link href="/dashboard">
            <span className="text-[#d4af37] hover:underline cursor-pointer">
              Voltar ao Dashboard
            </span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-radial from-[#d4af37] via-[#DAA520] to-[#FFFACD]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#1e3a5f] shadow-lg border-b-4 border-[#d4af37]">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link href="/">
              <span className="flex items-center gap-4 cursor-pointer">
                <img src={APP_LOGO} alt={APP_TITLE} className="h-16 w-16 object-contain" loading="lazy" />
                <div>
                  {/* Título completo para desktop */}
                  <h1 className="hidden md:block text-3xl font-bold text-[#d4af37]">{APP_TITLE}</h1>
                  {/* Título curto para mobile */}
                  <h1 className="block md:hidden text-3xl font-bold text-[#d4af37]">GNOSIS AI</h1>
                  <p className="text-sm text-[#d4af37]/70">Painel Administrativo</p>
                </div>
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Button
                onClick={handleRefreshAll}
                variant="outline"
                className="border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-[#1e3a5f]"
                size="sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
              <Link href="/admin/tickets">
                <Button
                  variant="outline"
                  className="border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-[#1e3a5f]"
                  size="sm"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Sistema de Tickets
                </Button>
              </Link>
              <Link href="/">
                <span className="flex items-center gap-2 px-6 py-3 bg-[#d4af37] text-[#1e3a5f] rounded-lg font-semibold hover:bg-[#B8860B] transition-colors cursor-pointer">
                  <Home className="w-5 h-5" />
                  Voltar ao Início
                </span>
              </Link>
              <Button 
                variant="default" 
                onClick={() => refreshSession.mutate()}
                disabled={refreshSession.isPending}
                className="bg-[#d4af37] text-[#1e3a5f] hover:bg-[#b8941f]"
                size="sm"
              >
                {refreshSession.isPending ? 'Atualizando...' : 'Atualizar Sessão'}
              </Button>
              <Button
                onClick={() => {
                  logout();
                  setLocation("/");
                }}
                variant="outline"
                className="border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-[#1e3a5f]"
                size="sm"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* User Statistics */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-white/90 border-4 border-[#d4af37]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#8b6f47] font-semibold">Total de Usuários</p>
                <p className="text-4xl font-bold text-[#1e3a5f]">
                  {userStats?.totalUsers || 0}
                </p>
              </div>
              <Users className="w-12 h-12 text-[#d4af37]" />
            </div>
          </Card>

          <Card className="p-6 bg-white/90 border-4 border-[#d4af37]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#8b6f47] font-semibold">Usuários FREE</p>
                <p className="text-4xl font-bold text-[#1e3a5f]">
                  {userStats?.freeUsers || 0}
                </p>
              </div>
              <Users className="w-12 h-12 text-blue-500" />
            </div>
          </Card>

          <Card className="p-6 bg-white/90 border-4 border-[#d4af37]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#8b6f47] font-semibold">Usuários Pagos</p>
                <p className="text-4xl font-bold text-[#1e3a5f]">
                  {userStats?.paidUsers || 0}
                </p>
              </div>
              <DollarSign className="w-12 h-12 text-green-600" />
            </div>
          </Card>
        </div>

        {/* Financial Calendar */}
        <Card className="p-6 bg-white/90 border-4 border-[#d4af37] mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="w-6 h-6 text-[#d4af37]" />
            <h2 className="text-2xl font-bold text-[#1e3a5f]">
              Calendário Financeiro - {new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
            </h2>
          </div>

          {financialCalendar && financialCalendar.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-[#d4af37]">
                    <th className="text-left py-3 px-4 text-[#1e3a5f] font-bold">Data</th>
                    <th className="text-left py-3 px-4 text-[#1e3a5f] font-bold">Assinaturas Vencendo</th>
                    <th className="text-left py-3 px-4 text-[#1e3a5f] font-bold">Valor Total</th>
                  </tr>
                </thead>
                <tbody>
                  {financialCalendar.map((day) => (
                    <tr key={day.date} className="border-b border-[#d4af37]/30 hover:bg-[#FFFACD]/50">
                      <td className="py-3 px-4 text-[#1e3a5f]">
                        {new Date(day.date).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="py-3 px-4 text-[#1e3a5f] font-semibold">
                        {day.subscriptionsExpiring}
                      </td>
                      <td className="py-3 px-4 text-green-600 font-bold">
                        R$ {day.totalValue.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-[#d4af37]/20 font-bold">
                    <td className="py-3 px-4 text-[#1e3a5f]">TOTAL DO MÊS</td>
                    <td className="py-3 px-4 text-[#1e3a5f]">
                      {financialCalendar.reduce((sum, day) => sum + day.subscriptionsExpiring, 0)}
                    </td>
                    <td className="py-3 px-4 text-green-600">
                      R$ {financialCalendar.reduce((sum, day) => sum + day.totalValue, 0).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-[#8b6f47] py-8">
              Nenhum vencimento previsto para este mês.
            </p>
          )}
        </Card>

        {/* Admin Management (Super Admin Only) */}
        {isSuperAdmin && (
          <Card className="p-6 bg-white/90 border-4 border-[#d4af37] mb-8">
            <h2 className="text-2xl font-bold text-[#1e3a5f] mb-6">Gerenciamento de Administradores</h2>
            <AdminManagement />
          </Card>
        )}

        {/* Delinquent Users */}
        <Card className="p-6 bg-white/90 border-4 border-[#d4af37]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h2 className="text-2xl font-bold text-[#1e3a5f]">Usuários Inadimplentes</h2>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSendEmailToAll}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                <Mail className="w-4 h-4 mr-2" />
                Enviar para Todos
              </Button>
            </div>
          </div>

          {/* Date Filter */}
          <div className="flex gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-[#1e3a5f] mb-2">
                Data Início
              </label>
              <input
                type="date"
                value={selectedStartDate}
                onChange={(e) => setSelectedStartDate(e.target.value)}
                className="border-2 border-[#d4af37] rounded-lg px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#1e3a5f] mb-2">
                Data Fim
              </label>
              <input
                type="date"
                value={selectedEndDate}
                onChange={(e) => setSelectedEndDate(e.target.value)}
                className="border-2 border-[#d4af37] rounded-lg px-4 py-2"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleSendEmailByDate}
                className="bg-[#1e3a5f] text-[#d4af37] hover:bg-[#2a4a7f]"
              >
                <Mail className="w-4 h-4 mr-2" />
                Enviar por Data
              </Button>
            </div>
          </div>

          {delinquentUsers && delinquentUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-[#d4af37]">
                    <th className="text-left py-3 px-4 text-[#1e3a5f] font-bold">Nome</th>
                    <th className="text-left py-3 px-4 text-[#1e3a5f] font-bold">Email</th>
                    <th className="text-left py-3 px-4 text-[#1e3a5f] font-bold">Plano</th>
                    <th className="text-left py-3 px-4 text-[#1e3a5f] font-bold">Vencimento</th>
                    <th className="text-left py-3 px-4 text-[#1e3a5f] font-bold">Dias em Atraso</th>
                    <th className="text-left py-3 px-4 text-[#1e3a5f] font-bold">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {delinquentUsers.map((user) => (
                    <tr key={user.userId} className="border-b border-[#d4af37]/30 hover:bg-[#FFFACD]/50">
                      <td className="py-3 px-4 text-[#1e3a5f]">{user.userName}</td>
                      <td className="py-3 px-4 text-[#1e3a5f]">{user.userEmail}</td>
                      <td className="py-3 px-4 text-[#1e3a5f] font-semibold">{user.planName}</td>
                      <td className="py-3 px-4 text-[#1e3a5f]">
                        {new Date(user.nextBillingDate).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="py-3 px-4 text-red-600 font-bold">{user.daysOverdue} dias</td>
                      <td className="py-3 px-4 text-green-600 font-semibold">
                        R$ {user.subscriptionValue.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-[#8b6f47] py-8">
              Nenhum usuário inadimplente no momento. 🎉
            </p>
          )}
        </Card>

        {/* Support Requests Panel */}
        <SupportRequestsPanel />
      </div>
    </div>
  );
}

// Support Requests Panel Component
function SupportRequestsPanel() {
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'contacted' | 'resolved'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<'all' | 'tecnico' | 'financeiro' | 'comercial' | 'outros'>('all');
  const [showArchived, setShowArchived] = useState(false);

  const { data: supportRequests, refetch } = trpc.admin.supportRequests.useQuery(
    { status: statusFilter, department: departmentFilter },
    { refetchInterval: 30000 }
  );

  const { data: admins } = trpc.admin.listAdminsForAssignment.useQuery();

  const updateStatusMutation = trpc.admin.updateSupportStatus.useMutation({
    onSuccess: () => {
      toast.success('Status atualizado com sucesso!');
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar status: ${error.message}`);
    },
  });

  const archiveMutation = trpc.admin.archiveTicket.useMutation({
    onSuccess: () => {
      toast.success('📦 Ticket arquivado com sucesso!');
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao arquivar: ${error.message}`);
    },
  });

  const unarchiveMutation = trpc.admin.unarchiveTicket.useMutation({
    onSuccess: () => {
      toast.success('↩️ Ticket desarquivado com sucesso!');
      if (showArchived) setShowArchived(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao desarquivar: ${error.message}`);
    },
  });

  const assignMutation = trpc.admin.assignSupportRequest.useMutation({
    onSuccess: () => {
      toast.success('Solicitação atribuída com sucesso!');
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao atribuir: ${error.message}`);
    },
  });

  const handleStatusChange = (id: number, newStatus: 'pending' | 'contacted' | 'resolved') => {
    updateStatusMutation.mutate({ id, status: newStatus });
  };

  const handleAssign = (requestId: number, adminId: number | null) => {
    assignMutation.mutate({ requestId, adminId });
  };

  const getAdminName = (adminId: number | null) => {
    if (!adminId || !admins) return "Não atribuído";
    const admin = admins.find(a => a.id === adminId);
    return admin ? admin.name : "Desconhecido";
  };

  const deptNames = {
    tecnico: 'Suporte Técnico',
    financeiro: 'Financeiro',
    comercial: 'Comercial',
    outros: 'Outros Assuntos'
  };

  // Filtrar tickets arquivados
  const filteredRequests = supportRequests?.filter(req => 
    showArchived ? req.archived : !req.archived
  ) || [];

  const archivedCount = supportRequests?.filter(req => req.archived).length || 0;

  const statusNames: Record<string, string> = {
    pending: "Pendente",
    contacted: "Contatado",
    resolved: "Resolvido"
  };

  const statusColors: Record<string, string> = {
    pending: "text-yellow-600 bg-yellow-100",
    contacted: "text-blue-600 bg-blue-100",
    resolved: "text-green-600 bg-green-100"
  };

  return (
    <Card className="p-6 bg-white/90 border-4 border-[#d4af37] mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Mail className="w-6 h-6 text-[#d4af37]" />
          <h2 className="text-2xl font-bold text-[#1e3a5f]">
            Solicitações de Suporte
          </h2>
        </div>
        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border-2 border-[#d4af37] rounded-lg text-[#1e3a5f] bg-white"
          >
            <option value="all">Todos os Status</option>
            <option value="pending">Pendente</option>
            <option value="contacted">Contatado</option>
            <option value="resolved">Resolvido</option>
          </select>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value as any)}
            className="px-4 py-2 border-2 border-[#d4af37] rounded-lg text-[#1e3a5f] bg-white"
          >
            <option value="all">Todos os Departamentos</option>
            <option value="tecnico">Suporte Técnico</option>
            <option value="financeiro">Financeiro</option>
            <option value="comercial">Comercial</option>
            <option value="outros">Outros Assuntos</option>
          </select>
        </div>
      </div>

      {/* Toggle Arquivados */}
      <div className="mb-4">
        <Button
          onClick={() => setShowArchived(!showArchived)}
          variant="outline"
          className="border-[#d4af37] text-[#1e3a5f]"
        >
          {showArchived ? '✅ Ativos' : '📦 Arquivados'} {showArchived ? '' : `(${archivedCount})`}
        </Button>
      </div>

      {filteredRequests && filteredRequests.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-[#d4af37]">
                <th className="text-left py-3 px-4 text-[#1e3a5f] font-bold">Data</th>
                <th className="text-left py-3 px-4 text-[#1e3a5f] font-bold">Nome</th>
                <th className="text-left py-3 px-4 text-[#1e3a5f] font-bold">E-mail</th>
                <th className="text-left py-3 px-4 text-[#1e3a5f] font-bold">Departamento</th>
                <th className="text-left py-3 px-4 text-[#1e3a5f] font-bold">Mensagem</th>
                <th className="text-left py-3 px-4 text-[#1e3a5f] font-bold">Responsável</th>
                <th className="text-left py-3 px-4 text-[#1e3a5f] font-bold">Status</th>
                <th className="text-left py-3 px-4 text-[#1e3a5f] font-bold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((request) => (
                <tr key={request.id} className="border-b border-[#d4af37]/30 hover:bg-[#FFFACD]/50">
                  <td className="py-3 px-4 text-[#1e3a5f] text-sm">
                    {new Date(request.createdAt).toLocaleString("pt-BR")}
                  </td>
                  <td className="py-3 px-4 text-[#1e3a5f] font-semibold">{request.name}</td>
                  <td className="py-3 px-4 text-[#1e3a5f]">{request.email}</td>
                  <td className="py-3 px-4 text-[#1e3a5f]">
                    <span className="px-2 py-1 bg-[#d4af37]/20 rounded text-sm">
                      {deptNames[request.department]}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#1e3a5f] max-w-xs truncate">
                    {request.message || "Sem mensagem"}
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={request.assignedTo || ''}
                      onChange={(e) => handleAssign(request.id, e.target.value ? Number(e.target.value) : null)}
                      className="px-2 py-1 border-2 border-[#d4af37] rounded text-sm bg-white text-[#1e3a5f]"
                    >
                      <option value="">Não atribuído</option>
                      {admins?.map(admin => (
                        <option key={admin.id} value={admin.id}>
                          {admin.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-sm font-semibold ${statusColors[request.status]}`}>
                      {statusNames[request.status]}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      {request.status !== 'contacted' && (
                        <Button
                          onClick={() => handleStatusChange(request.id, 'contacted')}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Contatar
                        </Button>
                      )}
                      {request.status !== 'resolved' && (
                        <Button
                          onClick={() => handleStatusChange(request.id, 'resolved')}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          Resolver
                        </Button>
                      )}
                      <Button
                        onClick={() => window.open(`mailto:${request.email}`, '_blank')}
                        size="sm"
                        className="bg-[#d4af37] hover:bg-[#B8860B] text-[#1e3a5f]"
                      >
                        Responder
                      </Button>
                      {request.status === 'resolved' && !request.archived && (
                        <Button
                          onClick={() => archiveMutation.mutate({ ticketId: request.id })}
                          size="sm"
                          className="bg-gray-600 hover:bg-gray-700 text-white"
                        >
                          📦 Arquivar
                        </Button>
                      )}
                      {request.archived && (
                        <Button
                          onClick={() => unarchiveMutation.mutate({ ticketId: request.id })}
                          size="sm"
                          className="bg-orange-600 hover:bg-orange-700 text-white"
                        >
                          ↩️ Desarquivar
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center text-[#8b6f47] py-8">
          Nenhuma solicitação de suporte no momento. 📩
        </p>
      )}
    </Card>
  );
}

