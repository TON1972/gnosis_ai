import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Wrench, Plus, Edit, Trash2, Loader2, Search, ArrowUp, ArrowDown, Star
} from "lucide-react";
import { toast } from "sonner";
import ToolDialog from "@/components/ToolDialog";
import { AdminCategoriesManager } from "./AdminCategoriesManager";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function AdminToolsManager() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<any>(null);
  const [toolToDelete, setToolToDelete] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const utils = trpc.useUtils();

  // Queries e Mutations
  const { data: tools, isLoading } = (trpc.admin as any).listAllTools.useQuery();

  const upsertMutation = (trpc.admin as any).upsertTool.useMutation({
    onSuccess: () => {
        toast.success("Dados e vínculos de planos salvos!");
        (utils.admin as any).listAllTools.invalidate();
        utils.tools.list.invalidate();
        setIsDialogOpen(false);
    },
    onError: (err: any) => toast.error("Erro ao gravar: " + err.message)
  });

  const deleteMutation = (trpc.admin as any).deleteTool.useMutation({
    onSuccess: () => {
      toast.success("Ferramenta excluída permanentemente.");
      (utils.admin as any).listAllTools.invalidate();
      setToolToDelete(null);
    },
    onError: (err: any) => toast.error("Erro ao excluir: " + err.message)
  });

  const featuredMutation = (trpc.admin as any).setToolFeatured.useMutation({
    onSuccess: () => {
      (utils.admin as any).listAllTools.invalidate();
      utils.tools.list.invalidate();
    },
    onError: (err: any) => toast.error("Erro ao destacar: " + err.message)
  });

  const reorderMutation = (trpc.admin as any).reorderTools.useMutation({
    onSuccess: () => {
      (utils.admin as any).listAllTools.invalidate();
      utils.tools.list.invalidate();
    },
    onError: (err: any) => toast.error("Erro ao ordenar: " + err.message)
  });

  const handleSave = (data: any) => {
    upsertMutation.mutate(data);
  };

  const sortedTools = [...(tools ?? [])].sort(
    (a: any, b: any) => (a.order ?? 0) - (b.order ?? 0) || a.id - b.id
  );

  const filteredTools = sortedTools.filter((t: any) =>
    t.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const moveTool = (toolId: number, direction: "up" | "down") => {
    const index = sortedTools.findIndex((t: any) => t.id === toolId);
    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || nextIndex < 0 || nextIndex >= sortedTools.length) return;
    const orderedIds = sortedTools.map((t: any) => t.id);
    [orderedIds[index], orderedIds[nextIndex]] = [orderedIds[nextIndex], orderedIds[index]];
    reorderMutation.mutate({ orderedIds });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header do Componente */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="bg-[#1e3a5f] p-2 rounded-lg shadow-md">
            <Wrench className="w-6 h-6 text-[#d4af37]" />
          </div>
          <div>
            <h2 className="text-xl font-black text-[#1e3a5f] uppercase tracking-tight">Catálogo de Ferramentas</h2>
            <p className="text-sm text-gray-500">Destaque, ordem no painel, prompts e custos de IA.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              placeholder="Buscar ferramenta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border-2 border-gray-100 rounded-xl text-sm focus:border-[#d4af37] outline-none transition-all w-full md:w-64"
            />
          </div>
          <Button 
            onClick={() => setIsCategoriesOpen(true)}
            variant="outline"
            className="border-[#d4af37] text-[#1e3a5f] font-bold"
          >
            Categorias
          </Button>
          <Button 
            onClick={() => { setEditingTool(null); setIsDialogOpen(true); }}
            className="bg-[#1e3a5f] text-[#d4af37] hover:bg-[#2a4a7f] font-bold"
          >
            <Plus className="w-4 h-4 mr-2" /> Nova Tool
          </Button>
        </div>
      </div>

      <Card className="bg-white border border-gray-200 overflow-hidden shadow-sm rounded-2xl">
        {isLoading ? (
          <div className="p-20 flex justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="animate-spin w-12 h-12 text-[#d4af37]" />
              <p className="text-[#1e3a5f] font-bold animate-pulse">Sincronizando catálogo...</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] uppercase text-gray-400 font-black tracking-widest">
                  <th className="py-4 px-4 text-left">Ordem</th>
                  <th className="py-4 px-6 text-left">Tool</th>
                  <th className="py-4 px-4 text-left">Destaque</th>
                  <th className="py-4 px-6 text-left">Custo</th>
                  <th className="py-4 px-6 text-left">Descrição</th>
                  <th className="py-4 px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredTools?.map((tool: any, index: number) => {
                  const isFeatured = tool.isFeatured === true || String(tool.isFeatured) === "true";
                  const canMoveUp = !searchTerm && index > 0;
                  const canMoveDown = !searchTerm && index < filteredTools.length - 1;
                  return (
                  <tr key={tool.id} className="border-b last:border-0 hover:bg-[#FFFACD]/10 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={!canMoveUp || reorderMutation.isPending}
                          onClick={() => moveTool(tool.id, "up")}
                          className="h-8 w-8 p-0 text-[#1e3a5f] hover:bg-[#FFFACD] disabled:opacity-30"
                          aria-label="Subir na ordem"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={!canMoveDown || reorderMutation.isPending}
                          onClick={() => moveTool(tool.id, "down")}
                          className="h-8 w-8 p-0 text-[#1e3a5f] hover:bg-[#FFFACD] disabled:opacity-30"
                          aria-label="Descer na ordem"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-black text-[#1e3a5f]">{tool.displayName}</span>
                      <p className="text-[10px] text-gray-400">ID #{tool.id}</p>
                    </td>
                    <td className="py-4 px-4">
                      <button
                        type="button"
                        onClick={() => featuredMutation.mutate({ id: tool.id, isFeatured: !isFeatured })}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wide cursor-pointer transition-colors ${
                          isFeatured
                            ? "bg-[#d4af37] text-[#1e3a5f]"
                            : "bg-gray-100 text-gray-400 hover:bg-[#FFFACD]"
                        }`}
                        aria-pressed={isFeatured}
                      >
                        <Star className={`w-3.5 h-3.5 ${isFeatured ? "fill-current" : ""}`} />
                        {isFeatured ? "Destaque" : "Normal"}
                      </button>
                    </td>
                    <td className="py-4 px-6">
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-black">
                        {tool.creditCost} CRÉDITOS
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-500 text-sm max-w-xs truncate">
                      {tool.description}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => { setEditingTool(tool); setIsDialogOpen(true); }}
                          className="hover:bg-[#FFFACD] text-[#1e3a5f]"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setToolToDelete(tool.id)}
                          className="hover:bg-red-50 text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
                {filteredTools?.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-20 text-center text-gray-400 italic">
                      Nenhuma ferramenta localizada para esta busca.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modais de Suporte */}
      <ToolDialog 
        isOpen={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)} 
        onSave={handleSave}
        editingTool={editingTool}
      />

      <AdminCategoriesManager 
        isOpen={isCategoriesOpen}
        onClose={() => setIsCategoriesOpen(false)}
      />

      <AlertDialog open={!!toolToDelete} onOpenChange={() => setToolToDelete(null)}>
        <AlertDialogContent className="border-4 border-[#1e3a5f] bg-white rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black text-[#1e3a5f] uppercase tracking-tighter">Excluir ferramenta?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500 font-medium">
              A ferramenta <strong>#{toolToDelete}</strong> será removida permanentemente. Usuários perderão acesso imediato a ela.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="font-bold border-gray-200">Manter ferramenta</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => toolToDelete && deleteMutation.mutate({ id: toolToDelete })}
              className="bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              Sim, excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}