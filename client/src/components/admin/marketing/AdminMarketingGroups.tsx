import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Loader2, Users, Save, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

export function AdminMarketingGroups() {
    const [name, setName] = useState("");
    const [targetPlans, setTargetPlans] = useState<string>("");
    const [targetRoles, setTargetRoles] = useState<string>("");
    const [targetSubscriptions, setTargetSubscriptions] = useState<string>("");
    const [targetEmails, setTargetEmails] = useState<string>("");
    const [groupToDelete, setGroupToDelete] = useState<any>(null);

    const utils = trpc.useUtils();
    const { data: groups, isLoading: ldGroups } = trpc.marketing.getGroups.useQuery();

    // Test filter audience size without fetching details (for UI feedback)
    const [testAudience, setTestAudience] = useState<any[] | null>(null);
    const [ldAudience, setLdAudience] = useState(false);

    const testAudienceRefetch = async () => {
        setLdAudience(true);
        try {
            const data = await utils.client.marketing.getAudience.query({
                targetPlans: targetPlans || undefined,
                targetRoles: targetRoles || undefined,
                targetSubscriptions: targetSubscriptions || undefined,
                targetEmails: targetEmails || undefined,
            });
            setTestAudience(data);
        } catch (e: any) {
            toast.error(e.message || "Erro ao calcular público");
        } finally {
            setLdAudience(false);
        }
    };

    const createGroup = trpc.marketing.createGroup.useMutation({
        onSuccess: () => {
            toast.success("Grupo criado com sucesso!");
            setName("");
            setTargetPlans("");
            setTargetRoles("");
            setTargetSubscriptions("");
            setTargetEmails("");
            utils.marketing.getGroups.invalidate();
        },
        onError: (e) => {
            toast.error(e.message || "Erro ao criar grupo.");
        }
    });

    const deleteGroup = trpc.marketing.deleteGroup.useMutation({
        onSuccess: () => {
            toast.success("Grupo excluído.");
            utils.marketing.getGroups.invalidate();
        },
        onError: (e) => {
            toast.error(e.message || "Erro ao excluir grupo.");
        }
    });

    const handleCreate = () => {
        if (!name) {
            toast.error("O nome do grupo é obrigatório.");
            return;
        }
        createGroup.mutate({
            name,
            targetPlans: targetPlans || undefined,
            targetRoles: targetRoles || undefined,
            targetSubscriptions: targetSubscriptions || undefined,
            targetEmails: targetEmails || undefined,
        });
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-[#1e3a5f] uppercase tracking-wide">Grupos de Público</h2>
                        <p className="text-sm text-gray-500 font-medium">Crie e gerencie segmentações pré-definidas para envio de e-mails.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* CREATE FORM */}
                    <div className="lg:col-span-1 border border-gray-200 rounded-xl p-5 bg-gray-50">
                        <h3 className="text-md font-bold text-[#1e3a5f] mb-4 flex items-center gap-2">
                            <UserPlus className="w-4 h-4" /> Novo Grupo
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-600 uppercase">Nome do Grupo *</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="ex: Assinantes Premium Ativos"
                                    className="w-full mt-1 p-2 rounded-lg border border-gray-300 text-sm focus:border-indigo-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-600 uppercase">Filtro de Planos (Opcional)</label>
                                <input
                                    type="text"
                                    value={targetPlans}
                                    onChange={(e) => setTargetPlans(e.target.value)}
                                    placeholder="ex: free, premium (separado por vírgula)"
                                    className="w-full mt-1 p-2 rounded-lg border border-gray-300 text-sm focus:border-indigo-500 outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-600 uppercase">Status Assinatura</label>
                                    <select
                                        value={targetSubscriptions}
                                        onChange={(e) => setTargetSubscriptions(e.target.value)}
                                        className="w-full mt-1 p-2 rounded-lg border border-gray-300 text-sm focus:border-indigo-500 outline-none bg-white"
                                    >
                                        <option value="">Todos</option>
                                        <option value="active">Ativos (active)</option>
                                        <option value="canceled">Cancelados (canceled)</option>
                                        <option value="past_due">Atrasados (past_due)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-600 uppercase">Papel de Usuário</label>
                                    <select
                                        value={targetRoles}
                                        onChange={(e) => setTargetRoles(e.target.value)}
                                        className="w-full mt-1 p-2 rounded-lg border border-gray-300 text-sm focus:border-indigo-500 outline-none bg-white"
                                    >
                                        <option value="">Todos</option>
                                        <option value="user">Usuário Comum (user)</option>
                                        <option value="admin">Administrador (admin)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">Adicionar E-mails Manualmente</label>
                                <textarea
                                    value={targetEmails}
                                    onChange={(e) => setTargetEmails(e.target.value)}
                                    placeholder="cliente1@email.com, cliente2@email.com"
                                    className="w-full p-2 rounded-lg border border-gray-300 text-sm focus:border-indigo-500 outline-none min-h-[60px] resize-y"
                                />
                            </div>

                            <div className="pt-2 flex flex-col gap-2">
                                <button
                                    onClick={() => testAudienceRefetch()}
                                    disabled={ldAudience}
                                    className="w-full py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
                                >
                                    {ldAudience ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                    Testar Filtro (Tamanho do Público)
                                </button>
                                {testAudience && (
                                    <div className="text-center text-xs font-bold text-indigo-600 bg-indigo-50 p-2 rounded-lg border border-indigo-100 mb-2">
                                        Público Gerado: {testAudience.length} contatos
                                    </div>
                                )}
                                {testAudience && testAudience.length > 0 && (
                                    <div className="max-h-40 overflow-y-auto mb-2 border border-gray-200 rounded-lg bg-white p-2 text-xs space-y-1">
                                        {testAudience.map((u, i) => (
                                            <div key={i} className="flex items-center gap-2 border-b border-gray-50 pb-1 last:border-0">
                                                <span className="text-gray-500 w-4">{i + 1}.</span>
                                                <span className="font-medium text-gray-800 truncate">{u.email}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <button
                                    onClick={handleCreate}
                                    disabled={createGroup.isPending || !name}
                                    className="w-full mt-2 py-3 bg-[#1e3a5f] text-white rounded-lg font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#2a4d7a] transition-colors disabled:opacity-50"
                                >
                                    {createGroup.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    Salvar Grupo
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* LIST OF GROUPS */}
                    <div className="lg:col-span-2">
                        <h3 className="text-md font-bold text-[#1e3a5f] mb-4">Grupos Salvos</h3>
                        {ldGroups ? (
                            <div className="flex justify-center py-10">
                                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                            </div>
                        ) : groups && groups.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {groups.map(g => (
                                    <div key={g.id} className="border border-gray-200 p-4 rounded-xl flex flex-col justify-between hover:shadow-md transition-shadow bg-white">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <h4 className="font-bold text-lg text-[#1e3a5f]">{g.name}</h4>
                                                {(g as any).creatorRole === 'editor' && (
                                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-black uppercase rounded shadow-sm border border-amber-200">
                                                        Editor
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-500 space-y-1">
                                                <p><strong className="text-gray-700">Planos:</strong> {g.targetPlans || 'Todos'}</p>
                                                <p><strong className="text-gray-700">Status:</strong> {g.targetSubscriptions || 'Todos'}</p>
                                                <p><strong className="text-gray-700">Papéis:</strong> {g.targetRoles || 'Todos'}</p>
                                                <p><strong className="text-gray-700">E-mails:</strong> {g.targetEmails ? 'Sim' : 'Não'}</p>
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                                            <button
                                                onClick={() => setGroupToDelete(g)}
                                                className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors flex items-center justify-center"
                                                title="Excluir"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 text-gray-400 font-bold bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                Nenhum grupo de público criado.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
            {groupToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 w-full max-w-md mx-4 transform transition-all scale-100 animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-2">
                                <Trash2 className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-black text-[#1e3a5f]">Excluir Grupo?</h3>
                            <p className="text-gray-500 text-sm">
                                Tem certeza que deseja excluir o grupo <strong>{groupToDelete.name}</strong>? Esta ação não pode ser desfeita, mas não afetará emails já enviados.
                            </p>
                        </div>
                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => setGroupToDelete(null)}
                                className="flex-1 py-3 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    deleteGroup.mutate({ id: groupToDelete.id });
                                    setGroupToDelete(null);
                                }}
                                disabled={deleteGroup.isPending}
                                className="flex-1 py-3 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                            >
                                {deleteGroup.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                Sim, Excluir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
