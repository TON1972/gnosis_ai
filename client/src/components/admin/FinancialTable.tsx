import { Card } from "@/components/ui/card";

export function FinancialTable({ data }: { data: any[] }) {
  const totalMonth = data?.reduce((sum, day) => sum + day.totalValue, 0) || 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card className="p-6 bg-[#1e3a5f] text-white border-b-8 border-[#d4af37] shadow-lg">
        <p className="text-xs font-bold text-[#d4af37] uppercase tracking-widest">Receita Prevista (30 dias)</p>
        <p className="text-4xl font-black mt-2">R$ {totalMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
      </Card>

      <Card className="bg-white border border-gray-200 overflow-hidden rounded-xl shadow-sm">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr className="text-[10px] uppercase text-gray-400 font-black">
              <th className="py-4 px-6 text-left">Data</th>
              <th className="py-4 px-6 text-left">Renovações</th>
              <th className="py-4 px-6 text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((day) => (
              <tr key={day.date} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                <td className="py-4 px-6 font-bold text-[#1e3a5f]">{new Date(day.date).toLocaleDateString("pt-BR")}</td>
                <td className="py-4 px-6">
                  <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-[10px] font-black">
                    {day.subscriptionsExpiring} ASSINATURAS
                  </span>
                </td>
                <td className="py-4 px-6 text-right font-black text-green-600">R$ {day.totalValue.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}