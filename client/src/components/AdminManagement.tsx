import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { UserPlus, Trash2, Shield } from "lucide-react";
import { toast } from "sonner";

export default function AdminManagement() {
  const [email, setEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<"admin" | "super_admin">("admin");

  const { data: adminList, refetch } = trpc.admin.listAdmins.useQuery();
  const addAdminMutation = trpc.admin.addAdmin.useMutation();
  const removeAdminMutation = trpc.admin.removeAdmin.useMutation();

  const handleAddAdmin = async () => {
    if (!email.trim()) {
      toast.error("Digite um email válido");
      return;
    }

    try {
      await addAdminMutation.mutateAsync({
        email: email.trim(),
        role: selectedRole,
      });
      toast.success(`Administrador adicionado com sucesso!`);
      setEmail("");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao adicionar administrador");
    }
  };

  const handleRemoveAdmin = async (userId: number) => {
    if (!confirm("Tem certeza que deseja remover este administrador?")) {
      return;
    }

    try {
      await removeAdminMutation.mutateAsync({ userId });
      toast.success("Administrador removido com sucesso!");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover administrador");
    }
  };

  return (
    <Card className="p-6 bg-white/90 border-4 border-[#d4af37]">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-6 h-6 text-[#d4af37]" />
        <h2 className="text-2xl font-bold text-[#1e3a5f]">Gerenciamento de Administradores</h2>
      </div>

      {/* Add Admin Form */}
      <div className="mb-8 p-6 bg-[#FFFACD]/50 rounded-lg border-2 border-[#d4af37]">
        <h3 className="text-lg font-bold text-[#1e3a5f] mb-4">Adicionar Novo Administrador</h3>
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email do usuário"
            className="flex-1 border-2 border-[#d4af37] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
          />
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as "admin" | "super_admin")}
            className="border-2 border-[#d4af37] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
          >
            <option value="admin">Administrador</option>
            <option value="super_admin">Super Administrador</option>
          </select>
          <Button
            onClick={handleAddAdmin}
            className="bg-[#1e3a5f] text-[#d4af37] hover:bg-[#2a4a7f]"
            disabled={addAdminMutation.isPending}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Adicionar
          </Button>
        </div>
        <div className="mt-4 text-sm text-[#8b6f47]">
          <p><strong>Administrador:</strong> Acesso ao painel administrativo (visualização)</p>
          <p><strong>Super Administrador:</strong> Acesso completo + gerenciamento de admins</p>
        </div>
      </div>

      {/* Admin List */}
      <div>
        <h3 className="text-lg font-bold text-[#1e3a5f] mb-4">Lista de Administradores</h3>
        {adminList && adminList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-[#d4af37]">
                  <th className="text-left py-3 px-4 text-[#1e3a5f] font-bold">Nome</th>
                  <th className="text-left py-3 px-4 text-[#1e3a5f] font-bold">Email</th>
                  <th className="text-left py-3 px-4 text-[#1e3a5f] font-bold">Nível</th>
                  <th className="text-left py-3 px-4 text-[#1e3a5f] font-bold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {adminList.map((admin) => (
                  <tr key={admin.id} className="border-b border-[#d4af37]/30 hover:bg-[#FFFACD]/50">
                    <td className="py-3 px-4 text-[#1e3a5f]">{admin.name || "Sem nome"}</td>
                    <td className="py-3 px-4 text-[#1e3a5f]">{admin.email || "Sem email"}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          admin.role === "super_admin"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {admin.role === "super_admin" ? "Super Admin" : "Admin"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {admin.role !== "super_admin" && (
                        <Button
                          onClick={() => handleRemoveAdmin(admin.id)}
                          variant="outline"
                          size="sm"
                          className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                          disabled={removeAdminMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remover
                        </Button>
                      )}
                      {admin.role === "super_admin" && (
                        <span className="text-sm text-[#8b6f47] italic">Protegido</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-[#8b6f47] py-8">Nenhum administrador cadastrado.</p>
        )}
      </div>
    </Card>
  );
}

