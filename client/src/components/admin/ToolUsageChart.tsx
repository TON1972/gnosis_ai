import { Card } from "@/components/ui/card";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell
} from "recharts";

interface ToolUsageStat {
    toolId: number;
    toolName: string;
    studyCount: number;
    messageCount: number;
    userCount: number;
}

interface ToolUsageChartProps {
    data: ToolUsageStat[];
    title?: string;
}

export function ToolUsageChart({ data, title = "Uso de Ferramentas" }: ToolUsageChartProps) {
    if (!data || data.length === 0) {
        return (
            <Card className="p-8 bg-white shadow-sm border border-gray-100">
                <p className="text-gray-400 text-center">Nenhum dado disponível para este período</p>
            </Card>
        );
    }

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-4 shadow-xl rounded-xl border border-gray-100">
                    <p className="text-sm font-black text-[#1e3a5f] mb-2 uppercase tracking-tight">{label}</p>
                    <div className="space-y-1">
                        {payload.map((entry: any, index: number) => (
                            <div key={index} className="flex items-center gap-2">
                                <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: entry.color }}
                                />
                                <p className="text-xs text-gray-600 font-medium">
                                    <span className="capitalize">{entry.name}:</span> {entry.value}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <Card className="p-8 bg-white shadow-sm border border-gray-100">
            <div className="mb-8">
                <h3 className="text-lg font-black text-[#1e3a5f] uppercase tracking-tight">
                    {title}
                </h3>
                <p className="text-sm font-medium text-gray-400 mt-1">
                    Métricas de engajamento por ferramenta de estudo
                </p>
            </div>

            <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="toolName"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                        <Legend
                            verticalAlign="top"
                            align="right"
                            iconType="circle"
                            formatter={(value) => (
                                <span className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wider ml-1">
                                    {value}
                                </span>
                            )}
                        />
                        <Bar
                            dataKey="studyCount"
                            name="Estudos"
                            fill="#d4af37"
                            radius={[4, 4, 0, 0]}
                            barSize={20}
                        />
                        <Bar
                            dataKey="messageCount"
                            name="Respostas"
                            fill="#1e3a5f"
                            radius={[4, 4, 0, 0]}
                            barSize={20}
                        />
                        <Bar
                            dataKey="userCount"
                            name="Usuários"
                            fill="#94a3b8"
                            radius={[4, 4, 0, 0]}
                            barSize={20}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}
