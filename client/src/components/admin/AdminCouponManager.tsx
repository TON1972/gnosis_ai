import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2, Ticket, Calendar, CheckCircle2, XCircle, Edit2, Wrench, Gift, Clock, Shield, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CouponFormData {
  code: string;
  description: string;
  discountDays: number;
  expirationDate: string;
  allowedToolIds: string;
  bonusCredits: number;
  grantPlanId: number | null;
}

const INITIAL_FORM: CouponFormData = {
  code: "",
  description: "",
  discountDays: 30,
  expirationDate: "",
  allowedToolIds: "[]",
  bonusCredits: 0,
  grantPlanId: null,
};

export function AdminCouponManager() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CouponFormData>(INITIAL_FORM);
  const [editingCoupon, setEditingCoupon] = useState<any>(null);
  const [selectedToolIds, setSelectedToolIds] = useState<number[]>([]);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: coupons, isLoading } = trpc.admin.listCoupons.useQuery();
  const { data: allTools } = trpc.admin.listAllTools.useQuery();
  const { data: plansData } = trpc.plans.list.useQuery();

  const createMutation = trpc.admin.createCoupon.useMutation({
    onSuccess: () => { toast.success("Cupom criado com sucesso!"); handleCloseDialog(); utils.admin.listCoupons.invalidate(); },
    onError: (err) => toast.error(err.message),
  });
  const toggleMutation = trpc.admin.toggleCouponStatus.useMutation({
    onSuccess: () => utils.admin.listCoupons.invalidate(),
    onError: (err) => toast.error(err.message),
  });
  const deleteMutation = trpc.admin.deleteCoupon.useMutation({
    onSuccess: () => { toast.success("Cupom excluído."); utils.admin.listCoupons.invalidate(); },
    onError: (err) => toast.error(err.message),
  });
  const editMutation = trpc.admin.editCoupon.useMutation({
    onSuccess: () => { toast.success("Cupom atualizado!"); handleCloseDialog(); utils.admin.listCoupons.invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCoupon(null);
    setFormData(INITIAL_FORM);
    setSelectedToolIds([]);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code) return toast.error("O código é obrigatório");
    const payload = {
      ...formData,
      allowedToolIds: selectedToolIds.length > 0 ? JSON.stringify(selectedToolIds) : null,
      expirationDate: formData.expirationDate || null,
      grantPlanId: formData.grantPlanId || null,
    };
    if (editingCoupon) {
      editMutation.mutate({ id: editingCoupon.id, ...payload, isActive: editingCoupon.isActive });
    } else {
      createMutation.mutate(payload);
    }
  };

  const openCreateDialog = () => {
    setEditingCoupon(null);
    setFormData(INITIAL_FORM);
    setSelectedToolIds([]);
    setIsDialogOpen(true);
  };

  const openEditDialog = (coupon: any) => {
    setEditingCoupon(coupon);
    let toolIds: number[] = [];
    if (coupon.allowedToolIds) {
      try { toolIds = JSON.parse(coupon.allowedToolIds); } catch { toolIds = []; }
    }
    setSelectedToolIds(toolIds);
    setFormData({
      code: coupon.code,
      description: coupon.description || "",
      discountDays: coupon.discountDays,
      expirationDate: coupon.expirationDate ? format(new Date(coupon.expirationDate), "yyyy-MM-dd") : "",
      allowedToolIds: coupon.allowedToolIds || "[]",
      bonusCredits: coupon.bonusCredits || 0,
      grantPlanId: coupon.grantPlanId || null,
    });
    setIsDialogOpen(true);
  };

  const toggleToolSelection = (toolId: number) => {
    setSelectedToolIds(prev => prev.includes(toolId) ? prev.filter(id => id !== toolId) : [...prev, toolId]);
  };
  const selectAllTools = () => { if (allTools) setSelectedToolIds(allTools.map((t: any) => t.id)); };
  const deselectAllTools = () => { setSelectedToolIds([]); };

  const toolsByCategory = allTools?.reduce((acc: Record<string, any[]>, tool: any) => {
    const cat = tool.categoryName || "Sem Categoria";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(tool);
    return acc;
  }, {} as Record<string, any[]>) || {};

  const getToolNameById = (id: number) => allTools?.find((t: any) => t.id === id)?.displayName || `#${id}`;
  const getPlanNameById = (id: number) => plansData?.find((p: any) => p.id === id)?.displayName || `Plano #${id}`;

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-[#d4af37]" size={40} /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-[#1e3a5f] uppercase tracking-tighter">Gestão de Cupons</h2>
          <p className="text-gray-500 text-sm">Gerencie cupons com ferramentas, créditos e validade customizáveis</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) handleCloseDialog(); else setIsDialogOpen(true); }}>
          <DialogTrigger asChild>
            <Button className="bg-[#1e3a5f] text-white hover:bg-[#2a4a6f] font-bold gap-2" onClick={openCreateDialog}>
              <Plus size={18} /> Novo Cupom
            </Button>
          </DialogTrigger>

          {/* ============================================= */}
          {/* ========  MODAL REDESENHADO PREMIUM  ======== */}
          {/* ============================================= */}
          <DialogContent className="bg-gradient-to-b from-white to-gray-50/80 border border-[#d4af37]/30 max-w-4xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl shadow-2xl">
            {/* --- Header Gradient --- */}
            <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2a5a8f] px-8 py-5 rounded-t-2xl">
              <DialogHeader>
                <DialogTitle className="text-white font-black text-xl flex items-center gap-3 tracking-tight">
                  <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
                    <Ticket className="text-[#d4af37]" size={24} />
                  </div>
                  {editingCoupon ? "Editar Cupom" : "Criar Novo Cupom"}
                </DialogTitle>
                <p className="text-white/60 text-sm mt-1 ml-[52px]">Configure as regras de acesso, créditos e ferramentas do cupom</p>
              </DialogHeader>
            </div>

            <form onSubmit={handleSave} className="px-8 py-6 space-y-5">

              {/* ── SEÇÃO 1: Identificação ── */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="bg-[#d4af37]/10 p-2 rounded-lg"><Ticket size={18} className="text-[#d4af37]" /></div>
                  <h3 className="text-base font-black text-[#1e3a5f] uppercase tracking-wide">Identificação</h3>
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label className="text-[#1e3a5f] font-bold text-xs uppercase tracking-wider">Código do Cupom</Label>
                    <Input
                      placeholder="EX: PROMO30"
                      className="uppercase font-black tracking-widest border-gray-200 focus:border-[#d4af37] focus:ring-[#d4af37]/20 h-12 text-base rounded-xl bg-gray-50/50"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[#1e3a5f] font-bold text-xs uppercase tracking-wider">Descrição Interna</Label>
                    <Input
                      placeholder="Ex: Campanha de Lançamento"
                      className="border-gray-200 focus:border-[#d4af37] focus:ring-[#d4af37]/20 h-12 rounded-xl bg-gray-50/50"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* ── SEÇÃO 2: Validade & Créditos ── */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="bg-blue-50 p-2 rounded-lg"><Clock size={18} className="text-blue-500" /></div>
                  <h3 className="text-base font-black text-[#1e3a5f] uppercase tracking-wide">Validade & Créditos</h3>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {/* Card: Dias */}
                  <div className="bg-gradient-to-b from-blue-50/80 to-white rounded-xl p-4 border border-blue-100/80 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-100 p-1.5 rounded-md"><Clock size={14} className="text-blue-600" /></div>
                      <Label className="text-blue-700 font-bold text-xs uppercase tracking-wider">Dias de Acesso</Label>
                    </div>
                    <Input
                      type="number" min="1"
                      className="border-blue-200/80 focus:border-blue-400 h-12 text-xl font-black text-center rounded-xl bg-white"
                      value={formData.discountDays}
                      onChange={(e) => setFormData({ ...formData, discountDays: parseInt(e.target.value) || 1 })}
                    />
                    <p className="text-[11px] text-blue-400 text-center font-medium">Após este período, volta a regra do plano</p>
                  </div>
                  {/* Card: Créditos */}
                  <div className="bg-gradient-to-b from-emerald-50/80 to-white rounded-xl p-4 border border-emerald-100/80 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <div className="bg-emerald-100 p-1.5 rounded-md"><Gift size={14} className="text-emerald-600" /></div>
                      <Label className="text-emerald-700 font-bold text-xs uppercase tracking-wider">Créditos Bônus</Label>
                    </div>
                    <Input
                      type="number" min="0"
                      className="border-emerald-200/80 focus:border-emerald-400 h-12 text-xl font-black text-center rounded-xl bg-white"
                      value={formData.bonusCredits}
                      onChange={(e) => setFormData({ ...formData, bonusCredits: parseInt(e.target.value) || 0 })}
                    />
                    <p className="text-[11px] text-emerald-400 text-center font-medium">Créditos extras ao ativar o cupom</p>
                  </div>
                  {/* Card: Expiração */}
                  <div className="bg-gradient-to-b from-amber-50/80 to-white rounded-xl p-4 border border-amber-100/80 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <div className="bg-amber-100 p-1.5 rounded-md"><Calendar size={14} className="text-amber-600" /></div>
                      <Label className="text-amber-700 font-bold text-xs uppercase tracking-wider">Expiração</Label>
                    </div>
                    <Input
                      type="date"
                      className="border-amber-200/80 focus:border-amber-400 h-12 rounded-xl bg-white text-sm"
                      value={formData.expirationDate}
                      onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                    />
                    <p className="text-[11px] text-amber-400 text-center font-medium">Data limite para uso (opcional)</p>
                  </div>
                </div>
              </div>

              {/* ── SEÇÃO 3: Tipo de Acesso (Cards selecionáveis) ── */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="bg-purple-50 p-2 rounded-lg"><Shield size={18} className="text-purple-500" /></div>
                  <h3 className="text-base font-black text-[#1e3a5f] uppercase tracking-wide">Tipo de Acesso</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Card: Customizado */}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, grantPlanId: null })}
                    className={`relative text-left rounded-xl p-5 border-2 transition-all duration-200 ${
                      !formData.grantPlanId
                        ? 'border-orange-400 bg-gradient-to-br from-orange-50 to-amber-50/30 shadow-lg shadow-orange-100/50 scale-[1.01]'
                        : 'border-gray-200 bg-gray-50/50 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {!formData.grantPlanId && (
                      <div className="absolute top-3 right-3 bg-orange-500 text-white text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-wider">Selecionado</div>
                    )}
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-xl ${!formData.grantPlanId ? 'bg-orange-100' : 'bg-gray-100'}`}>
                        <Wrench size={20} className={!formData.grantPlanId ? 'text-orange-500' : 'text-gray-400'} />
                      </div>
                      <div>
                        <p className={`font-black text-base ${!formData.grantPlanId ? 'text-orange-700' : 'text-gray-500'}`}>Ferramentas Específicas</p>
                        <p className={`text-xs mt-0.5 ${!formData.grantPlanId ? 'text-orange-400' : 'text-gray-400'}`}>
                          Selecione individualmente quais ferramentas o cupom libera
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Card: Plano */}
                  <div className={`relative rounded-xl p-5 border-2 transition-all duration-200 ${
                    formData.grantPlanId
                      ? 'border-purple-400 bg-gradient-to-br from-purple-50 to-indigo-50/30 shadow-lg shadow-purple-100/50 scale-[1.01]'
                      : 'border-gray-200 bg-gray-50/50'
                  }`}>
                    {formData.grantPlanId && (
                      <div className="absolute top-3 right-3 bg-purple-500 text-white text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-wider">Selecionado</div>
                    )}
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`p-2.5 rounded-xl ${formData.grantPlanId ? 'bg-purple-100' : 'bg-gray-100'}`}>
                        <Shield size={20} className={formData.grantPlanId ? 'text-purple-500' : 'text-gray-400'} />
                      </div>
                      <div>
                        <p className={`font-black text-base ${formData.grantPlanId ? 'text-purple-700' : 'text-gray-500'}`}>Vincular a um Plano</p>
                        <p className={`text-xs mt-0.5 ${formData.grantPlanId ? 'text-purple-400' : 'text-gray-400'}`}>
                          Acesso completo a todas as ferramentas do plano
                        </p>
                      </div>
                    </div>
                    <Select
                      value={formData.grantPlanId?.toString() || ""}
                      onValueChange={(val) => setFormData({ ...formData, grantPlanId: parseInt(val) })}
                    >
                      <SelectTrigger className={`h-11 text-sm rounded-lg ${formData.grantPlanId ? 'border-purple-200 bg-white' : 'border-gray-200 bg-white'}`}>
                        <SelectValue placeholder="Escolher plano..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-xl rounded-xl z-[9999]">
                        {plansData?.map((plan: any) => (
                          <SelectItem key={plan.id} value={plan.id.toString()} className="cursor-pointer hover:bg-purple-50 rounded-lg">
                            <span className="flex items-center gap-2 font-bold text-sm">
                              <Shield size={12} className="text-purple-500" /> {plan.displayName}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* ── SEÇÃO 4: Ferramentas (só quando Customizado) ── */}
              {!formData.grantPlanId && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="bg-orange-50 p-2 rounded-lg"><Wrench size={18} className="text-orange-500" /></div>
                      <h3 className="text-base font-black text-[#1e3a5f] uppercase tracking-wide">Ferramentas Liberadas</h3>
                      <span className="bg-gradient-to-r from-[#d4af37] to-[#c9a020] text-white text-xs px-3 py-1 rounded-full font-black shadow-sm">
                        {selectedToolIds.length} selecionadas
                      </span>
                    </div>
                    <div className="flex gap-3">
                      <button type="button" onClick={selectAllTools} className="text-sm text-[#1e3a5f] hover:text-[#d4af37] font-bold transition-colors flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg hover:bg-[#d4af37]/10">
                        <CheckCircle2 size={13} /> Marcar Todas
                      </button>
                      <button type="button" onClick={deselectAllTools} className="text-sm text-red-400 hover:text-red-600 font-bold transition-colors flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg hover:bg-red-50">
                        <XCircle size={13} /> Limpar
                      </button>
                    </div>
                  </div>

                  <div className="max-h-[280px] overflow-y-auto rounded-xl border border-gray-100 bg-gradient-to-b from-gray-50/50 to-white p-5 space-y-5">
                    {Object.entries(toolsByCategory).map(([category, tools]) => (
                      <div key={category}>
                        <p className="text-xs font-black text-[#1e3a5f]/30 uppercase tracking-[0.15em] mb-2.5 flex items-center gap-2">
                          <span className="w-3 h-[2px] bg-[#d4af37]/40 rounded-full"></span>
                          {category}
                          <span className="flex-1 h-px bg-gray-100"></span>
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {(tools as any[]).map((tool: any) => {
                            const isSelected = selectedToolIds.includes(tool.id);
                            return (
                              <button
                                key={tool.id}
                                type="button"
                                onClick={() => toggleToolSelection(tool.id)}
                                className={`
                                  text-xs px-3 py-2.5 rounded-lg font-bold transition-all duration-150 border text-left flex items-center gap-2.5
                                  ${isSelected
                                    ? 'bg-gradient-to-r from-[#1e3a5f] to-[#2a5a8f] text-white border-[#1e3a5f] shadow-md shadow-[#1e3a5f]/20 scale-[1.02]'
                                    : 'bg-white text-gray-500 border-gray-200 hover:border-[#d4af37]/50 hover:text-[#1e3a5f] hover:shadow-sm'}
                                `}
                              >
                                <span className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center text-[10px] font-black ${
                                  isSelected ? 'bg-white/25 text-white' : 'bg-gray-100 border border-gray-200 text-transparent'
                                }`}>
                                  ✓
                                </span>
                                <span className="truncate">{tool.displayName}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── BOTÃO PRINCIPAL ── */}
              <div className="pt-2 pb-2">
                <Button
                  type="submit"
                  disabled={createMutation.isPending || editMutation.isPending}
                  className="w-full bg-gradient-to-r from-[#1e3a5f] via-[#2a5080] to-[#2a5a8f] hover:from-[#2a4a6f] hover:via-[#345a90] hover:to-[#3a6a9f] text-white font-black h-14 text-sm rounded-xl shadow-lg shadow-[#1e3a5f]/25 transition-all duration-200 hover:shadow-xl hover:shadow-[#1e3a5f]/35 hover:scale-[1.01] uppercase tracking-widest"
                >
                  {createMutation.isPending || editMutation.isPending
                    ? <Loader2 className="animate-spin" size={22} />
                    : <span className="flex items-center gap-2.5"><Ticket size={18} />{editingCoupon ? "Salvar Alterações" : "Gerar Cupom"}</span>
                  }
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* === TABELA DE CUPONS === */}
      <Card className="border-none shadow-xl overflow-hidden">
        <Table>
          <TableHeader className="bg-[#1e3a5f]/5">
            <TableRow>
              <TableHead className="font-bold text-[#1e3a5f]">Código</TableHead>
              <TableHead className="font-bold text-[#1e3a5f]">Descrição</TableHead>
              <TableHead className="font-bold text-[#1e3a5f]">Regras</TableHead>
              <TableHead className="font-bold text-[#1e3a5f]">Validade Cupom</TableHead>
              <TableHead className="font-bold text-[#1e3a5f]">Status</TableHead>
              <TableHead className="font-bold text-[#1e3a5f] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-gray-400 font-medium">
                  Nenhum cupom cadastrado ainda.
                </TableCell>
              </TableRow>
            ) : (
              coupons?.map((coupon: any) => {
                const isExpired = coupon.expirationDate && new Date(coupon.expirationDate) < new Date();
                const isExpanded = expandedRow === coupon.id;
                let toolIds: number[] = [];
                if (coupon.allowedToolIds) {
                  try { toolIds = JSON.parse(coupon.allowedToolIds); } catch { toolIds = []; }
                }
                return (
                  <>
                    <TableRow key={coupon.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => setExpandedRow(isExpanded ? null : coupon.id)}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="bg-[#d4af37]/10 p-2 rounded-lg"><Ticket size={16} className="text-[#d4af37]" /></div>
                          <span className="font-black text-[#1e3a5f] tracking-widest">{coupon.code}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600 font-medium text-sm max-w-[200px] truncate">{coupon.description || "-"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <span className="bg-[#1e3a5f]/10 text-[#1e3a5f] px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1"><Clock size={10} /> {coupon.discountDays}d</span>
                          {(coupon.bonusCredits || 0) > 0 && (
                            <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1"><Gift size={10} /> +{coupon.bonusCredits}cr</span>
                          )}
                          {coupon.grantPlanId ? (
                            <span className="bg-purple-50 text-purple-600 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1"><Shield size={10} /> {getPlanNameById(coupon.grantPlanId)}</span>
                          ) : toolIds.length > 0 ? (
                            <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1"><Wrench size={10} /> {toolIds.length} ferramentas</span>
                          ) : null}
                          {isExpanded ? <ChevronUp size={12} className="text-gray-400 ml-1" /> : <ChevronDown size={12} className="text-gray-400 ml-1" />}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-500 text-xs font-bold">
                        {coupon.expirationDate ? (
                          <div className="flex items-center gap-1"><Calendar size={12} />{format(new Date(coupon.expirationDate), "dd MMM yyyy", { locale: ptBR })}</div>
                        ) : "Vitalício"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <Switch checked={!!(coupon.isActive && !isExpired)} disabled={!!isExpired} onCheckedChange={(val) => toggleMutation.mutate({ id: coupon.id, isActive: val })} />
                          {isExpired ? (
                            <span className="text-red-500 text-[10px] font-bold uppercase flex items-center gap-1"><XCircle size={10} /> Expirado</span>
                          ) : coupon.isActive ? (
                            <span className="text-green-600 text-[10px] font-bold uppercase flex items-center gap-1"><CheckCircle2 size={10} /> Ativo</span>
                          ) : (
                            <span className="text-gray-400 text-[10px] font-bold uppercase">Inativo</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="text-[#1e3a5f] hover:text-[#2a4a6f] hover:bg-[#1e3a5f]/5 h-8 w-8" onClick={() => openEditDialog(coupon)}><Edit2 size={16} /></Button>
                          <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-600 hover:bg-red-50 h-8 w-8" onClick={() => { if (confirm("Tem certeza que deseja excluir este cupom?")) deleteMutation.mutate({ id: coupon.id }); }}><Trash2 size={16} /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow key={`${coupon.id}-details`} className="bg-gray-50/80">
                        <TableCell colSpan={6} className="py-3 px-6">
                          <div className="space-y-2">
                            {coupon.grantPlanId ? (
                              <div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase">Plano Concedido:</span>
                                <p className="text-sm font-bold text-purple-600">{getPlanNameById(coupon.grantPlanId)} — Acesso total por {coupon.discountDays} dias</p>
                              </div>
                            ) : toolIds.length > 0 ? (
                              <div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Ferramentas Liberadas ({toolIds.length}):</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {toolIds.map(id => (
                                    <span key={id} className="bg-white border border-orange-200 text-orange-600 text-[10px] px-2 py-0.5 rounded-full font-bold">{getToolNameById(id)}</span>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-gray-400 italic">Nenhuma ferramenta ou plano configurado</p>
                            )}
                            {(coupon.bonusCredits || 0) > 0 && (
                              <div className="flex items-center gap-2 pt-1">
                                <Gift size={12} className="text-green-500" />
                                <span className="text-xs font-bold text-green-600">{coupon.bonusCredits} créditos bônus concedidos ao usar este cupom</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
