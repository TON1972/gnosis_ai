import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription 
} from "@/components/ui/card";
import { 
  Tabs, TabsContent, TabsList, TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, DollarSign, TrendingUp, CheckCircle2, XCircle, Search, 
  ExternalLink, MoreHorizontal, Wallet, Filter, Loader2
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export function AdminAffiliateManager() {
  const [activeSubTab, setActiveSubTab] = useState("overview");

  // Queries
  const { data: globalStats, isLoading: ldStats } = trpc.affiliate.getGlobalStats.useQuery();
  const { data: commissions, isLoading: ldCommissions, refetch: refetchCommissions } = trpc.affiliate.getAllCommissions.useQuery();
  const { data: payouts, isLoading: ldPayouts, refetch: refetchPayouts } = trpc.affiliate.getAllPayouts.useQuery();

  // Mutation para registrar um NOVO pagamento (Manual)
  const registerPayoutMutation = trpc.affiliate.registerPayout.useMutation({
    onSuccess: () => {
      toast.success("Pagamento registrado com sucesso!");
      refetchPayouts();
      refetchCommissions();
    },
    onError: (err) => {
      toast.error("Erro ao registrar pagamento: " + err.message);
    }
  });

  // Mutation para processar um payout existente
  const processPayoutMutation = trpc.affiliate.processPayout.useMutation({
    onSuccess: () => {
      toast.success("Solicitação processada com sucesso!");
      refetchPayouts();
      refetchCommissions();
    },
    onError: (err) => {
      toast.error("Erro ao processar solicitação: " + err.message);
    }
  });

  const handleRegisterPayment = (affiliateId: number, amount: number, commissionIds: number[]) => {
    if (amount <= 0) {
      toast.error("Não há saldo pendente para pagar.");
      return;
    }
    if (!confirm(`Deseja registrar um pagamento de ${formatCurrency(amount)} para este afiliado?`)) return;
    
    registerPayoutMutation.mutate({
      affiliateId,
      amount,
      commissionIds,
      paymentMethod: "Manual (Admin)"
    });
  };

  const handleProcessPayout = async (payoutId: number, status: 'paid' | 'cancelled') => {
    if (!confirm(`Deseja marcar esta solicitação como ${status === 'paid' ? 'PAGA' : 'CANCELADA'}?`)) return;
    processPayoutMutation.mutate({ payoutId, status });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount / 100);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* GLOBAL STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-none shadow-sm overflow-hidden group hover:shadow-md transition-all border-b-4 border-[#d4af37]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Total Comissões</p>
                <h3 className="text-2xl font-black text-[#1e3a5f]">
                  {formatCurrency(globalStats?.commissions.totalCommissions || 0)}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-[#FFFACD] flex items-center justify-center text-[#d4af37] group-hover:scale-110 transition-transform">
                <TrendingUp size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-none shadow-sm overflow-hidden group hover:shadow-md transition-all border-b-4 border-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Afiliados Ativos</p>
                <h3 className="text-2xl font-black text-[#1e3a5f]">
                  {globalStats?.activeAffiliates || 0}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                <Users size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-none shadow-sm overflow-hidden group hover:shadow-md transition-all border-b-4 border-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Pendentes</p>
                <h3 className="text-2xl font-black text-[#1e3a5f]">
                  {formatCurrency(globalStats?.commissions.pendingCommissions || 0)}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                <Wallet size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-none shadow-sm overflow-hidden group hover:shadow-md transition-all border-b-4 border-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Pagas</p>
                <h3 className="text-2xl font-black text-[#1e3a5f]">
                  {formatCurrency(globalStats?.commissions.paidCommissions || 0)}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
                <CheckCircle2 size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <Tabs defaultValue="commissions" className="w-full">
          <div className="px-6 pt-6 border-b">
            <TabsList className="bg-gray-100/50 p-1 mb-0 border-b-0">
              <TabsTrigger value="commissions" className="px-6">Comissões</TabsTrigger>
              <TabsTrigger value="payouts" className="px-6">Pagamentos</TabsTrigger>
              <TabsTrigger value="affiliates-list" className="px-6">Afiliados</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="affiliates-list" className="p-0">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-[#1e3a5f] uppercase tracking-tight">Saldos de Afiliados</h2>
              </div>

              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-gray-100">
                    <TableHead className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Afiliado</TableHead>
                    <TableHead className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Saldo Pendente</TableHead>
                    <TableHead className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Qtd. Pendente</TableHead>
                    <TableHead className="text-right text-gray-400 font-bold uppercase text-[10px] tracking-widest">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const byAff = commissions?.reduce((acc: any, comm: any) => {
                      if (comm.status === 'pending') {
                        if (!acc[comm.affiliateId]) {
                          acc[comm.affiliateId] = {
                            id: comm.affiliateId,
                            name: comm.affiliateName,
                            email: comm.affiliateEmail,
                            pendingAmount: 0,
                            ids: []
                          };
                        }
                        acc[comm.affiliateId].pendingAmount += comm.amount;
                        acc[comm.affiliateId].ids.push(comm.id);
                      }
                      return acc;
                    }, {});

                    const affList = Object.values(byAff || {});

                    if (affList.length === 0) {
                      return <TableRow><TableCell colSpan={4} className="text-center py-8 text-gray-400">Nenhum saldo pendente encontrado.</TableCell></TableRow>;
                    }

                    return affList.map((aff: any) => (
                      <TableRow key={aff.id} className="border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-[#1e3a5f]">{aff.name}</span>
                            <span className="text-[10px] text-gray-400">{aff.email}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-black text-[#1e3a5f]">{formatCurrency(aff.pendingAmount)}</TableCell>
                        <TableCell className="text-gray-600 font-medium">{aff.ids.length} comissões</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            size="sm" 
                            className="bg-[#1e3a5f] text-white hover:bg-[#1e3a5f]/90 rounded-xl text-[10px] font-black uppercase tracking-widest px-6"
                            onClick={() => handleRegisterPayment(aff.id, aff.pendingAmount, aff.ids)}
                            disabled={registerPayoutMutation.isPending}
                          >
                            {registerPayoutMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Wallet className="w-3 h-3 mr-2" />}
                            Registrar Pagamento
                          </Button>
                        </TableCell>
                      </TableRow>
                    ));
                  })()}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="commissions" className="p-0">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-[#1e3a5f] uppercase tracking-tight">Histórico de Comissões</h2>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input 
                      type="text" 
                      placeholder="Buscar por afiliado..."
                      className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#d4af37]/20 w-64"
                    />
                  </div>
                  <Button variant="outline" className="rounded-xl border-gray-100">
                    <Filter className="w-4 h-4 mr-2" />
                    Filtros
                  </Button>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-gray-100">
                    <TableHead className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Afiliado</TableHead>
                    <TableHead className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Indicado</TableHead>
                    <TableHead className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Plano</TableHead>
                    <TableHead className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Valor</TableHead>
                    <TableHead className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Status</TableHead>
                    <TableHead className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissions?.map((comm: any) => (
                    <TableRow key={comm.id} className="border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-[#1e3a5f]">{comm.affiliateName}</span>
                          <span className="text-[10px] text-gray-400">{comm.affiliateEmail}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-gray-600">{comm.referredUserName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-50 text-blue-600 border-none font-bold text-[10px] px-2 py-0">
                          {comm.planName}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-black text-[#1e3a5f]">{formatCurrency(comm.amount)}</TableCell>
                      <TableCell>
                        <Badge className={`
                          ${comm.status === 'paid' ? 'bg-green-100 text-green-700' : ''}
                          ${comm.status === 'pending' ? 'bg-orange-100 text-orange-700' : ''}
                          ${comm.status === 'cancelled' ? 'bg-red-100 text-red-700' : ''}
                          border-none font-black text-[10px] uppercase px-2
                        `}>
                          {comm.status === 'paid' ? 'PAGO' : comm.status === 'pending' ? 'PENDENTE' : 'CANCELADO'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-400 text-xs font-medium">
                        {format(new Date(comm.createdAt), "dd MMM, yyyy", { locale: ptBR })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="payouts" className="p-0">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-[#1e3a5f] uppercase tracking-tight">Gestão de Pagamentos</h2>
              </div>

              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-gray-100">
                    <TableHead className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Afiliado</TableHead>
                    <TableHead className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Valor</TableHead>
                    <TableHead className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Status</TableHead>
                    <TableHead className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Método</TableHead>
                    <TableHead className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Solicitado em</TableHead>
                    <TableHead className="text-right text-gray-400 font-bold uppercase text-[10px] tracking-widest">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts?.map((payout: any) => (
                    <TableRow key={payout.id} className="border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-[#1e3a5f]">{payout.affiliateName}</span>
                          <span className="text-[10px] text-gray-400">{payout.affiliateEmail}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-black text-[#1e3a5f]">{formatCurrency(payout.amount)}</TableCell>
                      <TableCell>
                        <Badge className={`
                          ${payout.status === 'paid' ? 'bg-green-100 text-green-700' : ''}
                          ${payout.status === 'pending' ? 'bg-orange-100 text-orange-700' : ''}
                          ${payout.status === 'failed' ? 'bg-red-100 text-red-700' : ''}
                          border-none font-black text-[10px] uppercase px-2
                        `}>
                          {payout.status === 'paid' ? 'PROCESSADO' : payout.status === 'pending' ? 'AGUARDANDO' : 'FALHOU'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-500 text-xs font-bold uppercase">{payout.paymentMethod || 'PIX'}</TableCell>
                      <TableCell className="text-gray-400 text-xs font-medium">
                        {format(new Date(payout.createdAt), "dd MMM, yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right">
                        {payout.status === 'pending' && (
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="bg-green-50 text-green-600 border-green-100 hover:bg-green-600 hover:text-white rounded-lg text-[10px] font-black"
                              onClick={() => handleProcessPayout(payout.id, 'paid')}
                              disabled={processPayoutMutation.isPending}
                            >
                              {processPayoutMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : "MARCAR COMO PAGO"}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="bg-red-50 text-red-600 border-red-100 hover:bg-red-600 hover:text-white rounded-lg text-[10px] font-black"
                              onClick={() => handleProcessPayout(payout.id, 'cancelled')}
                              disabled={processPayoutMutation.isPending}
                            >
                              {processPayoutMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : "RECUSAR"}
                            </Button>
                          </div>
                        )}
                        {payout.status === 'paid' && (
                          <span className="text-xs text-green-600 font-bold">Pago em {format(new Date(payout.paidAt), "dd/MM")}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
