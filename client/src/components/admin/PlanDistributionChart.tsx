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

    const total = data.reduce((sum, item) => sum + item.userCount, 0);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const percentage = ((payload[0].value / total) * 100).toFixed(1);
            return (
                <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
                    <p className="text-sm font-bold text-[#1e3a5f]">{payload[0].name}</p>
                    <p className="text-sm text-gray-600">
                        {payload[0].value} usuários ({percentage}%)
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <Card className="p-8 bg-white shadow-sm border border-gray-100">
            <div className="mb-6">
                <h3 className="text-lg font-black text-[#1e3a5f] uppercase tracking-tight">
                    Distribuição por Plano
                </h3>
                <p className="text-sm font-medium text-gray-400 mt-1">
                    Usuários ativos com pagamento confirmado
                </p>
            </div>

            <div className="flex flex-col lg:flex-row items-center gap-8">
                {/* Gráfico de Pizza */}
                <div className="w-full lg:w-1/2 h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Lista de Planos */}
                <div className="w-full lg:w-1/2 space-y-3">
                    {data.map((plan, index) => {
                        const percentage = ((plan.userCount / total) * 100).toFixed(1);
                        return (
                            <div
                                key={index}
                                className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-4 h-4 rounded-full"
                                        style={{ backgroundColor: plan.color }}
                                    />
                                    <div>
                                        <p className="font-bold text-[#1e3a5f] text-sm">
                                            {plan.displayName}
                                        </p>
                                        <p className="text-xs text-gray-400">{percentage}% do total</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-black text-[#1e3a5f]">
                                        {plan.userCount}
                                    </p>
                                    <p className="text-[10px] text-gray-400 uppercase font-bold">
                                        usuários
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Total */}
            <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                        Total de Usuários Pagos
                    </span>
                    <span className="text-3xl font-black text-[#1e3a5f]">{total}</span>
                </div>
            </div>
        </Card>
    );
}
