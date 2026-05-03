import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Edit2, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AdminCategoriesManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminCategoriesManager({ isOpen, onClose }: AdminCategoriesManagerProps) {
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    nameEn: "",
    nameEs: "",
  });

  const utils = trpc.useUtils();
  const { data: categories, isLoading } = (trpc.admin as any).listCategories.useQuery(undefined, { enabled: isOpen });
  const upsertMutation = (trpc.admin as any).upsertCategory.useMutation({
    onSuccess: () => {
      toast.success("Categoria salva!");
      setEditingCategory(null);
      setFormData({ name: "", nameEn: "", nameEs: "" });
      (utils.admin as any).listCategories.invalidate();
    },
    onError: (err: any) => toast.error(err.message)
  });
  
  const deleteMutation = (trpc.admin as any).deleteCategory.useMutation({
    onSuccess: () => {
      toast.success("Categoria excluída.");
      (utils.admin as any).listCategories.invalidate();
    },
    onError: (err: any) => toast.error(err.message)
  });

  const handleEdit = (cat: any) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name || "",
      nameEn: cat.nameEn || "",
      nameEs: cat.nameEs || "",
    });
  };

  const handleNew = () => {
    setEditingCategory({ isNew: true });
    setFormData({ name: "", nameEn: "", nameEs: "" });
  };

  const handleSave = () => {
    if (!formData.name) return toast.error("O nome em português é obrigatório.");
    upsertMutation.mutate({
      id: editingCategory?.id,
      name: formData.name,
      nameEn: formData.nameEn,
      nameEs: formData.nameEs
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-2xl bg-white text-[#1e3a5f] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black uppercase text-[#1e3a5f]">Categorias de Ferramentas</DialogTitle>
          <DialogDescription>Gerencie o catálogo de categorias e suas respectivas traduções internacionais.</DialogDescription>
        </DialogHeader>

        {!editingCategory ? (
          <div className="space-y-4">
             <div className="flex justify-end">
               <Button onClick={handleNew} className="bg-[#1e3a5f] text-[#d4af37] font-bold"><Plus className="w-4 h-4 mr-2" />Nova Categoria</Button>
             </div>
             {isLoading ? (
               <div className="flex justify-center p-8"><Loader2 className="animate-spin text-[#d4af37]" /></div>
             ) : (
               <div className="border rounded-lg overflow-hidden">
                 <table className="w-full text-sm">
                   <thead className="bg-gray-100 uppercase text-xs font-bold">
                     <tr>
                       <th className="p-3 text-left">PT-BR</th>
                       <th className="p-3 text-left">EN</th>
                       <th className="p-3 text-left">ES</th>
                       <th className="p-3 text-right">Ações</th>
                     </tr>
                   </thead>
                   <tbody>
                     {categories?.map((cat: any) => (
                       <tr key={cat.id} className="border-t hover:bg-gray-50">
                         <td className="p-3 font-semibold">{cat.name}</td>
                         <td className="p-3 text-gray-500">{cat.nameEn || "-"}</td>
                         <td className="p-3 text-gray-500">{cat.nameEs || "-"}</td>
                         <td className="p-3 text-right space-x-2">
                           <Button size="icon" variant="ghost" onClick={() => handleEdit(cat)}><Edit2 className="w-4 h-4" /></Button>
                           <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate({ id: cat.id })} className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
                 {(!categories || categories.length === 0) && <p className="text-center p-4 text-gray-400">Nenhuma categoria encontrada.</p>}
               </div>
             )}
          </div>
        ) : (
          <div className="space-y-4 border p-4 rounded-xl bg-gray-50">
             <h3 className="font-bold">{editingCategory.isNew ? "Criando Categoria" : "Editando Categoria"}</h3>
             
             <Tabs defaultValue="pt" className="w-full">
               <TabsList className="grid w-full grid-cols-3">
                 <TabsTrigger value="pt">Português</TabsTrigger>
                 <TabsTrigger value="en">Inglês</TabsTrigger>
                 <TabsTrigger value="es">Espanhol</TabsTrigger>
               </TabsList>
               
               <TabsContent value="pt" className="grid gap-4 mt-4">
                 <div className="grid gap-2">
                   <Label className="font-bold">Nome da Categoria</Label>
                   <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Ex: Estudos e Resumos" className="border-primary" />
                 </div>
               </TabsContent>
               <TabsContent value="en" className="grid gap-4 mt-4">
                 <div className="grid gap-2">
                   <Label className="font-bold">Category Name</Label>
                   <Input value={formData.nameEn} onChange={(e) => setFormData({...formData, nameEn: e.target.value})} placeholder="Ex: Studies and Summaries" />
                 </div>
               </TabsContent>
               <TabsContent value="es" className="grid gap-4 mt-4">
                 <div className="grid gap-2">
                   <Label className="font-bold">Nombre de la Categoría</Label>
                   <Input value={formData.nameEs} onChange={(e) => setFormData({...formData, nameEs: e.target.value})} placeholder="Ex: Estudios y Resúmenes" />
                 </div>
               </TabsContent>
             </Tabs>

             <div className="flex justify-end gap-2 pt-4">
               <Button variant="outline" onClick={() => setEditingCategory(null)}>Cancelar</Button>
               <Button onClick={handleSave} disabled={upsertMutation.isPending} className="bg-[#1e3a5f] text-white">
                 {upsertMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />} Salvar
               </Button>
             </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
