import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Loader2, Play } from "lucide-react";
import { useLocation } from "wouter";

export default function AdminMigrations() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [migrationResults, setMigrationResults] = useState<Record<string, any>>({});

  // Redirect if not admin
  if (isAuthenticated && user && user.role !== 'admin' && user.role !== 'super_admin') {
    setLocation('/dashboard');
    return null;
  }

  const migrateCredits = trpc.system.migrateUserCredits.useMutation({
    onSuccess: (data) => {
      setMigrationResults(prev => ({
        ...prev,
        credits: data
      }));
    },
    onError: (error) => {
      setMigrationResults(prev => ({
        ...prev,
        credits: { success: false, error: error.message }
      }));
    }
  });

  const migrations = [
    {
      id: 'credits',
      title: 'Migrar Créditos Iniciais',
      description: 'Atribui 500 créditos iniciais + 50 créditos diários para todos os usuários sem créditos',
      mutation: migrateCredits,
      result: migrationResults.credits,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1628] to-[#1a2942] py-12 px-4">
      <div className="container max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#d4af37] mb-2">
            Painel de Migrações
          </h1>
          <p className="text-gray-300">
            Execute migrações de dados para atualizar todos os usuários existentes
          </p>
        </div>

        <Alert className="mb-6 bg-yellow-900/20 border-yellow-700">
          <AlertCircle className="h-4 w-4 text-yellow-500" />
          <AlertTitle className="text-yellow-500">Atenção</AlertTitle>
          <AlertDescription className="text-yellow-200">
            Migrações afetam TODOS os usuários do sistema. Execute com cuidado!
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          {migrations.map((migration) => (
            <Card key={migration.id} className="bg-[#1a2942]/80 border-[#d4af37]/20">
              <CardHeader>
                <CardTitle className="text-[#d4af37] flex items-center justify-between">
                  {migration.title}
                  {migration.result?.success && (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  )}
                </CardTitle>
                <CardDescription className="text-gray-300">
                  {migration.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button
                    onClick={() => migration.mutation.mutate()}
                    disabled={migration.mutation.isPending}
                    className="w-full bg-[#d4af37] hover:bg-[#b8941f] text-[#0a1628]"
                  >
                    {migration.mutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Executando...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Executar Migração
                      </>
                    )}
                  </Button>

                  {migration.result && (
                    <div className="mt-4 p-4 bg-[#0a1628]/50 rounded-lg">
                      {migration.result.success ? (
                        <div className="space-y-2">
                          <p className="text-green-400 font-semibold flex items-center">
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Migração concluída com sucesso!
                          </p>
                          <div className="text-sm text-gray-300 space-y-1">
                            <p>• Total de usuários: <span className="text-[#d4af37]">{migration.result.totalUsers}</span></p>
                            <p>• Usuários migrados: <span className="text-green-400">{migration.result.migrated}</span></p>
                            <p>• Usuários pulados: <span className="text-gray-400">{migration.result.skipped}</span></p>
                            {migration.result.errors && migration.result.errors.length > 0 && (
                              <div className="mt-2">
                                <p className="text-red-400">Erros:</p>
                                <ul className="list-disc list-inside text-red-300 text-xs">
                                  {migration.result.errors.map((error: string, i: number) => (
                                    <li key={i}>{error}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-red-400 flex items-center">
                          <AlertCircle className="mr-2 h-4 w-4" />
                          Erro: {migration.result.error}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8">
          <Button
            onClick={() => setLocation('/dashboard')}
            variant="outline"
            className="border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/10"
          >
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
