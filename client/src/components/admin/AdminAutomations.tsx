import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import {
    Mail,
    Plus,
    Trash2,
    Power,
    PowerOff,
    Clock,
    Database,
    Bell,
    Loader2,
    Calendar,
    AlertTriangle,
    ArrowLeft,
    Eye,
    Save,
    Check,
    RefreshCw,
    History
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { cn } from "@/lib/utils";

export function AdminAutomations() {
    const [view, setView] = useState<'list' | 'form'>('list');
    const [editingAutomation, setEditingAutomation] = useState<any>(null);
    const [content, setContent] = useState("");
    const [subject, setSubject] = useState("");
    const [showPreview, setShowPreview] = useState(false);
    const [isActive, setIsActive] = useState(true);
    const [triggerType, setTriggerType] = useState<string>("subscription_expiring");
    const [triggerInterval, setTriggerInterval] = useState<string>("daily");
    const [triggerDate, setTriggerDate] = useState<string>("");
    const [triggerToolId, setTriggerToolId] = useState<string>("");
    const [selectedPlans, setSelectedPlans] = useState<string[]>([]);
    const [automationToDelete, setAutomationToDelete] = useState<any>(null);
    const [historyAutomation, setHistoryAutomation] = useState<any>(null);

    const utils = trpc.useUtils();
    const { data: automations, isLoading } = trpc.automations.list.useQuery();
    const { data: statsData, isLoading: isLoadingStats } = trpc.automations.getStats.useQuery(
        { id: historyAutomation?.id },
        { enabled: !!historyAutomation }
    );
    const { data: plans } = trpc.plans.list.useQuery();
    const { data: toolsList } = trpc.tools.list.useQuery();

    const createMutation = trpc.automations.create.useMutation({
        onSuccess: () => {
            toast.success("Automação criada com sucesso!");
            setView('list');
            utils.automations.list.invalidate();
        }
    });

    const updateMutation = trpc.automations.update.useMutation({
        onSuccess: () => {
            toast.success("Automação atualizada!");
            setView('list');
            utils.automations.list.invalidate();
        }
    });

    const deleteMutation = trpc.automations.delete.useMutation({
        onSuccess: () => {
            toast.success("Automação excluída.");
            utils.automations.list.invalidate();
        }
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const data = {
            name: formData.get("name") as string,
            triggerType: triggerType as any,
            triggerValue: triggerType === 'tool_usage' ? Number(triggerToolId) : ((triggerType !== 'bulk' && triggerType !== 'specific_date' && triggerType !== 'periodic') ? Number(formData.get("triggerValue")) : 0),
            subject: subject,
            content: content,
            targetPlans: selectedPlans.join(","),
            isActive: isActive,
            triggerDate: triggerType === 'specific_date' && triggerDate ? triggerDate : null,
            triggerInterval: triggerType === 'periodic' ? (triggerInterval as "daily" | "weekly" | "monthly") : null,
        };

        if (editingAutomation) {
            updateMutation.mutate({ ...data, id: editingAutomation.id } as any);
        } else {
            createMutation.mutate(data as any);
        }
    };

    const handleEdit = (auto: any) => {
        setEditingAutomation(auto);
        setContent(auto.content);
        setSubject(auto.subject || "");
        setTriggerType(auto.triggerType);
        setIsActive(auto.isActive);
        setTriggerDate(auto.triggerDate ? new Date(auto.triggerDate).toISOString().slice(0, 16) : "");
        setTriggerInterval(auto.triggerInterval || "daily");
        setTriggerToolId(auto.triggerType === 'tool_usage' ? String(auto.triggerValue) : "");
        setSelectedPlans(auto.targetPlans ? auto.targetPlans.split(",").filter(Boolean) : []);
        setView('form');
    };

    const handleNew = () => {
        setEditingAutomation(null);
        setContent("");
        setSubject("");
        setTriggerType("subscription_expiring");
        setIsActive(true);
        setTriggerDate("");
        setTriggerInterval("daily");
        setTriggerToolId("");
        setSelectedPlans([]);
        setView('form');
    };

    const togglePlan = (planId: string) => {
        setSelectedPlans(prev =>
            prev.includes(planId) ? prev.filter(p => p !== planId) : [...prev, planId]
        );
    };

    const isTriggerValueRequired = triggerType !== 'bulk';

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="animate-spin w-8 h-8 text-[#d4af37]" />
            </div>
        );
    }

    if (view === 'form') {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" onClick={() => setView('list')} className="text-gray-500">
                            <ArrowLeft size={18} className="mr-2" /> Voltar
                        </Button>
                        <h2 className="text-2xl font-black text-[#1e3a5f] uppercase tracking-tight">
                            {editingAutomation ? "Editar Automação" : "Nova Automação"}
                        </h2>
                    </div>
                    <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
                        <Label htmlFor="active-status" className="text-xs font-bold text-gray-500 uppercase cursor-pointer">Status:</Label>
                        <div className="flex items-center gap-2">
                            <span className={cn("text-[10px] font-black uppercase", isActive ? "text-green-500" : "text-gray-400")}>
                                {isActive ? "Ativa" : "Pausada"}
                            </span>
                            <Switch
                                id="active-status"
                                checked={isActive}
                                onCheckedChange={setIsActive}
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-xs font-bold text-gray-600 uppercase">Nome da Automação</Label>
                                <Input id="name" name="name" defaultValue={editingAutomation?.name} placeholder="Ex: Aviso Vencimento 7 Dias" required className="p-3 bg-gray-50" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="triggerType" className="text-xs font-bold text-gray-600 uppercase">Tipo de Gatilho</Label>
                                <Select value={triggerType} onValueChange={setTriggerType} name="triggerType">
                                    <SelectTrigger className="p-3 bg-gray-50">
                                        <SelectValue placeholder="Selecione o gatilho" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white">
                                        <SelectItem value="subscription_expiring">Assinatura Vencendo</SelectItem>
                                        <SelectItem value="low_credits">Créditos Baixos</SelectItem>
                                        <SelectItem value="inactive_user">Usuário Inativo</SelectItem>
                                        <SelectItem value="specific_date">Data Específica</SelectItem>
                                        <SelectItem value="periodic">Recorrente (Período)</SelectItem>
                                        <SelectItem value="tool_usage">Uso de Ferramenta</SelectItem>
                                        <SelectItem value="bulk">Envio em Massa (Bulk)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {(triggerType !== 'bulk' && triggerType !== 'specific_date' && triggerType !== 'periodic' && triggerType !== 'tool_usage') && (
                                <div className="space-y-2 transition-all duration-300">
                                    <Label htmlFor="triggerValue" className="text-xs font-bold text-gray-600 uppercase">
                                        {triggerType === 'low_credits' ? "Limite de Créditos" : "Dias para disparo"}
                                    </Label>
                                    <Input
                                        id="triggerValue"
                                        name="triggerValue"
                                        type="number"
                                        defaultValue={editingAutomation?.triggerValue}
                                        placeholder={triggerType === 'low_credits' ? "Ex: 100" : "Ex: 7"}
                                        className="p-3 bg-gray-50"
                                        required
                                    />
                                    <p className="text-[10px] text-gray-400 italic">
                                        {triggerType === 'subscription_expiring' && "E-mail será enviado X dias antes de expirar."}
                                        {triggerType === 'inactive_user' && "E-mail será enviado após X dias sem login."}
                                        {triggerType === 'low_credits' && "E-mail será enviado quando créditos forem menores que X."}
                                    </p>
                                </div>
                            )}

                            {triggerType === 'specific_date' && (
                                <div className="space-y-2 transition-all duration-300">
                                    <Label htmlFor="triggerDate" className="text-xs font-bold text-gray-600 uppercase">Data e Hora do Disparo</Label>
                                    <Input
                                        id="triggerDate"
                                        type="datetime-local"
                                        value={triggerDate}
                                        onChange={(e) => setTriggerDate(e.target.value)}
                                        className="p-3 bg-gray-50"
                                        required
                                    />
                                    <p className="text-[10px] text-gray-400 italic">O e-mail será enviado uma única vez na data selecionada.</p>
                                </div>
                            )}

                            {triggerType === 'periodic' && (
                                <div className="space-y-2 transition-all duration-300">
                                    <Label htmlFor="triggerInterval" className="text-xs font-bold text-gray-600 uppercase">Periodicidade</Label>
                                    <Select value={triggerInterval} onValueChange={setTriggerInterval}>
                                        <SelectTrigger className="p-3 bg-gray-50">
                                            <SelectValue placeholder="Selecione o intervalo" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white">
                                            <SelectItem value="daily">Diário</SelectItem>
                                            <SelectItem value="weekly">Semanal</SelectItem>
                                            <SelectItem value="monthly">Mensal</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-[10px] text-gray-400 italic">O e-mail será enviado recorrentemente no intervalo escolhido.</p>
                                </div>
                            )}

                            {triggerType === 'tool_usage' && (
                                <div className="space-y-2 transition-all duration-300">
                                    <Label htmlFor="triggerToolId" className="text-xs font-bold text-gray-600 uppercase">Selecione a Ferramenta</Label>
                                    <Select value={triggerToolId} onValueChange={setTriggerToolId}>
                                        <SelectTrigger className="p-3 bg-gray-50">
                                            <SelectValue placeholder="Selecione a ferramenta" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white">
                                            {toolsList?.map((tool: any) => (
                                                <SelectItem key={tool.id} value={String(tool.id)}>
                                                    {tool.displayName || tool.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-[10px] text-gray-400 italic">O e-mail será enviado uma vez por dia aos usuários que já utilizaram esta ferramenta.</p>
                                </div>
                            )}

                            {triggerType === 'bulk' && (
                                <div className="space-y-2 transition-all duration-300 opacity-50">
                                    <Label className="text-xs font-bold text-gray-300 uppercase">Configuração do Gatilho</Label>
                                    <Input disabled value="Manual (Bulk)" className="p-3 bg-gray-100 border-dashed cursor-not-allowed" />
                                    <p className="text-[10px] text-gray-300 italic">Gatilho manual para todos os usuários selecionados.</p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-600 uppercase">Filtrar por Planos (Multi-seleção)</Label>
                                <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-xl border border-gray-200 min-h-[46px]">
                                    {plans?.map(plan => (
                                        <button
                                            key={plan.id}
                                            type="button"
                                            onClick={() => togglePlan(plan.name)}
                                            className={cn(
                                                "px-3 py-1 rounded-full text-[10px] font-bold border transition-all flex items-center gap-1.5",
                                                selectedPlans.includes(plan.name)
                                                    ? "bg-[#1e3a5f] text-white border-[#1e3a5f]"
                                                    : "bg-white text-gray-500 border-gray-200 hover:border-[#d4af37]"
                                            )}
                                        >
                                            {selectedPlans.includes(plan.name) && <Check size={10} />}
                                            {plan.displayName}
                                        </button>
                                    ))}
                                    {selectedPlans.length === 0 && (
                                        <span className="text-[10px] text-gray-400 p-1">Todos os planos (vazio)</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="subject" className="text-xs font-bold text-gray-600 uppercase">Assunto do Email</Label>
                            <Input id="subject" name="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Ex: Seu plano está vencendo!" required className="p-3 bg-gray-50" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-600 uppercase flex justify-between mb-1">
                                <span>Conteúdo do Email (HTML)</span>
                                <span className="text-[10px] text-gray-400 normal-case">Use {"{{name}}"} para o nome do usuário</span>
                            </label>
                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden min-h-[400px]">
                                <ReactQuill
                                    theme="snow"
                                    value={content}
                                    onChange={setContent}
                                    className="h-[350px]"
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

                        <div className="pt-4 flex gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowPreview(!showPreview)}
                                className="flex-1 py-6 font-bold gap-2"
                            >
                                <Eye size={18} /> {showPreview ? "Ocultar Preview" : "Ver Preview"}
                            </Button>
                            <Button
                                type="submit"
                                disabled={createMutation.isPending || updateMutation.isPending}
                                className="flex-1 py-6 bg-[#1e3a5f] hover:bg-[#162a45] text-white font-black uppercase tracking-widest gap-2"
                            >
                                {(createMutation.isPending || updateMutation.isPending) ? (
                                    <Loader2 className="animate-spin w-5 h-5" />
                                ) : (
                                    <Save size={18} />
                                )}
                                {editingAutomation ? "Salvar Alterações" : "Criar Automação"}
                            </Button>
                        </div>

                        {showPreview && (
                            <div className="mt-8 p-8 border-2 border-[#1e3a5f]/10 rounded-2xl bg-gray-50/50 scale-in-95 animate-in duration-300">
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 border-b pb-2">Pré-visualização do Conteúdo</h4>
                                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 min-h-[300px] prose prose-sm max-w-none break-words">
                                    <div className="text-gray-400 mb-6 border-b pb-3 flex justify-between items-center">
                                        <div>
                                            <span className="font-bold text-[#1e3a5f]">ASSUNTO:</span> {subject || "Sem assunto..."}
                                        </div>
                                        <div className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-lg">
                                            MODO PREVIEW
                                        </div>
                                    </div>
                                    <div dangerouslySetInnerHTML={{ __html: content || "<p class='text-gray-300 italic'>Nenhum conteúdo definido...</p>" }} />
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-[#1e3a5f] uppercase tracking-tight">Automações de Email</h2>
                    <p className="text-gray-500 text-sm">Configure disparos automáticos baseados em gatilhos do sistema.</p>
                </div>
                <Button
                    onClick={handleNew}
                    className="bg-[#d4af37] hover:bg-[#b08d2b] text-[#1e3a5f] font-bold gap-2 px-6 py-6 rounded-xl shadow-lg border-b-4 border-[#b08d2b]"
                >
                    <Plus size={18} /> Nova Automação
                </Button>
            </div>

            <div className="grid gap-4">
                {automations?.length === 0 ? (
                    <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-20 text-center">
                        <Mail className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-400">Nenhuma automação configurada</h3>
                        <p className="text-gray-400 text-sm max-w-xs mx-auto mt-1">Comece criando sua primeira regra de automação para seus usuários.</p>
                    </div>
                ) : (
                    automations?.map((auto: any) => (
                        <div key={auto.id} className={cn(
                            "bg-white p-6 rounded-2xl shadow-sm border transition-all flex items-center justify-between hover:shadow-md",
                            !auto.isActive ? "border-gray-200 opacity-75" : "border-gray-100"
                        )}>
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "p-4 rounded-2xl",
                                    !auto.isActive ? "bg-gray-100 text-gray-400" : "bg-blue-50 text-[#1e3a5f]"
                                )}>
                                    {auto.triggerType === 'subscription_expiring' && <Clock size={28} />}
                                    {auto.triggerType === 'low_credits' && <Database size={28} />}
                                    {auto.triggerType === 'inactive_user' && <AlertTriangle size={28} />}
                                    {auto.triggerType === 'bulk' && <Bell size={28} />}
                                    {auto.triggerType === 'specific_date' && <Calendar size={28} />}
                                    {auto.triggerType === 'periodic' && <RefreshCw size={28} />}
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-black text-[#1e3a5f] uppercase tracking-tight">{auto.name}</h3>
                                        {!auto.isActive && <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">Pausada</span>}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400 font-bold uppercase tracking-wider">
                                        <span className="flex items-center gap-1"><Calendar size={12} /> {auto.triggerType}</span>
                                        {(auto.triggerType !== 'bulk' && auto.triggerType !== 'specific_date' && auto.triggerType !== 'periodic' && auto.triggerType !== 'tool_usage') && (
                                            <span className="flex items-center gap-1 underline decoration-[#d4af37]/40 underline-offset-4">Valor: {auto.triggerValue}</span>
                                        )}
                                        {auto.triggerType === 'tool_usage' && auto.triggerValue && (
                                            <span className="flex items-center gap-1 underline decoration-[#d4af37]/40 underline-offset-4">Ferramenta: {toolsList?.find((t: any) => t.id === auto.triggerValue)?.displayName || toolsList?.find((t: any) => t.id === auto.triggerValue)?.name || auto.triggerValue}</span>
                                        )}
                                        {auto.triggerType === 'specific_date' && auto.triggerDate && (
                                            <span className="flex items-center gap-1 underline decoration-[#d4af37]/40 underline-offset-4">Data: {new Date(auto.triggerDate).toLocaleString()}</span>
                                        )}
                                        {auto.triggerType === 'periodic' && auto.triggerInterval && (
                                            <span className="flex items-center gap-1 underline decoration-[#d4af37]/40 underline-offset-4">Intervalo: {auto.triggerInterval}</span>
                                        )}
                                        {auto.targetPlans && <span className="text-[#d4af37]">Planos: {auto.targetPlans}</span>}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2 mr-4 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
                                    <Switch
                                        checked={auto.isActive}
                                        onCheckedChange={() => {
                                            updateMutation.mutate({ ...auto, triggerType: auto.triggerType as any, isActive: !auto.isActive });
                                        }}
                                    />
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-[#1e3a5f]/10 text-[#1e3a5f] font-bold hover:bg-[#1e3a5f] hover:text-white rounded-xl"
                                    onClick={() => setHistoryAutomation(auto)}
                                >
                                    <History size={16} className="mr-1" />
                                    HISTÓRICO
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-[#1e3a5f]/10 text-[#1e3a5f] font-bold hover:bg-[#1e3a5f] hover:text-white rounded-xl"
                                    onClick={() => handleEdit(auto)}
                                >
                                    EDITAR
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setAutomationToDelete(auto)}
                                    className="text-red-400 hover:text-red-500 hover:bg-red-50 rounded-xl"
                                >
                                    <Trash2 size={18} />
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
            {automationToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 w-full max-w-md mx-4 transform transition-all scale-100 animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-2">
                                <Trash2 className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-black text-[#1e3a5f]">Excluir Automação?</h3>
                            <p className="text-gray-500 text-sm">
                                Tem certeza que deseja excluir a automação <strong>{automationToDelete.name}</strong>? Esta ação não pode ser desfeita.
                            </p>
                        </div>
                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => setAutomationToDelete(null)}
                                className="flex-1 py-3 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    deleteMutation.mutate({ id: automationToDelete.id });
                                    setAutomationToDelete(null);
                                }}
                                disabled={deleteMutation.isPending}
                                className="flex-1 py-3 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                            >
                                {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                Sim, Excluir
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE HISTÓRICO DE AUTOMAÇÃO */}
            {historyAutomation && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 w-full max-w-3xl mx-4 max-h-[85vh] flex flex-col transform transition-all scale-100 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b">
                            <div>
                                <h3 className="text-xl font-black text-[#1e3a5f] uppercase">Histórico de Disparos</h3>
                                <p className="text-sm text-gray-500">{historyAutomation.name}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setHistoryAutomation(null)} className="text-gray-400 hover:text-gray-600">
                                <PowerOff size={18} />
                            </Button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto pr-2">
                            {isLoadingStats ? (
                                <div className="flex justify-center items-center py-20">
                                    <Loader2 className="animate-spin text-[#d4af37] w-8 h-8" />
                                </div>
                            ) : statsData && statsData.length > 0 ? (
                                <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-gray-500 bg-gray-50 uppercase font-black border-b border-gray-200">
                                            <tr>
                                                <th className="px-6 py-4">Data do Disparo</th>
                                                <th className="px-6 py-4 text-center">Total Enviado</th>
                                                <th className="px-6 py-4 text-center">Sucesso</th>
                                                <th className="px-6 py-4 text-center">Falha</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {statsData.map((stat: any, i: number) => (
                                                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-6 py-4 font-bold text-[#1e3a5f]">
                                                        {new Date(stat.date).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-bold text-gray-500">
                                                        {stat.total}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="inline-flex items-center justify-center px-2 py-1 rounded-md text-green-700 bg-green-50 font-black min-w-[40px]">
                                                            {stat.success}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={cn(
                                                            "inline-flex items-center justify-center px-2 py-1 rounded-md font-black min-w-[40px]",
                                                            Number(stat.failed) > 0 ? "text-red-700 bg-red-50" : "text-gray-400 bg-gray-100"
                                                        )}>
                                                            {stat.failed}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mb-4">
                                        <History size={32} />
                                    </div>
                                    <h4 className="text-lg font-bold text-gray-500">Sem histórico</h4>
                                    <p className="text-gray-400 text-sm max-w-sm">Esta automação ainda não realizou nenhum disparo registrado.</p>
                                </div>
                            )}
                        </div>
                        
                        <div className="pt-6 mt-4 border-t flex justify-end">
                            <Button onClick={() => setHistoryAutomation(null)} className="px-8 font-bold bg-[#1e3a5f] hover:bg-[#162a45] text-white">
                                Fechar Histórico
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
