import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { trpc } from "@/lib/trpc";
import {
    Search,
    Trash2,
    Eye,
    ChevronLeft,
    ChevronRight,
    User,
    Calendar,
    CreditCard,
    BookOpen,
    CalendarIcon,
    X,
    Download,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export function UserManagement() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [planFilter, setPlanFilter] = useState("all");
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
    const [sortBy, setSortBy] = useState<"newest" | "oldest" | "credits_asc" | "credits_desc">("newest");
    const [dateFrom, setDateFrom] = useState<Date | undefined>();
    const [dateTo, setDateTo] = useState<Date | undefined>();
    const { user: currentUser } = useAuth();
    const isSuperAdmin = currentUser?.role === 'super_admin';

    // Estado para gerenciamento de plano
    const [selectedPlanId, setSelectedPlanId] = useState<string>("");
    const [selectedBilling, setSelectedBilling] = useState<"monthly" | "yearly">("monthly");

    const limit = 20;

    // Queries
    const handleSearch = () => {
        setSearch(searchInput);
        setPage(1);
    };

    const { data, isLoading, refetch } = trpc.admin.listUsers.useQuery({
        page,
        limit,
        search: search || undefined,
        planFilter: planFilter !== "all" ? planFilter : undefined,
        sortBy: sortBy,
        dateFrom: dateFrom?.toISOString(),
        dateTo: dateTo?.toISOString(),
    });

    const { data: userDetails } = trpc.admin.getUserDetails.useQuery(
        { userId: selectedUserId! },
        { enabled: !!selectedUserId }
    );

    const deleteMutation = trpc.admin.deleteUser.useMutation({
        onSuccess: () => {
            toast.success("Usuário deletado com sucesso!");
            setDeleteUserId(null);
            refetch();
        },
        onError: (error) => {
            toast.error(`Erro ao deletar usuário: ${error.message}`);
        },
    });

    const { data: plans } = trpc.plans.list.useQuery();

    const updatePlanMutation = trpc.admin.updateUserPlan.useMutation({
        onSuccess: (data) => {
            toast.success(`Plano alterado para ${data.planName} com sucesso!`);
            refetch(); // Atualiza a lista
            // Se estiver com o modal aberto, poderia refetch user details também, mas o trpc geralmente cuida disso se a query key bater
            // Como userDetails depende de selectedUserId, ele deve atualizar se invalidarmos
        },
        onError: (error) => {
            toast.error(`Erro ao alterar plano: ${error.message}`);
        }
    });

    const handleUpdatePlan = () => {
        if (!selectedUserId || !selectedPlanId) return;

        updatePlanMutation.mutate({
            userId: selectedUserId,
            planId: Number(selectedPlanId),
            billingPeriod: selectedBilling
        });
    };

    // Atualiza estados locais quando abrir modal
    useEffect(() => {
        if (userDetails) {
            // Tenta encontrar o plano atual do usuário na lista de planos
            const currentPlan = plans?.find(p => p.name === userDetails.plan_name);
            if (currentPlan) {
                setSelectedPlanId(String(currentPlan.id));
            } else {
                setSelectedPlanId("");
            }

            setSelectedBilling((userDetails.billingPeriod as "monthly" | "yearly") || "monthly");
        }
    }, [userDetails, plans]);

    const handleDelete = () => {
        if (deleteUserId) {
            deleteMutation.mutate({ userId: deleteUserId });
        }
    };

    const formatDate = (date: Date | string) => {
        try {
            return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
        } catch {
            return "Data inválida";
        }
    };

    const trpcUtils = trpc.useUtils();

    const exportToCSV = async () => {
        try {
            toast.loading("Buscando dados para exportação...");

            // Fetch ALL filtered data (not just current page)
            const allUsers = await trpcUtils.client.admin.exportUsers.query({
                search: search || undefined,
                planFilter: planFilter !== "all" ? planFilter : undefined,
                sortBy: sortBy,
                dateFrom: dateFrom?.toISOString(),
                dateTo: dateTo?.toISOString(),
            });

            if (!allUsers || allUsers.length === 0) {
                toast.dismiss();
                toast.error("Não há dados para exportar");
                return;
            }

            // CSV Headers
            const headers = ["Nome", "Email", "Plano", "Status da Assinatura", "Créditos Usados", "Data de Criação"];

            // CSV Rows
            const rows = allUsers.map(user => [
                user.name || "Sem nome",
                user.email || "Sem email",
                user.planDisplayName || "FREE",
                user.subscriptionStatus || "Sem assinatura",
                user.creditsSpent.toString(),
                formatDate(user.createdAt)
            ]);

            // Build CSV content
            const csvContent = [
                headers.join(","),
                ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
            ].join("\n");

            // Add BOM for UTF-8 encoding (ensures Excel opens correctly with special characters)
            const BOM = "\uFEFF";
            const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });

            // Create download link
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);

            // Generate filename with current date
            const now = new Date();
            const dateStr = format(now, "yyyy-MM-dd_HH-mm");
            link.setAttribute("download", `usuarios_${dateStr}.csv`);

            // Trigger download
            link.style.visibility = "hidden";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.dismiss();
            toast.success(`${allUsers.length} usuário(s) exportado(s) com sucesso!`);
        } catch (error) {
            toast.dismiss();
            toast.error("Erro ao exportar dados");
            console.error("Export error:", error);
        }
    };

    const getPlanBadgeColor = (planName: string | null) => {
        if (!planName) return "bg-gray-100 text-gray-700";
        const name = planName.toLowerCase();
        if (name === "free") return "bg-gray-100 text-gray-700";
        if (name === "lumen") return "bg-blue-100 text-blue-700";
        if (name === "alianca") return "bg-purple-100 text-purple-700";
        if (name === "premium") return "bg-yellow-100 text-yellow-700";
        return "bg-gray-100 text-gray-700";
    };

    return (
        <div className="space-y-6">
            {/* Header e Busca */}
            <Card className="p-6 bg-white shadow-sm border border-gray-100">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4">
                        <div>
                            <h2 className="text-2xl font-black text-[#1e3a5f] uppercase tracking-tight">
                                Gerenciar Usuários
                            </h2>
                            <p className="text-sm text-gray-400 mt-1">
                                {data?.total || 0} usuários cadastrados
                            </p>
                        </div>
                        <Button
                            onClick={exportToCSV}
                            disabled={isLoading}
                            variant="outline"
                            size="sm"
                            className="bg-green-50 text-green-700 border-green-300 hover:bg-green-100 hover:text-green-800 disabled:opacity-50"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Exportar CSV
                        </Button>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <Select value={planFilter} onValueChange={setPlanFilter}>
                            <SelectTrigger
                                className="w-48 border-gray-300 bg-white"
                            >
                                <SelectValue placeholder="Filtrar por plano" />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                                <SelectItem value="all">Todos os planos</SelectItem>
                                <SelectItem value="free">FREE</SelectItem>
                                <SelectItem value="lumen">LUMEN</SelectItem>
                                <SelectItem value="alianca">ALIANÇA</SelectItem>
                                <SelectItem value="premium">PREMIUM</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                            <SelectTrigger
                                className="w-48 border-gray-300 bg-white"
                            >
                                <SelectValue placeholder="Ordenar por" />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                                <SelectItem value="newest">Mais Recentes</SelectItem>
                                <SelectItem value="oldest">Mais Antigos</SelectItem>
                                <SelectItem value="credits_desc">Maior Uso de Créditos</SelectItem>
                                <SelectItem value="credits_asc">Menor Uso de Créditos</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Date Filter From */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-48 justify-start text-left font-normal border-gray-300 bg-white"
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateFrom ? format(dateFrom, "dd/MM/yyyy", { locale: ptBR }) : "De"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-white" align="start">
                                <CalendarComponent
                                    mode="single"
                                    selected={dateFrom}
                                    onSelect={(date) => {
                                        setDateFrom(date);
                                        setPage(1);
                                    }}
                                    locale={ptBR}
                                />
                            </PopoverContent>
                        </Popover>

                        {/* Date Filter To */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-48 justify-start text-left font-normal border-gray-300 bg-white"
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateTo ? format(dateTo, "dd/MM/yyyy", { locale: ptBR }) : "Até"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-white" align="start">
                                <CalendarComponent
                                    mode="single"
                                    selected={dateTo}
                                    onSelect={(date) => {
                                        setDateTo(date);
                                        setPage(1);
                                    }}
                                    locale={ptBR}
                                />
                            </PopoverContent>
                        </Popover>

                        {/* Clear Dates Button */}
                        {(dateFrom || dateTo) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setDateFrom(undefined);
                                    setDateTo(undefined);
                                    setPage(1);
                                }}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                                <X className="w-4 h-4 mr-1" />
                                Limpar Datas
                            </Button>
                        )}

                        <Input
                            placeholder="Buscar por nome ou email..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                            className="w-64"
                        />
                        <Button onClick={handleSearch} size="sm">
                            <Search className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Tabela */}
            <Card className="p-6 bg-white shadow-sm border border-gray-100">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <p className="text-gray-400">Carregando usuários...</p>
                    </div>
                ) : data?.users.length === 0 ? (
                    <div className="flex items-center justify-center py-20">
                        <p className="text-gray-400">Nenhum usuário encontrado</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        Nome
                                    </th>
                                    <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        Plano
                                    </th>
                                    <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        Créditos Usados
                                    </th>
                                    <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        Data de Criação
                                    </th>
                                    <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {data?.users.map((user) => (
                                    <tr
                                        key={user.id}
                                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="py-4 px-4">
                                            <p className="font-semibold text-[#1e3a5f]">
                                                {user.name || "Sem nome"}
                                            </p>
                                        </td>
                                        <td className="py-4 px-4">
                                            <p className="text-sm text-gray-600">{user.email}</p>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${getPlanBadgeColor(
                                                        user.planName
                                                    )}`}
                                                >
                                                    {user.planDisplayName || "FREE"}
                                                </span>
                                                {user.stripeStatus === "trialing" && (
                                                    <span className="text-xs font-bold px-2 py-1 rounded-full uppercase bg-orange-100 text-orange-700 border border-orange-300">
                                                        TRIAL
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <p className="text-sm font-medium text-gray-700">
                                                {user.creditsSpent}
                                            </p>
                                        </td>
                                        <td className="py-4 px-4">
                                            <p className="text-sm text-gray-600">
                                                {formatDate(user.createdAt)}
                                            </p>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setSelectedUserId(user.id)}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setDeleteUserId(user.id)}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Paginação */}
                {data && data.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100">
                        <p className="text-sm text-gray-600">
                            Página {data.page} de {data.totalPages} ({data.total} usuários)
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(page - 1)}
                                disabled={page === 1}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(page + 1)}
                                disabled={page === data.totalPages}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Modal de Detalhes */}
            <Dialog open={!!selectedUserId} onOpenChange={() => setSelectedUserId(null)}>
                <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-white">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-[#1e3a5f]">
                            Detalhes do Usuário
                        </DialogTitle>
                        <DialogDescription>
                            Informações completas do cadastro
                        </DialogDescription>
                    </DialogHeader>

                    {userDetails && (
                        <div className="space-y-6 py-4">
                            {/* Grid Principal */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Nome */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-gray-500" />
                                        <p className="text-xs font-bold text-gray-500 uppercase">
                                            Nome
                                        </p>
                                    </div>
                                    <p className="text-lg font-bold text-[#1e3a5f]">
                                        {String(userDetails.name || "Sem nome")}
                                    </p>
                                </div>

                                {/* Data de Criação */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-gray-500" />
                                        <p className="text-xs font-bold text-gray-500 uppercase">
                                            Membro desde
                                        </p>
                                    </div>
                                    <p className="text-base font-semibold text-gray-700">
                                        {formatDate(userDetails.createdAt as Date)}
                                    </p>
                                </div>

                                {/* Email - Full Width */}
                                <div className="space-y-2 md:col-span-2">
                                    <p className="text-xs font-bold text-gray-500 uppercase">
                                        Email
                                    </p>
                                    <p className="text-base font-semibold text-gray-700 break-all">
                                        {String(userDetails.email || "Sem email")}
                                    </p>
                                </div>

                                {/* Plano Atual */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <CreditCard className="w-4 h-4 text-gray-500" />
                                        <p className="text-xs font-bold text-gray-500 uppercase">
                                            Plano Atual
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`inline-block text-sm font-bold px-4 py-2 rounded-full uppercase ${getPlanBadgeColor(
                                                userDetails.plan_name as string
                                            )}`}
                                        >
                                            {String(userDetails.plan_display_name || "FREE")}
                                        </span>
                                        {userDetails.stripe_status === "trialing" && (
                                            <span className="text-xs font-bold px-2 py-1 rounded-full uppercase bg-orange-100 text-orange-700 border border-orange-300">
                                                TRIAL
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Status da Assinatura */}
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-gray-500 uppercase">
                                        Status da Assinatura
                                    </p>
                                    <p className="text-base font-semibold text-gray-700 capitalize">
                                        {String(userDetails.subscription_status || "Sem assinatura")}
                                    </p>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-gray-200 my-4" />

                            {/* ÁREA DE GESTÃO DE PLANO (SUPER ADMIN) */}
                            {isSuperAdmin && (
                                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border-2 border-orange-200 mb-6 shadow-sm">
                                    {/* Header */}
                                    <div className="flex items-center gap-3 mb-5 pb-4 border-b border-orange-200">
                                        <div className="p-2.5 bg-orange-500 rounded-lg shadow-sm">
                                            <CreditCard className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-[#1e3a5f] uppercase tracking-wide">
                                                Gerenciar Plano
                                            </h3>
                                            <p className="text-xs text-orange-700 font-medium">
                                                Super Admin
                                            </p>
                                        </div>
                                    </div>

                                    {/* Form */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                                                Novo Plano
                                            </label>
                                            <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                                                <SelectTrigger className="bg-white border-2 border-orange-300 hover:border-orange-400 focus:border-orange-500 transition-colors h-11">
                                                    <SelectValue placeholder="Selecione um plano" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white">
                                                    {plans?.map(plan => (
                                                        <SelectItem key={plan.id} value={String(plan.id)}>
                                                            {plan.displayName}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <Button
                                            onClick={handleUpdatePlan}
                                            disabled={updatePlanMutation.status === 'pending'}
                                            className="bg-orange-600 hover:bg-orange-700 text-white font-bold w-full h-11 shadow-md hover:shadow-lg transition-all"
                                        >
                                            {updatePlanMutation.status === 'pending' ? (
                                                <span className="flex items-center gap-2">
                                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                    </svg>
                                                    Atualizando...
                                                </span>
                                            ) : (
                                                "Salvar Alteração"
                                            )}
                                        </Button>

                                        {/* Warning */}
                                        <div className="bg-orange-200/50 border-l-4 border-orange-600 p-3 rounded">
                                            <p className="text-[10px] text-orange-900 font-medium leading-relaxed">
                                                ⚠️ <strong>Atenção:</strong> Ao alterar o plano manualmente, os créditos serão resetados para os limites do novo plano e a assinatura será atualizada imediatamente.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Cards de Estatísticas */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-blue-500 rounded-xl">
                                            <BookOpen className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">
                                                Estudos Gerados
                                            </p>
                                            <p className="text-3xl font-black text-blue-700 mt-1">
                                                {String(userDetails?.usage_count || 0)}
                                            </p>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="p-5 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-purple-500 rounded-xl">
                                            <CreditCard className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-purple-600 uppercase tracking-wide">
                                                Créditos Gastos
                                            </p>
                                            <p className="text-3xl font-black text-purple-700 mt-1">
                                                {Math.abs(Number(userDetails?.credits_spent || 0))}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="mt-6">
                        <Button variant="outline" onClick={() => setSelectedUserId(null)}>
                            Fechar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* AlertDialog de Confirmação de Exclusão */}
            <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
                <AlertDialogContent className="bg-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso irá permanentemente deletar o
                            usuário e todos os dados relacionados (estudos, transações, etc).
                            <br />
                            <br />
                            <strong className="text-red-600">
                                Se o usuário tiver uma assinatura ativa na Stripe, ela será cancelada
                                automaticamente.
                            </strong>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Deletar Permanentemente
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
