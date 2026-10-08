import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowRight,
  BookOpen,
  Clock3,
  Globe2,
  GraduationCap,
  Mic,
  Play,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import { APP_LOGO, APP_TITLE } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { BONUS_CREDITS } from "@/components/CreditPackages";
import {
  AUDIENCE,
  BRAZIL,
  CLOSE,
  FAQ,
  FOOTER,
  FREE_OFFER,
  HERO,
  HERO_CHIPS,
  HERO_STATS,
  LP_META,
  LP_ROUTES,
  MARQUEE_ITEMS,
  PACKAGES,
  PAIN,
  STEPS,
  THEOLOGIAN_STRIP,
  TOOLS,
  TRUST,
} from "./copy";
import { useReveal } from "./useReveal";
import "./sales-landing.css";

const PAIN_ICONS = [Clock3, Globe2, Sparkles] as const;
const AUDIENCE_ICONS = [Mic, GraduationCap, Users, BookOpen] as const;

function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`lp-reveal ${className}`.trim()}
      style={{ ["--lp-delay" as string]: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function SectionHead({
  id,
  no,
  title,
  center = false,
  children,
}: {
  id?: string;
  no?: string;
  title: string;
  center?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className={`lp-section-head ${center ? "lp-section-head--center" : ""}`.trim()}>
      {no ? (
        <p className="lp-section-no" aria-hidden="true">
          {no}
        </p>
      ) : null}
      <h2 id={id}>{title}</h2>
      {children}
    </div>
  );
}

function ProductMock({
  example,
  groupTitle,
}: {
  example: string;
  groupTitle: string;
}) {
  return (
    <div className="lp-mock" aria-hidden="true">
      <div className="lp-mock-chrome">
        <span className="lp-mock-dots">
          <i />
          <i />
          <i />
        </span>
        <span className="lp-mock-title">{APP_TITLE}</span>
        <span className="lp-mock-badge">{groupTitle}</span>
      </div>
      <div className="lp-mock-body">
        <p className="lp-mock-label">Seu pedido de estudo</p>
        <p className="lp-mock-input">{example}</p>
        <div className="lp-mock-reply">
          <p className="lp-mock-label">Resposta (ilustrativa)</p>
          <div className="lp-mock-lines">
            <span />
            <span />
            <span className="lp-mock-line--short" />
          </div>
        </div>
      </div>
    </div>
  );
}

function CredibilityMarquee() {
  const items = [...MARQUEE_ITEMS, ...THEOLOGIAN_STRIP];
  const track = [...items, ...items];
  return (
    <section className="lp-marquee" aria-label="Destaques da plataforma">
      <div className="lp-marquee-fade lp-marquee-fade--left" aria-hidden="true" />
      <div className="lp-marquee-fade lp-marquee-fade--right" aria-hidden="true" />
      <div className="lp-marquee-track">
        {track.map((label, index) => (
          <span key={`${label}-${index}`}>{label}</span>
        ))}
      </div>
    </section>
  );
}

type Placement =
  | "header"
  | "hero"
  | "steps"
  | "tools"
  | "free"
  | "final"
  | "mobile_sticky"
  | `package_${number}`;

function track(event: string, fields: Record<string, string>) {
  const layer = ((window as Window & { dataLayer?: Record<string, string>[] }).dataLayer ??= []);
  layer.push({
    event,
    page_id: "lp_vendas",
    page_version: "v1",
    ...fields,
  });
}

function youtubeId(url: string) {
  return url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|embed\/)([\w-]{11})/)?.[1] ?? null;
}

