import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface PlanDistribution {
    planName: string;
    displayName: string;
    userCount: number;
    color: string;
}

interface PlanDistributionChartProps {
    data: PlanDistribution[];
}

export function PlanDistributionChart({ data }: PlanDistributionChartProps) {
    if (!data || data.length === 0) {
        return (
            <Card className="p-8 bg-white shadow-sm border border-gray-100">
                <p className="text-gray-400 text-center">Nenhum dado disponível</p>
            </Card>
        );
    }

    // Preparar dados para o gráfico
    const chartData = data.map(item => ({
        name: item.displayName,
        value: item.userCount,
        color: item.color,
    }));

    const totalUsers = data.reduce((sum, item) => sum + item.userCount, 0);
    const paidUsersCount = data
        .filter(item => item.planName !== 'FREE')
        .reduce((sum, item) => sum + item.userCount, 0);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const percentage = ((payload[0].value / totalUsers) * 100).toFixed(1);
            return (
                <div className="bg-white p-3 shadow-xl rounded-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
                    <p className="text-xs font-black text-[#1e3a5f] uppercase tracking-tight">{payload[0].name}</p>
                    <p className="text-sm font-black text-[#d4af37]">
                        {payload[0].value.toLocaleString('pt-BR')} <span className="text-[10px] text-gray-400 uppercase font-bold ml-1">Usuários</span>
                    </p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 border-t pt-1">
                        {percentage}% do total
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <Card className="p-8 bg-white shadow-sm border border-gray-100 h-full flex flex-col justify-between">
            <div>
                <div className="mb-8 flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-black text-[#1e3a5f] uppercase tracking-tight">
                            Distribuição por Plano
                        </h3>
                        <p className="text-sm font-medium text-gray-400 mt-1">
                            Composição da base de usuários ativos
                        </p>
                    </div>
                    <div className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-100">
                        Live
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row items-center gap-10">
                    {/* Gráfico de Rosca */}
                    <div className="w-full lg:w-1/2 h-[280px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={105}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.color}
                                            className="hover:opacity-80 transition-opacity cursor-pointer focus:outline-none"
                                        />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Texto Centralizado */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-4xl font-black text-[#1e3a5f] tracking-tighter">
                                {totalUsers.toLocaleString('pt-BR')}
                            </span>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] -mt-1">
                                Total Geral
                            </span>
                        </div>
                    </div>

                    {/* Lista de Planos */}
                    <div className="w-full lg:w-1/2 space-y-4">
                        {data.map((plan, index) => {
                            const percentage = ((plan.userCount / totalUsers) * 100).toFixed(1);
                            return (
                                <div
                                    key={index}
                                    className="group flex items-center justify-between p-4 rounded-xl border border-gray-50 bg-gray-50/30 hover:bg-white hover:shadow-md hover:border-gray-100 transition-all duration-300"
                                >
                                    <div className="flex items-center gap-4">
                                        <div
                                            className="w-1.5 h-10 rounded-full"
                                            style={{ backgroundColor: plan.color }}
                                        />
                                        <div>
                                            <p className="font-extrabold text-[#1e3a5f] text-sm uppercase tracking-tight">
                                                {plan.displayName}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-24 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full transition-all duration-1000"
                                                        style={{
                                                            backgroundColor: plan.color,
                                                            width: `${percentage}%`
                                                        }}
                                                    />
                                                </div>
                                                <p className="text-[10px] font-black text-gray-400">{percentage}%</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-black text-[#1e3a5f]">
                                            {plan.userCount.toLocaleString('pt-BR')}
                                        </p>
                                        <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest">
                                            usuários
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Rodapé com métrica de conversão */}
            <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
                <div className="space-y-1">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                        Base de Assinantes Pagos
                    </span>
                    <div className="flex items-center gap-2">
                        <span className="text-3xl font-black text-[#1e3a5f] tracking-tighter">
                            {paidUsersCount.toLocaleString('pt-BR')}
                        </span>
                        <div className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded uppercase">
                            Premium
                        </div>
                    </div>
                </div>

                <div className="text-right">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                        Taxa de Conversão
                    </span>
                    <span className="text-3xl font-black text-green-500 tracking-tighter">
                        {((paidUsersCount / totalUsers) * 100).toFixed(1)}%
                    </span>
                </div>
            </div>
        </Card>
    );
}
