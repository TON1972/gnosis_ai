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
import { Loader2, ShieldCheck, Type, AlignLeft } from "lucide-react";

interface Tool {
  id?: number;
  displayName: string;
  description: string | null;
  inputPlaceholder?: string | null;
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
    inputPlaceholder: "",
    promptTemplate: "",
    creditCost: 50,
    categoryId: null,
    isActive: true,
    planIds: [],
  });

  const { data: categories } = (trpc.admin as any).listCategories.useQuery(undefined, {
    enabled: isOpen,
  });

  const { data: allPlans } = trpc.plans.list.useQuery(undefined, {
    enabled: isOpen,
  });

  const { data: toolPlans, isLoading: isLoadingPlans } = (trpc.admin as any).getToolPlans.useQuery(
    { toolId: editingTool?.id },
    { 
      enabled: !!editingTool?.id && isOpen,
      refetchOnWindowFocus: false 
    }
  );

  useEffect(() => {
    if (editingTool && isOpen) {
      const planIdsFromDb = toolPlans?.map((p: any) => p.planId) || [];

      setFormData({
        ...editingTool,
        description: editingTool.description || "",
        inputPlaceholder: editingTool.inputPlaceholder || "",
        promptTemplate: editingTool.promptTemplate || "",
        categoryId: editingTool.categoryId || null,
        isActive: editingTool.isActive === true || String(editingTool.isActive) === "true",
        planIds: planIdsFromDb, 
      });
    } else if (!editingTool && isOpen) {
      setFormData({
        displayName: "",
        description: "",
        inputPlaceholder: "",
        promptTemplate: "",
        creditCost: 50,
        categoryId: null,
        isActive: true,
        planIds: [],
      });
    }
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
      <DialogContent className="sm:max-w-162.5 bg-white border-4 border-[#d4af37] max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#1e3a5f]">
            {editingTool ? "Editar Ferramenta" : "Nova Ferramenta Teológica"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Configurações de IA, placeholders com quebra de linha, custos e permissões por plano.
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
                placeholder="Ex: Hermenêutica Avançada"
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
            <Label htmlFor="desc" className="text-[#1e3a5f] font-bold">Descrição (Subtítulo)</Label>
            <Input
              id="desc"
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="border-2 border-[#d4af37]"
              placeholder="Breve explicação da função da ferramenta"
            />
          </div>

          {/* ✅ ALTERADO PARA TEXTAREA: Placeholder do Input */}
          <div className="grid gap-2">
            <Label htmlFor="placeholder" className="text-[#1e3a5f] font-bold flex items-center gap-2">
              <AlignLeft className="w-4 h-4" /> Placeholder (Suporta quebra de linha / Exemplos)
            </Label>
            <Textarea
              id="placeholder"
              value={formData.inputPlaceholder || ""}
              onChange={(e) => setFormData({ ...formData, inputPlaceholder: e.target.value })}
              className="border-2 border-[#d4af37] bg-blue-50/20 min-h-25 resize-none"
              placeholder={"Exemplo:\nDigite a referência bíblica...\n\nJoão 3:16"}
            />
            <p className="text-[10px] text-slate-500 italic">Pressione Enter no campo acima para criar quebras de linha no exemplo que o usuário verá.</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="prompt" className="text-[#1e3a5f] font-bold">Prompt do Sistema (Instruções da IA)</Label>
            <Textarea
              id="prompt"
              value={formData.promptTemplate || ""}
              onChange={(e) => setFormData({ ...formData, promptTemplate: e.target.value })}
              className="border-2 border-[#d4af37] h-32 font-mono text-xs"
              placeholder="Instruções detalhadas de como a IA deve se comportar..."
            />
          </div>

          {/* Seção de Planos com Checkboxes */}
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
              <Label className="text-[#1e3a5f] font-bold">Custo Base (Créditos)</Label>
              <Input
                type="number"
                value={formData.creditCost}
                onChange={(e) => setFormData({ ...formData, creditCost: Number(e.target.value) })}
                className="border-2 border-[#d4af37]"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-[#1e3a5f] font-bold">Status de Visibilidade</Label>
              <Select 
                value={formData.isActive ? "true" : "false"} 
                onValueChange={(val) => setFormData({ ...formData, isActive: val === "true" })}
              >
                <SelectTrigger className="border-2 border-[#d4af37]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Ativo (Visível)</SelectItem>
                  <SelectItem value="false">Inativo (Oculto)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} className="border-gray-300 font-bold">Cancelar</Button>
          <Button 
            onClick={() => onSave(formData)} 
            className="bg-[#1e3a5f] text-[#d4af37] hover:bg-[#2a4a7f] font-bold"
          >
            {editingTool ? "Salvar Alterações" : "Criar Ferramenta"}
          </Button>
        </DialogFooter>
      </DialogContent>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #d4af37; border-radius: 10px; }
      `}</style>
    </Dialog>
  );
}