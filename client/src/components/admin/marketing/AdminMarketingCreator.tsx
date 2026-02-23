import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Loader2, Send, Users, RefreshCw, Eye } from "lucide-react";
import { toast } from "sonner";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

export function AdminMarketingCreator() {
    const [subject, setSubject] = useState("");
    const [content, setContent] = useState("");

    // Group vs Direct Filters
    const [useGroup, setUseGroup] = useState<boolean>(false);
    const [selectedGroupId, setSelectedGroupId] = useState<number | "">("");

    const [targetPlans, setTargetPlans] = useState<string>("");
    const [targetRoles, setTargetRoles] = useState<string>("");
    const [targetSubscriptions, setTargetSubscriptions] = useState<string>("");
    const [targetEmails, setTargetEmails] = useState<string>("");
    const [showPreview, setShowPreview] = useState(false);

    const utils = trpc.useUtils();

    // Queries
    const { data: groups } = trpc.marketing.getGroups.useQuery();

    const [audience, setAudience] = useState<any[] | null>(null);
    const [ldAudience, setLdAudience] = useState(false);

    const refetchAudience = async () => {
        setLdAudience(true);
        try {
            const data = await utils.client.marketing.getAudience.query({
                targetPlans: useGroup ? groups?.find(g => g.id === selectedGroupId)?.targetPlans || undefined : targetPlans || undefined,
                targetRoles: useGroup ? groups?.find(g => g.id === selectedGroupId)?.targetRoles || undefined : targetRoles || undefined,
                targetSubscriptions: useGroup ? groups?.find(g => g.id === selectedGroupId)?.targetSubscriptions || undefined : targetSubscriptions || undefined,
                targetEmails: useGroup ? groups?.find(g => g.id === selectedGroupId)?.targetEmails || undefined : targetEmails || undefined,
            });
            setAudience(data);
        } catch (e: any) {
            toast.error(e.message || "Erro ao calcular público");
        } finally {
            setLdAudience(false);
        }
    };

    // Mutations
    const sendEmail = trpc.marketing.sendEmail.useMutation({
        onSuccess: (res) => {
            toast.success(`E-mail enviado para ${res.sentCount} destinatários!${res.errorCount > 0 ? ` (${res.errorCount} falhas)` : ''}`);
            setSubject("");
            setContent("");
            utils.marketing.getLogs.invalidate();
        },
        onError: (error) => {
            toast.error(error.message || "Erro ao enviar e-mails");
        }
    });

    const handleFetchAudience = () => {
        if (useGroup && !selectedGroupId) {
            toast.error("Selecione um grupo primeiro.");
            return;
        }
        refetchAudience();
    };

    const handleSend = () => {
        if (!subject || !content) {
            toast.error("Assunto e conteúdo são obrigatórios.");
            return;
        }
        if (useGroup && !selectedGroupId) {
            toast.error("Para enviar a um grupo, selecione-o na lista.");
            return;
        }

        if (confirm(`Tem certeza que deseja enviar este e-mail?`)) {
            const selectedGroup = groups?.find(g => g.id === selectedGroupId);

            sendEmail.mutate({
                subject,
                content,
                targetPlans: useGroup ? selectedGroup?.targetPlans || undefined : targetPlans || undefined,
                targetRoles: useGroup ? selectedGroup?.targetRoles || undefined : targetRoles || undefined,
                targetSubscriptions: useGroup ? selectedGroup?.targetSubscriptions || undefined : targetSubscriptions || undefined,
                targetEmails: useGroup ? selectedGroup?.targetEmails || undefined : targetEmails || undefined,
                groupName: useGroup ? selectedGroup?.name : undefined,
            });
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                    <Send className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-xl font-black text-[#1e3a5f] uppercase tracking-wide">Criar Campanha</h2>
                    <p className="text-sm text-gray-500 font-medium">Selecione o público e envie um e-mail com editor rico.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* PÚBLICO ALVO */}
                <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <h3 className="text-md font-bold text-[#1e3a5f] flex items-center gap-2 mb-4">
                        <Users className="w-4 h-4" /> Público Alvo
                    </h3>

                    <div className="flex gap-4 mb-4">
                        <button
                            onClick={() => setUseGroup(true)}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg border transition-colors ${useGroup ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'bg-white text-gray-600 border-gray-300'}`}
                        >
                            Usar Grupo Salvo
                        </button>
                        <button
                            onClick={() => setUseGroup(false)}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg border transition-colors ${!useGroup ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'bg-white text-gray-600 border-gray-300'}`}
                        >
                            Filtros Manuais
                        </button>
                    </div>

                    <div className="space-y-3">
                        {useGroup ? (
                            <div>
                                <label className="text-xs font-bold text-gray-600 uppercase">Selecione o Grupo</label>
                                <select
                                    className="w-full mt-1 p-2 rounded-lg border border-gray-300 text-sm focus:border-blue-500 outline-none"
                                    value={selectedGroupId}
                                    onChange={(e) => setSelectedGroupId(e.target.value ? Number(e.target.value) : "")}
                                >
                                    <option value="">-- Escolha um Grupo --</option>
                                    {groups?.map(g => (
                                        <option key={g.id} value={g.id}>{g.name}</option>
                                    ))}
                                </select>
                                {groups?.length === 0 && (
                                    <p className="text-xs text-red-500 mt-2">Nenhum grupo criado ainda. Vá para a aba Grupos para criar um.</p>
                                )}
                            </div>
                        ) : (
                            <>
                                <div>
                                    <label className="text-xs font-bold text-gray-600 uppercase">Filtro de Planos (Opcional)</label>
                                    <input
                                        type="text"
                                        value={targetPlans}
                                        onChange={(e) => setTargetPlans(e.target.value)}
                                        placeholder="ex: free, premium (separado por vírgula)"
                                        className="w-full mt-1 p-2 rounded-lg border border-gray-300 text-sm focus:border-blue-500 outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-600 uppercase">Status Assinatura</label>
                                        <select
                                            value={targetSubscriptions}
                                            onChange={(e) => setTargetSubscriptions(e.target.value)}
                                            className="w-full mt-1 p-2 rounded-lg border border-gray-300 text-sm focus:border-blue-500 outline-none bg-white"
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
                                            className="w-full mt-1 p-2 rounded-lg border border-gray-300 text-sm focus:border-blue-500 outline-none bg-white"
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
                                        className="w-full p-2 rounded-lg border border-gray-300 text-sm focus:border-blue-500 outline-none min-h-[60px] resize-y"
                                    />
                                </div>
                            </>
                        )}

                        <button
                            onClick={handleFetchAudience}
                            disabled={ldAudience}
                            className="w-full py-2 bg-[#1e3a5f] text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#2a4d7a] transition-colors mt-4"
                        >
                            {ldAudience ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                            Calcular Público
                        </button>

                        {audience && (
                            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
                                <p className="text-sm font-bold text-blue-800">Público Estimado: {audience.length} usuários</p>
                            </div>
                        )}
                        {audience && audience.length > 0 && (
                            <div className="max-h-40 overflow-y-auto mt-2 border border-gray-200 rounded-lg bg-white p-2 text-xs space-y-1">
                                {audience.map((u, i) => (
                                    <div key={i} className="flex items-center gap-2 border-b border-gray-50 pb-1 last:border-0">
                                        <span className="text-gray-500 w-4">{i + 1}.</span>
                                        <span className="font-medium text-gray-800 truncate">{u.email}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* EDITOR DE E-MAIL */}
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-600 uppercase">Assunto do E-mail</label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Ex: Nova atualização incrível disponível!"
                            className="w-full mt-1 p-3 rounded-lg border border-gray-300 focus:border-blue-500 outline-none font-medium"
                        />
                    </div>

                    <div>
                        <div>
                            <label className="text-xs font-bold text-gray-600 uppercase flex justify-between mb-1">
                                <span>Conteúdo do E-mail</span>
                                <span className="text-[10px] text-gray-400">Use {'{{name}}'} para o nome do usuário</span>
                            </label>
                            <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
                                <ReactQuill
                                    theme="snow"
                                    value={content}
                                    onChange={setContent}
                                    className="h-64"
                                    modules={{
                                        toolbar: [
                                            [{ 'header': [1, 2, 3, false] }],
                                            ['bold', 'italic', 'underline', 'strike'],
                                            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                            ['link', 'image'],
                                            ['clean']
                                        ],
                                    }}
                                />
                            </div>
                        </div>

                        <div className="pt-8">
                            <button
                                onClick={() => setShowPreview(!showPreview)}
                                className="w-full py-2 bg-gray-100 text-[#1e3a5f] rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors mb-3"
                            >
                                <Eye className="w-4 h-4" />
                                {showPreview ? "Ocultar Pré-visualização" : "Ver Pré-visualização"}
                            </button>

                            {showPreview && (
                                <div className="mb-4 p-6 border border-gray-200 rounded-xl bg-gray-50 max-h-96 overflow-y-auto">
                                    <div className="text-sm text-gray-400 mb-2 border-b pb-2">
                                        <span className="font-bold">Assunto:</span> {subject || "Sem assunto..."}
                                    </div>
                                    <div
                                        className="prose prose-sm max-w-none break-words bg-white p-4 rounded-lg shadow-sm border border-gray-100 min-h-[150px]"
                                        dangerouslySetInnerHTML={{ __html: content || "<p className='text-gray-400'>Nenhum conteúdo ainda...</p>" }}
                                    />
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleSend}
                            disabled={sendEmail.isPending}
                            className="w-full py-3 mt-4 bg-[#d4af37] text-white rounded-lg font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#c4a030] transition-colors disabled:opacity-50"
                        >
                            {sendEmail.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                            Enviar Campanha
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