function toEmbedUrl(raw: string) {
  const id = youtubeId(raw);
  if (id) return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`;
  if (raw.includes("youtube.com/embed")) return raw.replace("youtube.com", "youtube-nocookie.com");
  return raw;
}

function perThousand(price: number, amount: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format((price / amount) * 1000);
}

function PrimaryCta({
  placement,
  asVisitor,
  flow = false,
  variant = "ink",
}: {
  placement: Placement;
  asVisitor: boolean;
  flow?: boolean;
  variant?: "ink" | "gold";
}) {
  const href = asVisitor ? LP_ROUTES.signup : LP_ROUTES.dashboard;
  const label = asVisitor ? HERO.cta : HERO.ctaLogged;
  return (
    <Link
      href={href}
      className={`lp-btn lp-btn--${variant} ${flow ? "lp-flow-cta" : ""}`.trim()}
      onClick={() => track("cta_click", { placement, action: asVisitor ? "sign_up" : "dashboard" })}
    >
      {label}
      <ArrowRight className="lp-btn-icon" aria-hidden />
    </Link>
  );
}

function HeroVideo() {
  const { data, isLoading, isError } = trpc.settings.getDashboardConfig.useQuery();
  const [playing, setPlaying] = useState(false);
  const [posterOk, setPosterOk] = useState(true);
  const url = data?.videoUrl?.trim() ?? "";
  const embed = url ? toEmbedUrl(url) : "";
  const posterId = url ? youtubeId(url) : null;

  if (isLoading) {
    return (
      <div>
        <p className="lp-video-caption">{HERO.videoCaption}</p>
        <div className="lp-video-shell">
          <div className="lp-video-frame lp-shimmer" aria-hidden="true" />
        </div>
      </div>
    );
  }

  if (isError || !embed) {
    return (
      <div className="lp-video-frame">
        <div className="lp-video-fallback" role="status">
          <p>{HERO.videoFallback}</p>
        </div>
      </div>
    );
  }

  const title = data?.videoTitle || HERO.videoButton;

  return (
    <div className="lp-video-block">
      <p className="lp-video-caption">{HERO.videoCaption}</p>
      <div className="lp-video-shell">
        <div className="lp-video-frame">
          {playing ? (
            <iframe
              src={`${embed}${embed.includes("?") ? "&" : "?"}autoplay=1`}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            <button
              type="button"
              className="lp-video-poster"
              onClick={() => {
                setPlaying(true);
                track("video_start", { video_id: posterId || "dashboard" });
              }}
            >
              {posterId && posterOk ? (
                <img
                  src={`https://i.ytimg.com/vi/${posterId}/hqdefault.jpg`}
                  alt=""
                  onError={() => setPosterOk(false)}
                />
              ) : null}
              <span className="lp-video-play">
                <Play className="lp-video-play-icon" aria-hidden />
                {HERO.videoButton}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ToolBody({ group }: { group: (typeof TOOLS.groups)[number] }) {
  return (
    <div className="lp-tool-body">
      <h3>{group.promise}</h3>
      <ul className="lp-chips">
        {group.tools.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
      <figure className="lp-prompt">
        <figcaption>{TOOLS.exampleLabel}</figcaption>
        <blockquote>{group.example}</blockquote>
      </figure>
    </div>
  );
}

function ToolShowcase() {
  const [active, setActive] = useState(0);
  const [narrow, setNarrow] = useState(false);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setNarrow(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const move = (next: number) => {
    const count = TOOLS.groups.length;
    const index = (next + count) % count;
    setActive(index);
    tabRefs.current[index]?.focus();
  };

  if (narrow) {
    return (
      <div className="lp-acc">
        {TOOLS.groups.map((group, index) => {
          const open = active === index;
          return (
            <div className="lp-acc-item" key={group.id}>
              <button
                type="button"
                aria-expanded={open}
                aria-controls={`tool-panel-${group.id}`}
                onClick={() => setActive(open ? -1 : index)}
              >
                {group.title}
              </button>
              <div className="lp-acc-panel" id={`tool-panel-${group.id}`} hidden={!open}>
                <ToolBody group={group} />
                {open ? <ProductMock example={group.example} groupTitle={group.title} /> : null}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  const group = TOOLS.groups[active];

  return (
    <div className="lp-tool-stage">
      <div className="lp-tabs" role="tablist" aria-label="Grupos de ferramentas">
        {TOOLS.groups.map((item, index) => (
          <button
            key={item.id}
            ref={(node) => {
              tabRefs.current[index] = node;
            }}
            type="button"
            role="tab"
            id={`tool-tab-${item.id}`}
            aria-selected={active === index}
            aria-controls={`tool-panel-${item.id}`}
            tabIndex={active === index ? 0 : -1}
            onClick={() => setActive(index)}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight") {
                event.preventDefault();
                move(index + 1);
              } else if (event.key === "ArrowLeft") {
                event.preventDefault();
                move(index - 1);
              } else if (event.key === "Home") {
                event.preventDefault();
                move(0);
              } else if (event.key === "End") {
                event.preventDefault();
                move(TOOLS.groups.length - 1);
              }
            }}
          >
            {item.title}
          </button>
        ))}
      </div>
      <div className="lp-tool-split">
        <div
          role="tabpanel"
          className="lp-tool-panel"
          id={`tool-panel-${group.id}`}
          aria-labelledby={`tool-tab-${group.id}`}
        >
          <ToolBody group={group} />
        </div>
        <ProductMock example={group.example} groupTitle={group.title} />
      </div>
    </div>
  );
}

function SalesLanding({ asVisitor, setAsVisitor }: { asVisitor: boolean; setAsVisitor: (value: boolean) => void }) {
  const createCheckout = trpc.payments.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.init_point) window.location.href = data.init_point;
    },
    onError: (error) => {
      toast.error(error.message || "Não foi possível abrir o pagamento.");
    },
  });
  const [stickyOn, setStickyOn] = useState(false);
  const [headerElevated, setHeaderElevated] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      setHeaderElevated(window.scrollY > 48);
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const max = scrollHeight - clientHeight;
      setScrollProgress(max > 0 ? scrollTop / max : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll(".lp-flow-cta, .lp-footer"));
    const visible = new Set<Element>();
    const narrow = window.matchMedia("(max-width: 767px)");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target);
          else visible.delete(entry.target);
        }
        setStickyOn(narrow.matches && visible.size === 0);
      },
      { threshold: 0.35 },
    );
    nodes.forEach((node) => observer.observe(node));
    const onResize = () => {
      if (!narrow.matches) setStickyOn(false);
    };
    narrow.addEventListener("change", onResize);
    return () => {
      observer.disconnect();
      narrow.removeEventListener("change", onResize);
    };
  }, [asVisitor]);

  const buy = (amount: number, price: number) => {
    const placement = `package_${amount}` as Placement;
    track("select_item", { placement, action: "credits" });
    if (asVisitor) {
      sessionStorage.setItem(
        "gnosis_lp_credit_intent",
        JSON.stringify({ amount, placement, page_id: "lp_vendas" }),
      );
      return;
    }
    createCheckout.mutate({
      type: "credits",
      id: String(amount),
      price,
      title: `Recarga de ${amount} créditos - Gnosis AI`,
    });
  };

  return (
    <div className={`lp ${stickyOn ? "lp--sticky" : ""}`}>
      <div className="lp-grain" aria-hidden="true" />
      <div className="lp-chrome">
        <div className="lp-preview">
          <p>
            Prévia interna. Só administradores entram nesta página. O vídeo é o mesmo do dashboard.
          </p>
          <div className="lp-preview-actions">
            <button type="button" aria-pressed={asVisitor} onClick={() => setAsVisitor(true)}>
              Ver como visitante
            </button>
            <button type="button" aria-pressed={!asVisitor} onClick={() => setAsVisitor(false)}>
              Ver como aluno logado
            </button>
            <Link href="/admin">Voltar ao admin</Link>
          </div>
        </div>
        <div className="lp-nav-shell">
          <header className={`lp-header ${headerElevated ? "lp-header--elevated" : ""}`}>
            <a className="lp-brand" href="#inicio">
              <img src={APP_LOGO} alt="" />
              <span>{APP_TITLE}</span>
            </a>
            <nav className="lp-nav" aria-label="Seções">
              <a href="#como-funciona">Como funciona</a>
              <a href="#ferramentas">Ferramentas</a>
              <a href="#conta-free">Conta grátis</a>
              <a href="#creditos">Créditos</a>
              <a href="#perguntas">FAQ</a>
            </nav>
            <div className="lp-header-actions">
              <Link className="lp-login" href={asVisitor ? LP_ROUTES.login : LP_ROUTES.dashboard}>
                {asVisitor ? "Entrar" : "Painel"}
              </Link>
              <PrimaryCta placement="header" asVisitor={asVisitor} />
            </div>
          </header>
        </div>
        <div className="lp-progress" aria-hidden="true">
          <div className="lp-progress-bar" style={{ transform: `scaleX(${scrollProgress})` }} />
        </div>
      </div>

      <main id="inicio">
        <section className="lp-hero" aria-labelledby="lp-hero-title">
          <div className="lp-hero-glow" aria-hidden="true" />
          <div className="lp-wrap lp-hero-grid">
            <div className="lp-rubric lp-rise">
              <p className="lp-kicker">{HERO.kicker}</p>
              <h1 id="lp-hero-title" aria-label={HERO.title}>
                <span className="lp-h1-lead">{HERO.titleLead}</span>
                <span className="lp-h1-accent">{HERO.titleAccent}</span>
              </h1>
              <p className="lp-lead">{HERO.subtitle}</p>
              <ul className="lp-hero-chips" aria-label="Áreas de estudo">
                {HERO_CHIPS.map((chip) => (
                  <li key={chip}>{chip}</li>
                ))}
              </ul>
              <div className="lp-hero-actions">
                <PrimaryCta placement="hero" asVisitor={asVisitor} flow variant="gold" />
                <a className="lp-text-link" href="#creditos">
                  {HERO.secondary}
                </a>
              </div>
              <p className="lp-micro">{HERO.micro}</p>
              <ul className="lp-stats" aria-label="Resumo da conta gratuita">
                {HERO_STATS.map((stat) => (
                  <li key={stat.label}>
                    <span className="lp-stat-value">{stat.value}</span>
                    <span className="lp-stat-label">{stat.label}</span>
                  </li>
                ))}
              </ul>
              <p className="lp-support">{HERO.support}</p>
            </div>
            <div className="lp-rise lp-rise-late">
              <HeroVideo />
            </div>
          </div>
        </section>

        <CredibilityMarquee />

        <section className="lp-section lp-band lp-band--mesh" id="desafio" aria-labelledby="lp-pain-title">
          <div className="lp-wrap">
            <Reveal>
              <SectionHead id="lp-pain-title" no="01" title={PAIN.title} />
            </Reveal>
            <div className="lp-pain-grid">
              {PAIN.items.map((item, index) => {
                const Icon = PAIN_ICONS[index] ?? Sparkles;
                return (
                  <Reveal key={item.title} delay={index * 80}>
                    <article className="lp-pain-card">
                      <div className="lp-icon-ring">
                        <Icon aria-hidden />
                      </div>
                      <p className="lp-index" aria-hidden="true">
                        {String(index + 1).padStart(2, "0")}
                      </p>
                      <h3>{item.title}</h3>
                      <p>{item.body}</p>
                    </article>
                  </Reveal>
                );
              })}
            </div>
            <Reveal>
              <p className="lp-bridge">{PAIN.bridge}</p>
            </Reveal>
          </div>
        </section>

        <section className="lp-section lp-section--steps" id="como-funciona" aria-labelledby="lp-steps-title">
          <div className="lp-wrap">
            <Reveal>
              <SectionHead id="lp-steps-title" no="02" title={STEPS.title} />
            </Reveal>
            <div className="lp-steps">
              {STEPS.items.map((item, index) => (
                <Reveal key={item.title} delay={index * 90}>
                  <article className="lp-step">
                    <span className="lp-step-badge">{String(index + 1).padStart(2, "0")}</span>
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </article>
                </Reveal>
              ))}
            </div>
            <div className="lp-hero-actions">
              <PrimaryCta placement="steps" asVisitor={asVisitor} flow />
            </div>
            <p className="lp-micro">{STEPS.support}</p>
          </div>
        </section>

        <section className="lp-section lp-band" id="para-quem" aria-labelledby="lp-audience-title">
          <div className="lp-wrap">
            <Reveal>
              <SectionHead id="lp-audience-title" no="03" title={AUDIENCE.title} />
            </Reveal>
            <div className="lp-tiles">
              {AUDIENCE.items.map((item, index) => {
                const Icon = AUDIENCE_ICONS[index] ?? BookOpen;
                return (
                  <Reveal key={item.title} delay={index * 70}>
                    <article className="lp-tile">
                      <div className="lp-tile-top">
                        <div className="lp-icon-ring lp-icon-ring--soft">
                          <Icon aria-hidden />
                        </div>
                        <span className="lp-tile-line" aria-hidden="true" />
                      </div>
                      <h3>{item.title}</h3>
                      <p>{item.body}</p>
                    </article>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        <section className="lp-section lp-section--tools" id="ferramentas" aria-labelledby="lp-tools-title">
          <div className="lp-wrap">
            <Reveal>
              <SectionHead id="lp-tools-title" no="04" title={TOOLS.title}>
                <p className="lp-lead">{TOOLS.intro}</p>
              </SectionHead>
            </Reveal>
            <Reveal delay={80}>
              <ToolShowcase />
            </Reveal>
            <div className="lp-hero-actions">
              <PrimaryCta placement="tools" asVisitor={asVisitor} flow />
            </div>
            <p className="lp-micro">{TOOLS.support}</p>
          </div>
        </section>

        <section className="lp-section lp-band lp-band--ink lp-band--brazil" id="brasil" aria-labelledby="lp-brazil-title">
          <div className="lp-wrap lp-brazil-grid">
            <Reveal>
              <div>
                <p className="lp-kicker">Contextualização brasileira</p>
                <h2 id="lp-brazil-title">{BRAZIL.title}</h2>
                <p className="lp-measure">{BRAZIL.body}</p>
              </div>
            </Reveal>
            <Reveal delay={100}>
              <blockquote className="lp-pull">
                <Globe2 className="lp-pull-icon" aria-hidden />
                {BRAZIL.example}
              </blockquote>
            </Reveal>
          </div>
        </section>

        <section className="lp-section" id="confianca" aria-labelledby="lp-trust-title">
          <div className="lp-wrap">
            <Reveal>
              <SectionHead id="lp-trust-title" no="05" title={TRUST.title} />
            </Reveal>
            <ul className="lp-theologians" aria-label="Referências teológicas na plataforma">
              {THEOLOGIAN_STRIP.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
            <div className="lp-trust-grid">
              <Reveal>
                <article className="lp-trust-card">
                  <BookOpen className="lp-trust-icon" aria-hidden />
                  <p>{TRUST.tradition}</p>
                </article>
              </Reveal>
              <Reveal delay={90}>
                <article className="lp-trust-card">
                  <Shield className="lp-trust-icon" aria-hidden />
                  <p>{TRUST.limit}</p>
                </article>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="lp-section lp-band lp-section--free" id="conta-free" aria-labelledby="lp-free-title">
          <div className="lp-wrap">
            <Reveal>
              <SectionHead id="lp-free-title" no="06" title={FREE_OFFER.title} center />
            </Reveal>
            <div className="lp-free-spotlight">
              <Reveal>
                <article className="lp-free-hero-card">
                  <p className="lp-kicker">Conta Free</p>
                  <p className="lp-free-hero-lead">
                    Cadastro sem cartão. <strong>Todas as ferramentas</strong> disponíveis desde o primeiro acesso.
                  </p>
                  <PrimaryCta placement="free" asVisitor={asVisitor} flow variant="gold" />
                  <p className="lp-micro">{HERO.micro}</p>
                </article>
              </Reveal>
              <div className="lp-free-grid">
                {FREE_OFFER.items.map((item, index) => (
                  <Reveal key={item.label} delay={index * 70}>
                    <article className="lp-free-item">
                      <p className="lp-figure">{item.figure}</p>
                      <h3>{item.label}</h3>
                      <p>{item.body}</p>
                    </article>
                  </Reveal>
                ))}
              </div>
            </div>
            <Reveal>
              <p className="lp-billing lp-billing--center">{FREE_OFFER.tools}</p>
              <p className="lp-billing lp-billing--center">{FREE_OFFER.billing}</p>
            </Reveal>
          </div>
        </section>

        <section className="lp-section lp-section--pricing" id="creditos" aria-labelledby="lp-packages-title">
          <div className="lp-wrap">
            <Reveal>
              <SectionHead id="lp-packages-title" no="07" title={PACKAGES.title} center>
                <p className="lp-lead">{PACKAGES.subtitle}</p>
              </SectionHead>
            </Reveal>
            <div className="lp-packages">
              {BONUS_CREDITS.map((pack, index) => {
                const pending = createCheckout.isPending && createCheckout.variables?.id === String(pack.amount);
                const label = asVisitor ? PACKAGES.visitorCta : `Comprar ${pack.amount.toLocaleString("pt-BR")} créditos`;
                return (
                  <Reveal key={pack.amount} delay={index * 60}>
                  <article className={`lp-pack ${pack.featured ? "lp-pack--best" : ""}`}>
                    {pack.featured ? <span className="lp-badge">{PACKAGES.badge}</span> : null}
                    <p className="lp-pack-amount">{pack.amount.toLocaleString("pt-BR")}</p>
                    <p className="lp-pack-unit">créditos</p>
                    <p className="lp-pack-price">{pack.label}</p>
                    <p className="lp-pack-unit">{perThousand(pack.price, pack.amount)} por mil</p>
                    <p>{PACKAGES.support[pack.amount]}</p>
                    {asVisitor ? (
                      <Link
                        href={LP_ROUTES.signup}
                        className="lp-btn"
                        onClick={() => buy(pack.amount, pack.price)}
                      >
                        {label}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        className="lp-btn"
                        disabled={createCheckout.isPending}
                        onClick={() => buy(pack.amount, pack.price)}
                      >
                        {pending ? "Abrindo pagamento…" : label}
                      </button>
                    )}
                    {asVisitor ? <p>{PACKAGES.visitorSupport}</p> : null}
                  </article>
                  </Reveal>
                );
              })}
            </div>
            <p className="lp-note">{PACKAGES.note}</p>
          </div>
        </section>

        <section className="lp-section lp-band" id="perguntas" aria-labelledby="lp-faq-title">
          <div className="lp-wrap">
            <Reveal>
              <SectionHead id="lp-faq-title" no="08" title="Perguntas frequentes" center />
            </Reveal>
            <div className="lp-faq lp-faq-grid">
              {FAQ.map((item) => (
                <details
                  key={item.id}
                  name="lp-faq"
                  onToggle={(event) => {
                    if ((event.currentTarget as HTMLDetailsElement).open) {
                      track("faq_open", { faq_id: item.id });
                    }
                  }}
                >
                  <summary>{item.q}</summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-section lp-close" id="comecar" aria-labelledby="lp-close-title">
          <div className="lp-wrap">
            <Reveal>
              <div className="lp-close-panel">
                <h2 id="lp-close-title">{CLOSE.title}</h2>
                <p className="lp-lead">{CLOSE.body}</p>
                <div className="lp-hero-actions">
                  <PrimaryCta placement="final" asVisitor={asVisitor} flow variant="gold" />
                </div>
                <p className="lp-micro">{HERO.micro}</p>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-wrap lp-footer-pro">
          <div className="lp-footer-brand">
            <a className="lp-brand" href="#inicio">
              <img src={APP_LOGO} alt="" />
              <span>{APP_TITLE}</span>
            </a>
            <p>{FOOTER.description}</p>
            <p className="lp-footer-tagline">{FOOTER.tagline}</p>
            <PrimaryCta placement="final" asVisitor={asVisitor} />
          </div>
          <div className="lp-footer-col">
            <p className="lp-footer-heading">Navegação</p>
            <nav aria-label="Rodapé — navegação">
              <a href="#como-funciona">Como funciona</a>
              <a href="#ferramentas">Ferramentas</a>
              <a href="#creditos">Créditos</a>
              <a href="#perguntas">FAQ</a>
            </nav>
          </div>
          <div className="lp-footer-col">
            <p className="lp-footer-heading">Institucional</p>
            <nav aria-label="Rodapé — institucional">
              <Link href={LP_ROUTES.faq}>Perguntas frequentes</Link>
              <Link href={LP_ROUTES.about}>Sobre</Link>
              <a href={LP_ROUTES.contact}>Contato</a>
              <Link href={LP_ROUTES.login}>Entrar</Link>
            </nav>
          </div>
        </div>
        <div className="lp-wrap lp-footer-legal">
          <p>{FOOTER.previewNote}</p>
        </div>
      </footer>

      <div className={`lp-sticky ${stickyOn ? "is-on" : ""}`}>
        <PrimaryCta placement="mobile_sticky" asVisitor={asVisitor} />
      </div>
    </div>
  );
}

export default function SalesLandingPage() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [asVisitor, setAsVisitor] = useState(true);
  const allowed = user?.role === "admin" || user?.role === "super_admin";

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) setLocation("/auth");
    else if (user && !allowed) setLocation("/dashboard");
  }, [loading, isAuthenticated, user, allowed, setLocation]);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = LP_META.title;
    let robots = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    const createdRobots = !robots;
    if (!robots) {
      robots = document.createElement("meta");
      robots.name = "robots";
      document.head.appendChild(robots);
    }
    const previousRobots = robots.content;
    robots.content = "noindex, nofollow";
    const description = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    const previousDescription = description?.content;
    if (description) description.content = LP_META.description;
    return () => {
      document.title = previousTitle;
      if (createdRobots) robots?.remove();
      else if (robots) robots.content = previousRobots;
      if (description && previousDescription !== undefined) description.content = previousDescription;
    };
  }, []);

  if (loading || !allowed) {
    return (
      <div className="lp-gate" role="status">
        Carregando a prévia…
      </div>
    );
  }

  return <SalesLanding asVisitor={asVisitor} setAsVisitor={setAsVisitor} />;
}
