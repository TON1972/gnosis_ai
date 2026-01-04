import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { APP_LOGO, APP_TITLE } from "@/const";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Home, LogOut, MessageCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import TicketSystem from "@/components/TicketSystem";

export default function AdminTickets() {
  const { user, loading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedTicket, setSelectedTicket] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [showArchived, setShowArchived] = useState<boolean>(false);

  // Check access
  useEffect(() => {
    if (loading) return;
    if (!user) {
      toast.error("Você precisa fazer login.");
      setLocation("/");
      return;
    }
    if (user.role !== "admin" && user.role !== "super_admin") {
      toast.error("Acesso negado. Apenas administradores podem acessar esta página.");
      setLocation("/dashboard");
    }
  }, [user, loading, setLocation]);

  // Query support requests
  const { data: supportRequests = [], refetch } = trpc.admin.supportRequests.useQuery(
    { status: "all", department: "all" },
    {
      refetchInterval: 30000, // Auto-refresh every 30 seconds
    }
  );

  // Query unread counts
  const { data: unreadCounts = [] } = trpc.admin.getUnreadCounts.useQuery(undefined, {
    refetchInterval: 5000, // Check every 5 seconds
  });

  // Mutation to update status
  const updateStatusMutation = trpc.admin.updateSupportStatus.useMutation();

  // Mutations for archiving
  const archiveMutation = trpc.admin.archiveTicket.useMutation({
    onSuccess: () => {
      toast.success('📦 Ticket arquivado!');
      refetch();
    },
  });

  const unarchiveMutation = trpc.admin.unarchiveTicket.useMutation({
    onSuccess: () => {
      toast.success('↩️ Ticket desarquivado!');
      if (showArchived) setShowArchived(false);
      refetch();
    },
  });

  // Get unread count for a ticket
  const getUnreadCount = (ticketId: number) => {
    const count = unreadCounts.find((c) => c.ticketId === ticketId);
    return count ? Number(count.count) : 0;
  };

  // Filter requests
  const filteredRequests = supportRequests.filter((req) => {
    // Filter by archived status
    if (!showArchived && req.archived) return false;
    if (statusFilter !== "all" && req.status !== statusFilter) return false;
    if (departmentFilter !== "all" && req.department !== departmentFilter) return false;
    return true;
  });

  // Count archived tickets
  const archivedCount = supportRequests.filter(req => req.archived).length;

  // Department names
  const deptNames: Record<string, string> = {
    tecnico: "Suporte Técnico",
    financeiro: "Financeiro",
    comercial: "Comercial",
    outros: "Outros Assuntos",
  };

  // Status names
  const statusNames: Record<string, string> = {
    pending: "🟢 Aberto",
    contacted: "🟡 Em Andamento",
    resolved: "✅ Resolvido",
  };

  // Status colors
  const statusColors: Record<string, string> = {
    pending: "text-green-700 bg-green-100", // Aberto - verde
    contacted: "text-yellow-700 bg-yellow-100", // Em Andamento - amarelo
    resolved: "text-blue-700 bg-blue-100", // Resolvido - azul
  };

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-radial from-[#d4af37] via-[#DAA520] to-[#FFFACD]">
        <p className="text-2xl text-[#1e3a5f]">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-radial from-[#d4af37] via-[#DAA520] to-[#FFFACD]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#1e3a5f] shadow-lg border-b-4 border-[#d4af37]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <span className="flex items-center gap-3 cursor-pointer">
                <img src={APP_LOGO} alt={APP_TITLE} className="h-12 w-12 object-contain" loading="lazy" />
                <div>
                  {/* Título completo para desktop */}
                  <h1 className="hidden md:block text-2xl font-bold text-[#d4af37]">{APP_TITLE}</h1>
                  {/* Título curto para mobile */}
                  <h1 className="block md:hidden text-2xl font-bold text-[#d4af37]">GNOSIS AI</h1>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-[#d4af37]/70">Sistema de Tickets</p>
                    {user?.role === "admin" && (
                      <span className="text-xs bg-[#d4af37] text-[#1e3a5f] px-2 py-1 rounded-full font-semibold">
                        Meus Tickets
                      </span>
                    )}
                    {user?.role === "super_admin" && (
                      <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full font-semibold">
                        Todos os Tickets
                      </span>
                    )}
                  </div>
                </div>
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button
                  variant="outline"
                  className="border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-[#1e3a5f]"
                  size="sm"
                >
                  Voltar ao Admin
                </Button>
              </Link>
              <Link href="/">
                <Button
                  variant="outline"
                  className="border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-[#1e3a5f]"
                  size="sm"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Voltar ao Início
                </Button>
              </Link>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
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
      <main className="container mx-auto px-4 py-8">
        <Card className="p-6 bg-white/90 border-4 border-[#d4af37] mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-6 h-6 text-[#d4af37]" />
              <h2 className="text-2xl font-bold text-[#1e3a5f]">
                Gerenciamento de Tickets
              </h2>
            </div>
            <div className="flex gap-3">
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border-2 border-[#d4af37] rounded text-[#1e3a5f] bg-white"
              >
                <option value="all">Todos os Status</option>
                <option value="pending">Pendente</option>
                <option value="contacted">Contatado</option>
                <option value="resolved">Resolvido</option>
              </select>

              {/* Department Filter */}
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-3 py-2 border-2 border-[#d4af37] rounded text-[#1e3a5f] bg-white"
              >
                <option value="all">Todos os Departamentos</option>
                <option value="tecnico">Suporte Técnico</option>
                <option value="financeiro">Financeiro</option>
                <option value="comercial">Comercial</option>
                <option value="outros">Outros Assuntos</option>
              </select>

              {/* Archived Toggle */}
              <Button
                variant={showArchived ? "default" : "outline"}
                onClick={() => setShowArchived(!showArchived)}
                className={showArchived 
                  ? "bg-[#d4af37] text-[#1e3a5f] hover:bg-[#d4af37]/90" 
                  : "border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-[#1e3a5f]"}
              >
                📦 Arquivados ({archivedCount})
              </Button>
            </div>
          </div>

          {/* Tickets List */}
          {filteredRequests.length > 0 ? (
            <div className="space-y-4">
              {filteredRequests.map((request) => {
                const unreadCount = getUnreadCount(request.id);
                return (
                  <Card
                    key={request.id}
                    className={`p-4 border-2 hover:shadow-lg transition-shadow ${
                      unreadCount > 0
                        ? "border-red-500 bg-red-50 animate-pulse"
                        : "border-[#d4af37]/30"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-[#1e3a5f]">
                            Ticket #{request.id}
                          </h3>
                          <select
                            value={request.status}
                            onChange={(e) => {
                              const newStatus = e.target.value as 'pending' | 'contacted' | 'resolved';
                              updateStatusMutation.mutate(
                                { id: request.id, status: newStatus },
                                {
                                  onSuccess: () => {
                                    toast.success('Status atualizado!');
                                    refetch();
                                  },
                                  onError: () => toast.error('Erro ao atualizar status'),
                                }
                              );
                            }}
                            className={`px-2 py-1 rounded text-xs font-semibold border-0 cursor-pointer ${statusColors[request.status]}`}
                          >
                            <option value="pending">🟢 Aberto</option>
                            <option value="contacted">🟡 Em Andamento</option>
                            <option value="resolved">✅ Resolvido</option>
                          </select>
                          <span className="px-2 py-1 bg-[#d4af37]/20 rounded text-xs">
                            {deptNames[request.department]}
                          </span>
                          {unreadCount > 0 && (
                            <span className="px-2 py-1 bg-red-500 text-white rounded text-xs font-bold flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {unreadCount} nova{unreadCount > 1 ? "s" : ""} mensagem{unreadCount > 1 ? "ns" : ""}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm text-[#1e3a5f]">
                          <div>
                            <span className="font-semibold">Nome:</span> {request.name}
                          </div>
                          <div>
                            <span className="font-semibold">E-mail:</span> {request.email}
                          </div>
                          <div className="col-span-2">
                            <span className="font-semibold">Mensagem:</span> {request.message || "Sem mensagem"}
                          </div>
                          <div>
                            <span className="font-semibold">Data:</span>{" "}
                            {new Date(request.createdAt).toLocaleString("pt-BR")}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={() => setSelectedTicket(request.id)}
                          className="bg-[#d4af37] hover:bg-[#b8941f] text-[#1e3a5f] font-bold"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Ver Conversa
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
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-[#8b6f47] py-8">
              Nenhum ticket encontrado com os filtros selecionados. 📩
            </p>
          )}
        </Card>

        {/* Ticket Conversation */}
        {selectedTicket && (() => {
          const ticket = supportRequests.find(r => r.id === selectedTicket);
          return (
            <TicketSystem
              ticketId={selectedTicket}
              ticketStatus={ticket?.status}
              isArchived={ticket?.archived}
              onClose={() => {
                setSelectedTicket(null);
                refetch();
              }}
              onArchiveChange={() => {
                refetch();
              }}
            />
          );
        })()}
      </main>
    </div>
  );
}

