import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Wrench, Plus, Edit, Trash2, ArrowLeft, Loader2 
} from "lucide-react";
import { toast } from "sonner";
import { APP_LOGO, APP_TITLE } from "@/const";
import ToolDialog from "@/components/ToolDialog";
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

export default function AdminTools() {
  const [, setLocation] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<any>(null);
  const [toolToDelete, setToolToDelete] = useState<number | null>(null);

  // ✅ Atualizado: useUtils é o padrão mais recente para invalidar queries
  const utils = trpc.useUtils();

  // Queries e Mutations com tipagem forçada para evitar erros de cache do TS
  const { data: tools, isLoading } = (trpc.admin as any).listAllTools.useQuery();

  const upsertMutation = (trpc.admin as any).upsertTool.useMutation({
    onSuccess: () => {
        toast.success("Dados e vínculos de planos salvos!");
        (utils.admin as any).listAllTools.invalidate();
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

  const handleSave = (data: any) => {
    upsertMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-radial from-[#d4af37] via-[#DAA520] to-[#FFFACD]">
      {/* Header Estilizado */}
      <header className="bg-[#1e3a5f] shadow-lg border-b-4 border-[#d4af37] py-6 px-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/">
              <img src={APP_LOGO} alt="Logo" className="h-12 w-12 cursor-pointer" />
            </Link>
            <h1 className="text-2xl font-bold text-[#d4af37]">Gerenciar Tools</h1>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setLocation("/admin")}
              className="border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-[#1e3a5f]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Painel Admin
            </Button>
            <Button 
              onClick={() => { setEditingTool(null); setIsDialogOpen(true); }}
              className="bg-[#d4af37] text-[#1e3a5f] hover:bg-[#B8860B]"
            >
              <Plus className="w-4 h-4 mr-2" /> Nova Tool
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="bg-white/90 border-4 border-[#d4af37] overflow-hidden shadow-2xl">
          <div className="p-6 bg-[#1e3a5f] text-[#d4af37] flex items-center gap-3">
            <Wrench className="w-6 h-6" />
            <h2 className="text-xl font-bold">Catálogo de Ferramentas IA</h2>
          </div>

          {isLoading ? (
            <div className="p-20 flex justify-center">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="animate-spin w-12 h-12 text-[#1e3a5f]" />
                <p className="text-[#1e3a5f] font-semibold">Carregando ferramentas...</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-[#d4af37] bg-[#fdfaf0]">
                    <th className="py-4 px-6 text-left text-[#1e3a5f] font-bold">Tool</th>
                    <th className="py-4 px-6 text-left text-[#1e3a5f] font-bold">Custo</th>
                    <th className="py-4 px-6 text-left text-[#1e3a5f] font-bold">Descrição</th>
                    <th className="py-4 px-6 text-right text-[#1e3a5f] font-bold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {tools?.map((tool: any) => (
                    <tr key={tool.id} className="border-b border-[#d4af37]/30 hover:bg-[#FFFACD]/30 transition-colors">
                      <td className="py-4 px-6">
                        <span className="font-bold text-[#1e3a5f]">{tool.displayName}</span>
                        <p className="text-xs text-[#8b6f47]">ID: {tool.id}</p>
                      </td>
                      <td className="py-4 px-6">
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">
                          {tool.creditCost} créditos
                        </span>
                      </td>
                      <td className="py-4 px-6 text-[#8b6f47] max-w-xs truncate">
                        {tool.description}
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => { setEditingTool(tool); setIsDialogOpen(true); }}
                          className="border-[#d4af37] text-[#1e3a5f] hover:bg-blue-50"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => setToolToDelete(tool.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {tools?.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-[#8b6f47] italic">
                        Nenhuma ferramenta cadastrada ainda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>

      {/* Modais */}
      <ToolDialog 
        isOpen={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)} 
        onSave={handleSave}
        editingTool={editingTool}
      />

      <AlertDialog open={!!toolToDelete} onOpenChange={() => setToolToDelete(null)}>
        <AlertDialogContent className="border-4 border-red-600 bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold text-red-600">Deseja realmente excluir?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Esta ação não pode ser desfeita. A ferramenta será removida permanentemente do sistema e afetará os créditos dos usuários.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="border-gray-300">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => toolToDelete && deleteMutation.mutate({ id: toolToDelete })}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}