import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Edit2 } from "lucide-react";
import { Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";

export default function AdminPlansPage() {
    const { data: plans, isLoading, refetch } = trpc.plans.list.useQuery();
    const updatePlanMutation = trpc.admin.updatePlan.useMutation();

    const [editingPlan, setEditingPlan] = useState<any>(null);
    const [formData, setFormData] = useState({
        creditsDaily: 0,
        creditsInitial: 0,
        syncUsers: false,
    });

    const handleEdit = (plan: any) => {
        setEditingPlan(plan);
        setFormData({
            creditsDaily: plan.creditsDaily,
            creditsInitial: plan.creditsInitial,
            syncUsers: false,
        });
    };

    const handleSave = async () => {
        if (!editingPlan) return;

        try {
            await updatePlanMutation.mutateAsync({
                planId: editingPlan.id,
                creditsDaily: formData.creditsDaily,
                creditsInitial: formData.creditsInitial,
                syncUsers: formData.syncUsers,
            });

            toast.success("Plano atualizado com sucesso!");
            setEditingPlan(null);
            refetch();
        } catch (error) {
            toast.error("Erro ao atualizar plano.");
            console.error(error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-[#1e3a5f]">
                <Loader2 className="w-10 h-10 animate-spin text-[#d4af37]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f3f4f6]">
            {/* Reusing the sidebar layout might require wrapping this or just simple page structure if DashboardLayout handles it */}
            <DashboardLayout>
                <div className="p-8 space-y-8">
                    <div className="flex items-center gap-4 mb-8">
                        <Link href="/admin">
                            <Button variant="outline">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Voltar
                            </Button>
                        </Link>
                        <h1 className="text-3xl font-bold text-[#1e3a5f]">Gerenciar Planos</h1>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {plans?.map((plan: any) => (
                            <Card key={plan.id} className="border-t-4 border-[#d4af37] shadow-md hover:shadow-lg transition-shadow">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xl font-bold flex justify-between items-center text-[#1e3a5f]">
                                        {plan.displayName}
                                        <Button size="icon" variant="ghost" onClick={() => handleEdit(plan)}>
                                            <Edit2 className="w-4 h-4 text-[#d4af37]" />
                                        </Button>
                                    </CardTitle>
                                    <CardDescription className="uppercase tracking-widest text-[#8b6f47] text-xs font-bold">
                                        {plan.name}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-4">
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-gray-600">Créditos Diários</span>
                                        <span className="font-bold text-[#1e3a5f]">{plan.creditsDaily}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-gray-600">Créditos Mensais</span>
                                        <span className="font-bold text-[#1e3a5f]">{plan.creditsInitial}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-gray-600">Preço Mensal</span>
                                        <span className="font-bold text-[#1e3a5f]">R$ {(plan.priceMonthly / 100).toFixed(2)}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Modal de Edição */}
                    <Dialog open={!!editingPlan} onOpenChange={(open) => !open && setEditingPlan(null)}>
                        <DialogContent className="sm:max-w-[425px] bg-white">
                            <DialogHeader>
                                <DialogTitle>Editar Plano: {editingPlan?.displayName}</DialogTitle>
                                <DialogDescription>
                                    Ajuste os créditos. Use com cuidado ao sincronizar.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="daily" className="text-right">
                                        Diários
                                    </Label>
                                    <Input
                                        id="daily"
                                        type="number"
                                        value={formData.creditsDaily}
                                        onChange={(e) => setFormData({ ...formData, creditsDaily: Number(e.target.value) })}
                                        className="col-span-3"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="monthly" className="text-right">
                                        Mensais
                                    </Label>
                                    <Input
                                        id="monthly"
                                        type="number"
                                        value={formData.creditsInitial}
                                        onChange={(e) => setFormData({ ...formData, creditsInitial: Number(e.target.value) })}
                                        className="col-span-3"
                                    />
                                </div>

                                <div className="flex items-center gap-4 border-t pt-4">
                                    <Switch
                                        id="sync"
                                        checked={formData.syncUsers}
                                        onCheckedChange={(checked) => setFormData({ ...formData, syncUsers: checked })}
                                    />
                                    <div className="grid gap-1.5 leading-none">
                                        <Label htmlFor="sync" className="font-bold text-red-600">
                                            Sincronizar Assinantes Ativos?
                                        </Label>
                                        <p className="text-xs text-muted-foreground">
                                            Isso atualizará IMEDIATAMENTE o saldo de todos os usuários neste plano para os novos valores.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setEditingPlan(null)}>Cancelar</Button>
                                <Button onClick={handleSave} disabled={updatePlanMutation.isPending} className="bg-[#1e3a5f] text-white hover:bg-[#2a4a7f]">
                                    {updatePlanMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Salvar Alterações
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </DashboardLayout>
        </div>
    );
}
