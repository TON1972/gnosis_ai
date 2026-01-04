import { APP_LOGO, APP_TITLE } from "@/const";
import { Link } from "wouter";
import { BookOpen, Heart, Sparkles } from "lucide-react";
import MobileMenu from "@/components/MobileMenu";
import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect } from "react";

export default function SobrePage() {
  const { isAuthenticated, logout } = useAuth();
  
  // Scroll para o topo quando a página carregar (método robusto)
  useEffect(() => {
    // Método 1: Scroll imediato
    window.scrollTo(0, 0);
    // Método 2: Forçar scroll após pequeno delay
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 0);
  }, []);
  
  return (
    <div className="public-page min-h-screen bg-gradient-to-b from-[#FFFACD] to-[#F0E68C]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#1e3a5f] shadow-lg border-b-4 border-[#d4af37]">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-2">
            <Link href="/">
              <div className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity">
                <img src={APP_LOGO} alt={APP_TITLE} className="h-16 w-16 object-contain" loading="lazy" />
                <h1 className="hidden md:block text-3xl font-bold text-[#d4af37]">{APP_TITLE}</h1>
                <h1 className="block md:hidden text-3xl font-bold text-[#d4af37]">GNOSIS AI</h1>
              </div>
            </Link>
            
            {/* Menu Hambúrguer Mobile */}
            <MobileMenu 
              isAuthenticated={isAuthenticated}
              onLogout={logout}
              loginUrl="/auth"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <div className="text-center mb-12">
            <Heart className="w-16 h-16 text-[#d4af37] mx-auto mb-6" />
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#1e3a5f] mb-4">
              Sobre Nós
            </h1>
            <p className="text-xl text-[#8b6f47] italic">
              Uma ferramenta inspirada por Deus para servir ao Seu povo
            </p>
          </div>

          {/* Content Card */}
          <div className="bg-white/90 rounded-2xl p-8 md:p-12 shadow-2xl border-4 border-[#d4af37]">
            {/* Introduction */}
            <div className="mb-10">
              <div className="flex items-start gap-4 mb-6">
                <Sparkles className="w-8 h-8 text-[#d4af37] flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-2xl font-bold text-[#1e3a5f] mb-4">Nossa História</h2>
                  <p className="text-lg text-[#2a4a7f] leading-relaxed mb-4">
                    Há alguns anos, vínhamos pensando em como poderíamos contribuir com a Igreja de Cristo na Terra em uma de suas maiores dores: a dificuldade de compreender a Bíblia.
                  </p>
                  <p className="text-lg text-[#2a4a7f] leading-relaxed">
                    Depois de muitas orações, fomos guiados pelo Espírito a desenvolver essa ferramenta incrível de auxílio para todos os filhos de Deus que anseiam por compreender melhor a Palavra de Deus.
                  </p>
                </div>
              </div>
            </div>

            {/* Mission */}
            <div className="mb-10">
              <div className="flex items-start gap-4 mb-6">
                <BookOpen className="w-8 h-8 text-[#d4af37] flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-2xl font-bold text-[#1e3a5f] mb-4">Nossa Missão</h2>
                  <p className="text-lg text-[#2a4a7f] leading-relaxed mb-4">
                    Nesse sentido, nasceu a <strong>Gnosis AI</strong>, uma inteligência artificial de alta performance desenvolvida para estudos bíblicos profundos.
                  </p>
                  <p className="text-lg text-[#2a4a7f] leading-relaxed">
                    Esse foi um projeto que Deus colocou em nossos corações para que, por meio dessa ferramenta de alta tecnologia, todos os filhos de Deus, independentemente de onde estejam, possam ter acesso a um conhecimento mais profundo das Escrituras Sagradas.
                  </p>
                </div>
              </div>
            </div>

            {/* Name Origin */}
            <div className="bg-gradient-to-br from-[#FFFACD] to-[#F0E68C] rounded-xl p-6 mb-10">
              <h3 className="text-xl font-bold text-[#1e3a5f] mb-3">Por que "Gnosis"?</h3>
              <p className="text-lg text-[#2a4a7f] leading-relaxed">
                Daí também veio a inspiração para a escolha do nome <strong>"Gnosis"</strong>, que significa <em>"conhecimento espiritual"</em> ou <em>"superior"</em> em grego. Seu significado está completamente entrelaçado com o propósito do projeto, que foi concebido para ser uma ferramenta poderosa de auxílio aos filhos de Deus — para ajudar e facilitar a compreensão da Bíblia, contribuindo assim para resolver uma dor comum àqueles que anseiam por mais de Deus!
              </p>
            </div>

            {/* Biblical Passages */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-[#1e3a5f] mb-6 text-center">
                Passagens que Queimavam em Nossos Corações
              </h2>
              <p className="text-lg text-[#8b6f47] mb-8 text-center italic">
                Nesse processo, algumas passagens bíblicas queimavam em nossos corações. Deixamos três delas aqui para que os amados irmãos em Cristo possam refletir:
              </p>

              {/* Provérbios 2.1-9 */}
              <div className="bg-white rounded-xl p-6 mb-6 border-l-4 border-[#d4af37]">
                <h3 className="text-xl font-bold text-[#1e3a5f] mb-4">Provérbios 2.1-9</h3>
                <div className="text-base text-[#2a4a7f] leading-relaxed space-y-2">
                  <p><sup>1</sup> Filho meu, se aceitares as minhas palavras e esconderes contigo os meus mandamentos,</p>
                  <p><sup>2</sup> para fazeres o teu ouvido atento à sabedoria e inclinares o teu coração ao entendimento;</p>
                  <p><sup>3</sup> se clamares por conhecimento e por inteligência alçares a tua voz;</p>
                  <p><sup>4</sup> se, como a prata, a buscares e, como a tesouros escondidos, a procurares,</p>
                  <p><sup>5</sup> então entenderás o temor do Senhor e acharás o conhecimento de Deus.</p>
                  <p><sup>6</sup> Porque o Senhor dá a sabedoria; da sua boca é que vem o conhecimento e o entendimento.</p>
                  <p><sup>7</sup> Ele reserva a verdadeira sabedoria para os retos; escudo é para os que caminham na sinceridade,</p>
                  <p><sup>8</sup> para que guardem as veredas do juízo. Ele preservará o caminho dos seus santos.</p>
                  <p><sup>9</sup> Então entenderás a justiça, o juízo, a equidade e todas as boas veredas.</p>
                </div>
              </div>

              {/* Efésios 3.14-21 */}
              <div className="bg-white rounded-xl p-6 mb-6 border-l-4 border-[#d4af37]">
                <h3 className="text-xl font-bold text-[#1e3a5f] mb-4">Efésios 3.14-21</h3>
                <div className="text-base text-[#2a4a7f] leading-relaxed space-y-2">
                  <p><sup>14</sup> Por causa disto, me ponho de joelhos perante o Pai de nosso Senhor Jesus Cristo,</p>
                  <p><sup>15</sup> do qual toda a família nos céus e na terra toma o nome,</p>
                  <p><sup>16</sup> para que, segundo as riquezas da sua glória, vos conceda que sejais fortalecidos com poder pelo seu Espírito no homem interior,</p>
                  <p><sup>17</sup> para que Cristo habite, pela fé, nos vossos corações; a fim de, estando enraizados e fundados em amor,</p>
                  <p><sup>18</sup> poderdes perfeitamente compreender, com todos os santos, qual seja a largura, e o comprimento, e a altura, e a profundidade,</p>
                  <p><sup>19</sup> e conhecer o amor de Cristo, que excede todo o entendimento, para que sejais cheios de toda a plenitude de Deus.</p>
                  <p><sup>20</sup> Ora, àquele que é poderoso para fazer infinitamente mais do que tudo quanto pedimos ou pensamos, segundo o poder que em nós opera,</p>
                  <p><sup>21</sup> a esse, glória na Igreja, por Cristo Jesus, em todas as gerações, para todo o sempre. Amém.</p>
                </div>
              </div>

              {/* Romanos 11.36 */}
              <div className="bg-white rounded-xl p-6 border-l-4 border-[#d4af37]">
                <h3 className="text-xl font-bold text-[#1e3a5f] mb-4">Romanos 11.36</h3>
                <div className="text-base text-[#2a4a7f] leading-relaxed">
                  <p><sup>36</sup> Porque dele, e por ele, e para ele são todas as coisas; glória, pois, a ele eternamente. Amém.</p>
                </div>
              </div>
            </div>

            {/* Final Prayer */}
            <div className="bg-gradient-to-br from-[#1e3a5f] to-[#2a4a7f] rounded-xl p-8 text-center">
              <Heart className="w-12 h-12 text-[#d4af37] mx-auto mb-4" />
              <p className="text-xl text-white leading-relaxed font-semibold">
                Por fim, nossa oração é para que este projeto, denominado <strong>"Gnosis AI"</strong>, seja um instrumento de Deus para servir ao Seu povo na Terra, auxiliando na compreensão das Escrituras Sagradas.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

