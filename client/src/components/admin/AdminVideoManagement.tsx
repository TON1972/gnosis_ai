import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Save, Video, MonitorPlay } from "lucide-react";

export function AdminVideoManagement() {
    const utils = trpc.useContext();

    // Fetch config
    const { data: config, isLoading } = trpc.settings.getDashboardConfig.useQuery();

    // Local state
    const [videoUrl, setVideoUrl] = useState("");
    const [videoTitle, setVideoTitle] = useState("");
    const [showVideo, setShowVideo] = useState(false);

    // Sync state with data
    useEffect(() => {
        if (config) {
            setVideoUrl(config.videoUrl || "");
            setVideoTitle(config.videoTitle || "");
            setShowVideo(config.showVideo || false);
        }
    }, [config]);

    // Mutation
    const mutation = trpc.settings.updateDashboardConfig.useMutation({
        onSuccess: () => {
            toast.success("Configurações de vídeo atualizadas!");
            utils.settings.getDashboardConfig.invalidate();
        },
        onError: (error) => {
            toast.error(`Erro ao salvar: ${error.message}`);
        }
    });

    const handleSave = () => {
        if (!videoUrl.trim()) {
            toast.error("A URL do vídeo é obrigatória");
            return;
        }
        mutation.mutate({
            videoUrl,
            videoTitle,
            showVideo
        });
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-[#d4af37]" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-[#1e3a5f] flex items-center gap-2">
                        <Video className="w-6 h-6 text-[#d4af37]" />
                        Gerenciamento de Vídeo
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                        Configure o vídeo em destaque exibido no dashboard dos usuários.
                    </p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 max-w-2xl">
                <div className="space-y-6">

                    {/* Toggle Display */}
                    <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${showVideo ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                                <MonitorPlay size={20} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800">Exibir Vídeo no Dashboard</h3>
                                <p className="text-xs text-gray-500">Ative para mostrar o vídeo aos usuários.</p>
                            </div>
                        </div>

                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={showVideo}
                                onChange={(e) => setShowVideo(e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#d4af37]"></div>
                        </label>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Título do Vídeo
                            </label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/20 focus:border-[#d4af37] transition-all"
                                placeholder="Ex: Como usar a Gnosis AI"
                                value={videoTitle}
                                onChange={(e) => setVideoTitle(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Link do YouTube (Embed ou Watch)
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    className="w-full pl-10 px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/20 focus:border-[#d4af37] transition-all"
                                    placeholder="https://www.youtube.com/embed/..."
                                    value={videoUrl}
                                    onChange={(e) => setVideoUrl(e.target.value)}
                                />
                                <Video className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Recomendado usar link de incorporação (embed) para melhor compatibilidade.</p>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="pt-4 flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={mutation.status === 'pending'}
                            className="flex items-center gap-2 bg-[#1e3a5f] hover:bg-[#2a4d7d] text-white px-6 py-2.5 rounded-lg transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {mutation.status === 'pending' ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            Salvar Alterações
                        </button>
                    </div>

                    {/* Video Preview */}
                    {videoUrl && (
                        <div className="mt-8 pt-6 border-t border-slate-200">
                            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                <MonitorPlay className="w-4 h-4 text-[#d4af37]" />
                                Pré-visualização
                            </h3>
                            <div className="bg-slate-100 p-2 rounded-xl border border-slate-200">
                                <div className="relative w-full pb-[56.25%] rounded-lg overflow-hidden bg-black/5">
                                    <iframe
                                        className="absolute top-0 left-0 w-full h-full"
                                        src={videoUrl.replace("watch?v=", "embed/")}
                                        title="Preview"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    ></iframe>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
