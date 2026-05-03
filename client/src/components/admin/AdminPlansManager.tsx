import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Edit2 } from "lucide-react";

export function AdminPlansManager() {
    const { data: plans, isLoading, refetch } = trpc.plans.list.useQuery();
    const updatePlanMutation = trpc.admin.updatePlan.useMutation();

    const [editingPlan, setEditingPlan] = useState<any>(null);
    const [formData, setFormData] = useState({
        creditsDaily: 0,
        creditsInitial: 0,
        syncUsers: false,
        priceMonthly: 0,
        priceMonthlyUsd: 0,
        priceMonthlyEur: 0,
        displayName: "",
        displayNameEn: "",
        displayNameEs: "",
        description: "",
        descriptionEn: "",
        descriptionEs: "",
    });

    const handleEdit = (plan: any) => {
        setEditingPlan(plan);
        setFormData({
            creditsDaily: plan.creditsDaily,
            creditsInitial: plan.creditsInitial,
            syncUsers: false,
            priceMonthly: plan.priceMonthly / 100,
            priceMonthlyUsd: (plan.priceMonthlyUsd || 0) / 100,
            priceMonthlyEur: (plan.priceMonthlyEur || 0) / 100,
            displayName: plan.displayName || "",
            displayNameEn: plan.displayNameEn || "",
            displayNameEs: plan.displayNameEs || "",
            description: plan.description || "",
            descriptionEn: plan.descriptionEn || "",
            descriptionEs: plan.descriptionEs || "",
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
                priceMonthly: formData.priceMonthly,
                priceMonthlyUsd: formData.priceMonthlyUsd,
                priceMonthlyEur: formData.priceMonthlyEur,
                displayNameEn: formData.displayNameEn,
                descriptionEn: formData.descriptionEn,
                displayNameEs: formData.displayNameEs,
                descriptionEs: formData.descriptionEs,
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
            <div className="flex justify-center items-center py-20 text-[#d4af37]">
                <Loader2 className="w-10 h-10 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4 mb-4">
                <h1 className="text-2xl font-bold text-[#1e3a5f]">Gerenciar Planos</h1>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {plans?.map((plan: any) => (
                    <Card key={plan.id} className="border-t-4 border-[#d4af37] shadow-md hover:shadow-lg transition-shadow bg-white">
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
                                <span className="text-gray-600">Mensal (BRL)</span>
                                <span className="font-bold text-[#1e3a5f]">R$ {(plan.priceMonthly / 100).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-600">Mensal (USD/EUR)</span>
                                <span className="font-bold text-[#1e3a5f]">${((plan.priceMonthlyUsd || 0) / 100).toFixed(2)} / €{((plan.priceMonthlyEur || 0) / 100).toFixed(2)}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Modal de Edição */}
            <Dialog open={!!editingPlan} onOpenChange={(open) => !open && setEditingPlan(null)}>
                <DialogContent className="sm:max-w-2xl bg-white text-[#1e3a5f]">
                    <DialogHeader>
                        <DialogTitle>Editar Plano: {editingPlan?.displayName}</DialogTitle>
                        <DialogDescription>
                            Ajuste textos internacionais, créditos e preços.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-2">
                       <Tabs defaultValue="values" className="w-full">
                         <TabsList className="grid w-full grid-cols-4">
                           <TabsTrigger value="values">Valores/Créditos</TabsTrigger>
                           <TabsTrigger value="pt">PT</TabsTrigger>
                           <TabsTrigger value="en">EN</TabsTrigger>
                           <TabsTrigger value="es">ES</TabsTrigger>
                         </TabsList>

                         <TabsContent value="values" className="grid gap-4 mt-4">
                             <div className="grid grid-cols-2 gap-4">
                               <div className="grid gap-2">
                                   <Label>Diários</Label>
                                   <Input type="number" value={formData.creditsDaily} onChange={(e) => setFormData({ ...formData, creditsDaily: Number(e.target.value) })} />
                               </div>
                               <div className="grid gap-2">
                                   <Label>Mensais</Label>
                                   <Input type="number" value={formData.creditsInitial} onChange={(e) => setFormData({ ...formData, creditsInitial: Number(e.target.value) })} />
                               </div>
                             </div>
                             <div className="grid grid-cols-3 gap-4">
                               <div className="grid gap-2">
                                   <Label>Preço Mensal (BRL)</Label>
                                   <Input type="number" value={formData.priceMonthly} onChange={(e) => setFormData({ ...formData, priceMonthly: Number(e.target.value) })} />
                               </div>
                               <div className="grid gap-2">
                                   <Label>Preço Mensal (USD)</Label>
                                   <Input type="number" value={formData.priceMonthlyUsd} onChange={(e) => setFormData({ ...formData, priceMonthlyUsd: Number(e.target.value) })} />
                               </div>
                               <div className="grid gap-2">
                                   <Label>Preço Mensal (EUR)</Label>
                                   <Input type="number" value={formData.priceMonthlyEur} onChange={(e) => setFormData({ ...formData, priceMonthlyEur: Number(e.target.value) })} />
                               </div>
                             </div>
                         </TabsContent>

                         <TabsContent value="pt" className="grid gap-4 mt-4">
                            <div className="grid gap-2">
                                <Label>Nome Exibido</Label>
                                <Input disabled value={formData.displayName} placeholder="Padrão do banco..." />
                            </div>
                         </TabsContent>

                         <TabsContent value="en" className="grid gap-4 mt-4">
                            <div className="grid gap-2">
                                <Label>Display Name</Label>
                                <Input value={formData.displayNameEn} onChange={(e) => setFormData({ ...formData, displayNameEn: e.target.value })} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Description</Label>
                                <Input value={formData.descriptionEn} onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })} />
                            </div>
                         </TabsContent>

                         <TabsContent value="es" className="grid gap-4 mt-4">
                            <div className="grid gap-2">
                                <Label>Nombre Mostrado</Label>
                                <Input value={formData.displayNameEs} onChange={(e) => setFormData({ ...formData, displayNameEs: e.target.value })} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Descripción</Label>
                                <Input value={formData.descriptionEs} onChange={(e) => setFormData({ ...formData, descriptionEs: e.target.value })} />
                            </div>
                         </TabsContent>
                       </Tabs>

                        <div className="flex items-center gap-4 mt-6 border-t pt-4">
                            <Switch
                                id="sync"
                                checked={formData.syncUsers}
                                onCheckedChange={(checked) => setFormData({ ...formData, syncUsers: checked })}
                            />
                            <div className="grid gap-1.5 leading-none">
                                <Label htmlFor="sync" className="font-bold text-red-600">
                                    Sincronizar Assinantes Ativos?
                                </Label>
                                <p className="text-xs text-muted-foreground leading-tight">
                                    Atualiza saldo de todos os usuários neste plano.
                                </p>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingPlan(null)}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={updatePlanMutation.isPending} className="bg-[#1e3a5f] text-white hover:bg-[#2a4a7f]">
                            {updatePlanMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
