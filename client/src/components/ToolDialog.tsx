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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  displayNameEn?: string | null;
  descriptionEn?: string | null;
  inputPlaceholderEn?: string | null;
  promptTemplateEn?: string | null;
  displayNameEs?: string | null;
  descriptionEs?: string | null;
  inputPlaceholderEs?: string | null;
  promptTemplateEs?: string | null;
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
    displayNameEn: "",
    descriptionEn: "",
    inputPlaceholderEn: "",
    promptTemplateEn: "",
    displayNameEs: "",
    descriptionEs: "",
    inputPlaceholderEs: "",
    promptTemplateEs: "",
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
        displayNameEn: editingTool.displayNameEn || "",
        descriptionEn: editingTool.descriptionEn || "",
        inputPlaceholderEn: editingTool.inputPlaceholderEn || "",
        promptTemplateEn: editingTool.promptTemplateEn || "",
        displayNameEs: editingTool.displayNameEs || "",
        descriptionEs: editingTool.descriptionEs || "",
        inputPlaceholderEs: editingTool.inputPlaceholderEs || "",
        promptTemplateEs: editingTool.promptTemplateEs || "",
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
        displayNameEn: "",
        descriptionEn: "",
        inputPlaceholderEn: "",
        promptTemplateEn: "",
        displayNameEs: "",
        descriptionEs: "",
        inputPlaceholderEs: "",
        promptTemplateEs: "",
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

        <div className="grid gap-4 py-2">
          {/* Idiomas */}
          <Tabs defaultValue="pt" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pt">Português</TabsTrigger>
              <TabsTrigger value="en">Inglês</TabsTrigger>
              <TabsTrigger value="es">Espanhol</TabsTrigger>
            </TabsList>
            <TabsContent value="pt" className="grid gap-4 mt-4">
              <div className="grid gap-2">
                <Label className="text-[#1e3a5f] font-bold">Nome Exibido</Label>
                <Input
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="border-2 border-[#d4af37]"
                  placeholder="Ex: Hermenêutica Avançada"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-[#1e3a5f] font-bold">Descrição (Subtítulo)</Label>
                <Input
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="border-2 border-[#d4af37]"
                  placeholder="Breve explicação da função..."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="placeholder" className="text-[#1e3a5f] font-bold flex items-center gap-2">
                  <AlignLeft className="w-4 h-4" /> Placeholder (Exemplo de IA)
                </Label>
                <Textarea
                  id="placeholder"
                  value={formData.inputPlaceholder || ""}
                  onChange={(e) => setFormData({ ...formData, inputPlaceholder: e.target.value })}
                  className="border-2 border-[#d4af37] bg-blue-50/20 min-h-25 resize-none"
                  placeholder={"Exemplo:\nDigite a referência bíblica..."}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="prompt" className="text-[#1e3a5f] font-bold">Prompt do Sistema (IA)</Label>
                <Textarea
                  id="prompt"
                  value={formData.promptTemplate || ""}
                  onChange={(e) => setFormData({ ...formData, promptTemplate: e.target.value })}
                  className="border-2 border-[#d4af37] h-32 font-mono text-xs"
                  placeholder="Instruções de como a IA deve se comportar..."
                />
              </div>
            </TabsContent>
            
            <TabsContent value="en" className="grid gap-4 mt-4">
              <div className="grid gap-2">
                <Label className="text-[#1e3a5f] font-bold">Display Name (EN)</Label>
                <Input
                  value={formData.displayNameEn || ""}
                  onChange={(e) => setFormData({ ...formData, displayNameEn: e.target.value })}
                  className="border-2 border-[#d4af37]"
                  placeholder="Ex: Advanced Hermeneutics"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-[#1e3a5f] font-bold">Description (EN)</Label>
                <Input
                  value={formData.descriptionEn || ""}
                  onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                  className="border-2 border-[#d4af37]"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-[#1e3a5f] font-bold flex items-center gap-2">
                  <AlignLeft className="w-4 h-4" /> Placeholder (EN)
                </Label>
                <Textarea
                  value={formData.inputPlaceholderEn || ""}
                  onChange={(e) => setFormData({ ...formData, inputPlaceholderEn: e.target.value })}
                  className="border-2 border-[#d4af37] bg-blue-50/20 min-h-25 resize-none"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-[#1e3a5f] font-bold">Prompt Template (EN)</Label>
                <Textarea
                  value={formData.promptTemplateEn || ""}
                  onChange={(e) => setFormData({ ...formData, promptTemplateEn: e.target.value })}
                  className="border-2 border-[#d4af37] h-32 font-mono text-xs"
                />
              </div>
            </TabsContent>

            <TabsContent value="es" className="grid gap-4 mt-4">
              <div className="grid gap-2">
                <Label className="text-[#1e3a5f] font-bold">Nombre a Mostrar (ES)</Label>
                <Input
                  value={formData.displayNameEs || ""}
                  onChange={(e) => setFormData({ ...formData, displayNameEs: e.target.value })}
                  className="border-2 border-[#d4af37]"
                  placeholder="Ej: Hermenéutica Avanzada"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-[#1e3a5f] font-bold">Descripción (ES)</Label>
                <Input
                  value={formData.descriptionEs || ""}
                  onChange={(e) => setFormData({ ...formData, descriptionEs: e.target.value })}
                  className="border-2 border-[#d4af37]"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-[#1e3a5f] font-bold flex items-center gap-2">
                  <AlignLeft className="w-4 h-4" /> Placeholder (ES)
                </Label>
                <Textarea
                  value={formData.inputPlaceholderEs || ""}
                  onChange={(e) => setFormData({ ...formData, inputPlaceholderEs: e.target.value })}
                  className="border-2 border-[#d4af37] bg-blue-50/20 min-h-25 resize-none"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-[#1e3a5f] font-bold">Prompt Template (ES)</Label>
                <Textarea
                  value={formData.promptTemplateEs || ""}
                  onChange={(e) => setFormData({ ...formData, promptTemplateEs: e.target.value })}
                  className="border-2 border-[#d4af37] h-32 font-mono text-xs"
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Configurações Gerais - IA */}
          <div className="grid grid-cols-2 gap-4 border-t pt-4">
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
            <div className="grid gap-2">
              <Label className="text-[#1e3a5f] font-bold">Custo Base</Label>
              <Input
                type="number"
                value={formData.creditCost}
                onChange={(e) => setFormData({ ...formData, creditCost: Number(e.target.value) })}
                className="border-2 border-[#d4af37]"
              />
            </div>
          </div>

          <div className="grid gap-2 p-4 border-2 border-[#d4af37] bg-[#fdfaf0] rounded-lg mt-4">
            <Label className="text-[#1e3a5f] font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Planos Autorizados
              {isLoadingPlans && <Loader2 className="w-3 h-3 animate-spin" />}
            </Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {allPlans?.map((plan: any) => (
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

          <div className="grid gap-2 mt-2">
            <Label className="text-[#1e3a5f] font-bold">Visibilidade</Label>
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

        <DialogFooter className="gap-2 sm:gap-0 mt-4">
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