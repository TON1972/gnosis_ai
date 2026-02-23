import { useState } from "react";
import { Send, Users, History } from "lucide-react";
import { AdminMarketingCreator } from "./marketing/AdminMarketingCreator";
import { AdminMarketingGroups } from "./marketing/AdminMarketingGroups";
import { AdminMarketingHistory } from "./marketing/AdminMarketingHistory";

export function AdminMarketing() {
    const [activeTab, setActiveTab] = useState<'creator' | 'groups' | 'history'>('creator');

    return (
        <div className="space-y-6">
            <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between w-full mx-auto sm:w-max sm:mx-0 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('creator')}
                    className={`flex-1 sm:flex-none flex justify-center items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'creator'
                        ? 'bg-[#1e3a5f] text-white shadow-md'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-[#1e3a5f]'
                        }`}
                >
                    <Send className="w-4 h-4" />
                    <span className="whitespace-nowrap">Nova Campanha</span>
                </button>
                <button
                    onClick={() => setActiveTab('groups')}
                    className={`flex-1 sm:flex-none flex justify-center items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'groups'
                        ? 'bg-[#1e3a5f] text-white shadow-md'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-[#1e3a5f]'
                        }`}
                >
                    <Users className="w-4 h-4" />
                    <span className="whitespace-nowrap">Grupos de Público</span>
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`flex-1 sm:flex-none flex justify-center items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'history'
                        ? 'bg-[#1e3a5f] text-white shadow-md'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-[#1e3a5f]'
                        }`}
                >
                    <History className="w-4 h-4" />
                    <span className="whitespace-nowrap">Histórico de Envios</span>
                </button>
            </div>

            <div className="mt-4">
                {activeTab === 'creator' && <AdminMarketingCreator />}
                {activeTab === 'groups' && <AdminMarketingGroups />}
                {activeTab === 'history' && <AdminMarketingHistory />}
            </div>
        </div>
    );
}
