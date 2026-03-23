import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Trash2, Ticket, Calendar, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function AdminCouponManager() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    description: "",
    discountDays: 30,
    expirationDate: "",
  });

  const utils = trpc.useUtils();
  const { data: coupons, isLoading } = trpc.admin.listCoupons.useQuery();
  const createMutation = trpc.admin.createCoupon.useMutation({
    onSuccess: () => {
      toast.success("Cupom criado com sucesso!");
      setIsDialogOpen(false);
      setNewCoupon({ code: "", description: "", discountDays: 30, expirationDate: "" });
      utils.admin.listCoupons.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const toggleMutation = trpc.admin.toggleCouponStatus.useMutation({
    onSuccess: () => utils.admin.listCoupons.invalidate(),
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.admin.deleteCoupon.useMutation({
    onSuccess: () => {
      toast.success("Cupom excluído.");
      utils.admin.listCoupons.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.code) return toast.error("O código é obrigatório");
    createMutation.mutate({
      ...newCoupon,
      expirationDate: newCoupon.expirationDate || null,
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin text-[#d4af37]" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-[#1e3a5f] uppercase tracking-tighter">Gestão de Cupons</h2>
          <p className="text-gray-500 text-sm">Crie cupons para conceder acesso Premium temporário</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#1e3a5f] text-white hover:bg-[#2a4a6f] font-bold gap-2">
              <Plus size={18} /> Novo Cupom
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-2 border-[#d4af37]/20">
            <DialogHeader>
              <DialogTitle className="text-[#1e3a5f] font-bold text-xl flex items-center gap-2">
                <Ticket className="text-[#d4af37]" /> Criar Novo Cupom
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-[#1e3a5f] font-bold">Código do Cupom</Label>
                <Input
                  placeholder="EX: PROMO30"
                  className="uppercase font-black tracking-widest border-[#d4af37]/40"
                  value={newCoupon.code}
                  onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#1e3a5f] font-bold">Descrição (Interna)</Label>
                <Input
                  placeholder="Ex: Campanha de Lançamento"
                  className="border-[#d4af37]/40"
                  value={newCoupon.description}
                  onChange={(e) => setNewCoupon({ ...newCoupon, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#1e3a5f] font-bold">Dias de Acesso</Label>
                  <Input
                    type="number"
                    min="1"
                    className="border-[#d4af37]/40"
                    value={newCoupon.discountDays}
                    onChange={(e) => setNewCoupon({ ...newCoupon, discountDays: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#1e3a5f] font-bold">Data de Expiração (Opcional)</Label>
                  <Input
                    type="date"
                    className="border-[#d4af37]/40"
                    value={newCoupon.expirationDate}
                    onChange={(e) => setNewCoupon({ ...newCoupon, expirationDate: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" disabled={createMutation.isPending} className="w-full bg-[#1e3a5f] text-white font-bold h-12">
                  {createMutation.isPending ? <Loader2 className="animate-spin" /> : "Gerar Cupom"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-xl overflow-hidden">
        <Table>
          <TableHeader className="bg-[#1e3a5f]/5">
            <TableRow>
              <TableHead className="font-bold text-[#1e3a5f]">Código</TableHead>
              <TableHead className="font-bold text-[#1e3a5f]">Descrição</TableHead>
              <TableHead className="font-bold text-[#1e3a5f]">Dias</TableHead>
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
              coupons?.map((coupon) => {
                const isExpired = coupon.expirationDate && new Date(coupon.expirationDate) < new Date();
                return (
                  <TableRow key={coupon.id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="bg-[#d4af37]/10 p-2 rounded-lg">
                          <Ticket size={16} className="text-[#d4af37]" />
                        </div>
                        <span className="font-black text-[#1e3a5f] tracking-widest">{coupon.code}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600 font-medium">{coupon.description || "-"}</TableCell>
                    <TableCell>
                      <span className="bg-[#1e3a5f]/10 text-[#1e3a5f] px-2 py-1 rounded-md text-xs font-bold">
                        {coupon.discountDays} dias
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-500 text-xs font-bold">
                      {coupon.expirationDate ? (
                        <div className="flex items-center gap-1">
                          <Calendar size={12} />
                          {format(new Date(coupon.expirationDate), "dd MMM yyyy", { locale: ptBR })}
                        </div>
                      ) : "Vitalício"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={!!(coupon.isActive && !isExpired)}
                          disabled={!!isExpired}
                          onCheckedChange={(val) => toggleMutation.mutate({ id: coupon.id, isActive: val })}
                        />
                        {isExpired ? (
                          <span className="text-red-500 text-[10px] font-bold uppercase flex items-center gap-1">
                            <XCircle size={10} /> Expirado
                          </span>
                        ) : coupon.isActive ? (
                          <span className="text-green-600 text-[10px] font-bold uppercase flex items-center gap-1">
                            <CheckCircle2 size={10} /> Ativo
                          </span>
                        ) : (
                          <span className="text-gray-400 text-[10px] font-bold uppercase">Inativo</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        onClick={() => {
                          if (confirm("Tem certeza que deseja excluir este cupom?")) {
                            deleteMutation.mutate({ id: coupon.id });
                          }
                        }}
                      >
                        <Trash2 size={18} />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
