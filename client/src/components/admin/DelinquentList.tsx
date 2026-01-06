import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Loader2 } from "lucide-react";

export function DelinquentList() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  const { data: delinquentUsers, isLoading } = trpc.admin.delinquentUsers.useQuery({ 
    startDate: startDate || undefined, 
    endDate: endDate || undefined 
  });

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#d4af37] w-10 h-10" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card className="p-6 bg-white border border-red-100 flex flex-wrap items-end gap-4 shadow-sm">
        <div className="flex-1 min-w-50 flex gap-2">
             <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="flex-1 border-2 border-gray-100 rounded-lg p-2 text-sm focus:border-[#d4af37] outline-none" />
             <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="flex-1 border-2 border-gray-100 rounded-lg p-2 text-sm focus:border-[#d4af37] outline-none" />
        </div>
        <Button className="bg-red-600 hover:bg-red-700 text-white font-bold h-10 px-6">
          <Mail className="w-4 h-4 mr-2" /> Notificar Inadimplentes
        </Button>
      </Card>

      <Card className="bg-white border border-gray-200 overflow-hidden shadow-sm rounded-xl">
        <table className="w-full">
          <thead className="bg-red-50/50 border-b">
            <tr className="text-[10px] uppercase text-gray-400 font-black">
              <th className="py-4 px-6 text-left">Usuário</th>
              <th className="py-4 px-6 text-left">Status Atraso</th>
              <th className="py-4 px-6 text-right">Valor em Aberto</th>
            </tr>
          </thead>
          <tbody>
            {delinquentUsers?.map((user) => (
              <tr key={user.userId} className="border-b hover:bg-red-50/20 transition-colors">
                <td className="py-4 px-6">
                  <p className="font-bold text-[#1e3a5f]">{user.userName}</p>
                  <p className="text-[11px] text-gray-400">{user.userEmail} • <span className="font-bold text-[#d4af37]">{user.planName}</span></p>
                </td>
                <td className="py-4 px-6">
                  <span className="text-red-600 font-black bg-red-100 px-3 py-1 rounded-full text-[10px]">
                    {user.daysOverdue} DIAS EM ATRASO
                  </span>
                </td>
                <td className="py-4 px-6 text-right font-black text-gray-700">R$ {user.subscriptionValue.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {delinquentUsers?.length === 0 && (
          <div className="p-12 text-center text-gray-400 italic">Nenhum inadimplente encontrado. 🎉</div>
        )}
      </Card>
    </div>
  );
}