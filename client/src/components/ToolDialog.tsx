import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ShieldCheck } from "lucide-react";

interface Tool {
  id?: number;
  displayName: string;
  description: string | null;
  promptTemplate: string | null;
  creditCost: number;
  categoryId: number | null;
  isActive: boolean; 
  planIds?: number[]; 
}

interface ToolDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tool: Tool) => void;
  editingTool: Tool | null;
}

export default function ToolDialog({ isOpen, onClose, onSave, editingTool }: ToolDialogProps) {
  const [formData, setFormData] = useState<Tool>({
    displayName: "",
    description: "",
    promptTemplate: "",
    creditCost: 50,
    categoryId: null,
    isActive: true,
    planIds: [],
  });

  // Queries para popular o modal
  const { data: categories } = (trpc.admin as any).listCategories.useQuery(undefined, {
    enabled: isOpen,
  });

  const { data: allPlans } = trpc.plans.list.useQuery(undefined, {
    enabled: isOpen,
  });

  // ✅ Busca os vínculos existentes para marcar os checkboxes
  const { data: toolPlans, isLoading: isLoadingPlans } = (trpc.admin as any).getToolPlans.useQuery(
    { toolId: editingTool?.id },
    { 
      enabled: !!editingTool?.id && isOpen,
      // Garante que não usaremos cache antigo ao trocar de ferramenta
      refetchOnWindowFocus: false 
    }
  );

  // ✅ Efeito de Sincronização: Monitora a abertura e a chegada dos dados dos planos
  useEffect(() => {
    if (editingTool && isOpen) {
      // Extrai os IDs dos planos que vieram da query de relacionamento
      const planIdsFromDb = toolPlans?.map((p: any) => p.planId) || [];

      setFormData({
        ...editingTool,
        description: editingTool.description || "",
        promptTemplate: editingTool.promptTemplate || "",
        categoryId: editingTool.categoryId || null,
        // Garante que isActive seja tratado como boolean real
        isActive: editingTool.isActive === true || String(editingTool.isActive) === "true",
        planIds: planIdsFromDb, 
      });
    } else if (!editingTool && isOpen) {
      // Reset para nova ferramenta
      setFormData({
        displayName: "",
        description: "",
        promptTemplate: "",
        creditCost: 50,
        categoryId: null,
        isActive: true,
        planIds: [],
      });
    }
    // 'toolPlans' é a dependência crucial para marcar os checkboxes após o carregamento da API
  }, [editingTool, isOpen, toolPlans]); 

  const togglePlan = (planId: number) => {
    setFormData(prev => {
      const currentIds = prev.planIds || [];
      if (currentIds.includes(planId)) {
        return { ...prev, planIds: currentIds.filter(id => id !== planId) };
      }
      return { ...prev, planIds: [...currentIds, planId] };
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px] bg-white border-4 border-[#d4af37] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#1e3a5f]">
            {editingTool ? "Editar Ferramenta" : "Nova Ferramenta Teológica"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Configurações de IA, custos e permissões por plano.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-[#1e3a5f] font-bold">Nome Exibido</Label>
              <Input
                id="name"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="border-2 border-[#d4af37]"
              />
            </div>

            <div className="grid gap-2">
              <Label className="text-[#1e3a5f] font-bold">Categoria</Label>
              <Select 
                value={formData.categoryId?.toString() || "none"} 
                onValueChange={(val) => setFormData({ ...formData, categoryId: val === "none" ? null : Number(val) })}
              >
                <SelectTrigger className="border-2 border-[#d4af37]">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem Categoria</SelectItem>
                  {categories?.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="desc" className="text-[#1e3a5f] font-bold">Descrição</Label>
            <Input
              id="desc"
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="border-2 border-[#d4af37]"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="prompt" className="text-[#1e3a5f] font-bold">Prompt do Sistema</Label>
            <Textarea
              id="prompt"
              value={formData.promptTemplate || ""}
              onChange={(e) => setFormData({ ...formData, promptTemplate: e.target.value })}
              className="border-2 border-[#d4af37] h-28 font-mono text-xs"
            />
          </div>

          {/* ✅ Seção de Planos com Checkboxes */}
          <div className="grid gap-2 p-4 border-2 border-[#d4af37] bg-[#fdfaf0] rounded-lg">
            <Label className="text-[#1e3a5f] font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Planos Autorizados
              {isLoadingPlans && <Loader2 className="w-3 h-3 animate-spin" />}
            </Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {allPlans?.map((plan) => (
                <label key={plan.id} className="flex items-center gap-3 p-2 bg-white border border-[#d4af37]/30 rounded hover:bg-[#FFFACD] cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.planIds?.includes(plan.id)}
                    onChange={() => togglePlan(plan.id)}
                    className="w-4 h-4 accent-[#1e3a5f]"
                  />
                  <span className="text-sm font-medium text-[#1e3a5f]">{plan.displayName}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label className="text-[#1e3a5f] font-bold">Custo (Créditos)</Label>
              <Input
                type="number"
                value={formData.creditCost}
                onChange={(e) => setFormData({ ...formData, creditCost: Number(e.target.value) })}
                className="border-2 border-[#d4af37]"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-[#1e3a5f] font-bold">Status</Label>
              <Select 
                value={formData.isActive ? "true" : "false"} 
                onValueChange={(val) => setFormData({ ...formData, isActive: val === "true" })}
              >
                <SelectTrigger className="border-2 border-[#d4af37]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Ativo</SelectItem>
                  <SelectItem value="false">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button 
            onClick={() => onSave(formData)} 
            className="bg-[#1e3a5f] text-[#d4af37] hover:bg-[#2a4a7f]"
          >
            {editingTool ? "Salvar Alterações" : "Criar Ferramenta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}