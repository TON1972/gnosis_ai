export const LP_ROUTES = {
  signup: "/auth?tab=register",
  login: "/auth",
  dashboard: "/dashboard",
  contact: "mailto:contato@gnosisai.global",
  faq: "/faq",
  about: "/sobre",
} as const;

export const LP_META = {
  title: "GNOSIS AI | Estudo bíblico com IA. Comece grátis",
  description:
    "Aprofunde seu estudo bíblico com IA. Crie uma conta grátis, receba 800 créditos iniciais e 50 por dia. Sem cartão e sem mensalidade.",
};

export const HERO = {
  kicker: "Estudo bíblico com inteligência artificial",
  title: "Seu próximo estudo bíblico merece mais profundidade. Comece grátis.",
  subtitle:
    "Prepare sermões, aprofunde passagens e organize pesquisas com IA para o estudo bíblico. Para pastores, seminaristas e quem quer compreender melhor a Palavra.",
  cta: "Criar conta grátis",
  ctaLogged: "Ir para meu painel",
  micro: "Sem cartão. 800 créditos no cadastro e 50 por dia. Todas as ferramentas.",
  secondary: "Ver créditos",
  videoButton: "Veja a GNOSIS AI em ação",
  videoCaption: "Da passagem ao estudo: veja como começar.",
  videoFallback:
    "Não foi possível carregar o vídeo. Você pode criar sua conta e conhecer a plataforma.",
  support: "Exegese, sermão, doutrina e pesquisa no mesmo lugar.",
  titleLead: "Seu próximo estudo bíblico merece mais profundidade.",
  titleAccent: "Comece grátis.",
};

export const HERO_STATS = [
  { value: "800", label: "créditos no cadastro" },
  { value: "50", label: "créditos por dia" },
  { value: "Todas", label: "ferramentas liberadas" },
] as const;

export const HERO_CHIPS = [
  "Exegese",
  "Esboço de sermão",
  "Doutrina",
  "Pesquisa acadêmica",
  "Contexto brasileiro",
] as const;

export const MARQUEE_ITEMS = [
  "Hermenêutica",
  "Estudo bíblico com IA",
  "Sem mensalidade",
  "800 créditos no cadastro",
  "Todas as ferramentas liberadas",
  "Créditos avulsos sem prazo",
] as const;

export const THEOLOGIAN_STRIP = [
  "Agostinho",
  "Tomás de Aquino",
  "Lutero",
  "Calvino",
  "Wesley",
  "Barth",
  "C. S. Lewis",
  "Bonhoeffer",
  "N. T. Wright",
  "Timothy Keller",
] as const;

export const PAIN = {
  title: "A semana corre. Seu estudo exige profundidade.",
  items: [
    {
      title: "O domingo chega antes do preparo",
      body: "A agenda aperta, as referências se espalham e o estudo fica para depois. Você precisa de um caminho organizado para aprofundar o texto e preparar o que vai ensinar.",
    },
    {
      title: "O contexto da sua igreja importa",
      body: "Nem toda referência conversa com a realidade brasileira. Preparar uma boa aplicação exige considerar a cultura, os desafios e as perguntas de quem vai ouvir.",
    },
    {
      title: "Uma resposta pronta não basta",
      body: "Ao estudar teologia com IA, você precisa de contexto e espaço para aprofundar. Um texto convincente, sozinho, não resolve as perguntas da passagem.",
    },
  ],
  bridge: "Escolha a passagem. A GNOSIS AI ajuda a organizar o caminho para estudá-la.",
};

export const STEPS = {
  title: "Pare de adiar. Comece pelo próximo texto.",
  items: [
    {
      title: "Crie sua conta grátis.",
      body: "Entre com e-mail ou Google, sem cartão, e receba 800 créditos iniciais.",
    },
    {
      title: "Escolha o que quer preparar.",
      body: "Selecione uma ferramenta, informe a passagem ou o tema e solicite seu estudo.",
    },
    {
      title: "Aprofunde e leve com você.",
      body: "Continue a conversa, consulte o estudo salvo e baixe em PDF ou texto; compre créditos apenas se quiser ir além do saldo disponível.",
    },
  ],
  support: "Seu primeiro passo não exige pagamento.",
};

export const AUDIENCE = {
  title: "O que você precisa preparar agora?",
  items: [
    {
      title: "Pastor e pregador",
      body: "Organize o caminho entre a passagem e a mensagem. Trabalhe contexto, estrutura e aplicação antes de subir ao púlpito.",
    },
    {
      title: "Seminarista e pesquisador",
      body: "Dê direção à pesquisa e ao argumento. Estruture o trabalho e revise as referências com apoio especializado.",
    },
    {
      title: "Professor de escola bíblica",
      body: "Transforme uma passagem em uma aula clara. Prepare explicações e aplicações para a realidade da sua turma.",
    },
    {
      title: "Quem estuda a Bíblia",
      body: "Vá além da primeira leitura. Explore o contexto e aprofunde as perguntas que surgem no texto.",
    },
  ],
};

export const TOOLS = {
  title: "Não pare na resposta. Aprofunde o estudo.",
  intro:
    "Todas as ferramentas estão disponíveis na conta Free. Escolha seu objetivo e encontre um caminho de estudo. Cada geração consome créditos do seu saldo.",
  exampleLabel: "Exemplo de pedido",
  support: "Escolha sua ferramenta. Comece com os créditos gratuitos.",
  groups: [
    {
      id: "texto",
      title: "Estudo do texto",
      promise: "Entenda a passagem antes de construir a aplicação.",
      tools: ["Hermenêutica", "Exegese", "Traduções", "Resumos", "Escatologia bíblica"],
      example:
        "Analise Romanos 8:1–11 considerando contexto, estrutura e termos importantes do original.",
    },
    {
      id: "pregacao",
      title: "Pregação e ministério",
      promise: "Dê estrutura à mensagem e clareza à aplicação.",
      tools: ["Esboços de pregação", "Análise de linguagem ministerial", "Contextualização brasileira"],
      example:
        "Organize um esboço sobre Lucas 10:25–37 e proponha aplicações para uma igreja urbana brasileira.",
    },
    {
      id: "teologia",
      title: "Teologia",
      promise: "Compare argumentos e compreenda como as doutrinas se desenvolveram.",
      tools: [
        "Estudos doutrinários",
        "Análise teológica comparada",
        "Teologia sistemática",
        "Religiões comparadas",
        "Patrística",
        "Linha do tempo teológica",
        "Apologética avançada",
      ],
      example:
        "Compare as perspectivas calvinista e arminiana sobre a salvação, apresentando os argumentos de cada uma.",
    },
    {
      id: "academia",
      title: "Academia e pesquisa",
      promise: "Organize a pesquisa sem perder o fio do argumento.",
      tools: ["Redação acadêmica", "Referências ABNT/APA", "Dados demográficos", "Transcrição de mídia"],
      example: "Proponha uma estrutura de artigo sobre o contexto histórico da carta aos Filipenses.",
    },
  ],
};

export const BRAZIL = {
  title: "A aplicação precisa conversar com quem ouve.",
  body: "A GNOSIS AI inclui uma ferramenta de contextualização brasileira para aproximar o estudo da cultura, da sociedade e da religiosidade daqui. Trabalhe aplicações para a realidade da sua comunidade, mantendo o texto bíblico como referência.",
  example:
    "Ao estudar o bom samaritano, explore aplicações sobre cuidado com o próximo na rotina de um bairro brasileiro.",
};

export const TRUST = {
  title: "Mais referências para estudar. Discernimento para ensinar.",
  tradition:
    "As ferramentas foram desenhadas para dialogar com a tradição cristã: Agostinho, Tomás de Aquino, Lutero, Calvino, Wesley, Barth, C. S. Lewis, Bonhoeffer, N. T. Wright e Timothy Keller. Nas comparações, explore os argumentos de diferentes perspectivas.",
  limit:
    "A GNOSIS AI apoia seu estudo; não substitui a Bíblia, a oração nem o pastor. Confira os resultados no texto bíblico e na bibliografia. O discernimento continua com você e sua comunidade.",
};

export const FREE_OFFER = {
  title: "Comece grátis. Recarregue quando precisar.",
  items: [
    { figure: "800", label: "créditos no cadastro", body: "Receba uma vez e use até acabar." },
    { figure: "50", label: "créditos por dia", body: "O saldo diário renova. O que sobra do dia não acumula." },
    { figure: "Sem prazo", label: "créditos comprados", body: "Adicione saldo quando quiser continuar além dos créditos gratuitos." },
  ],
  tools: "Todas as ferramentas já estão liberadas. O que você utiliza é o saldo de créditos.",
  billing: "Sem cartão no cadastro. Sem mensalidade.",
};

export const PACKAGES = {
  title: "Quer continuar? Compre créditos, sem mensalidade.",
  subtitle: "Compra única por PIX ou cartão. Seus créditos avulsos ficam disponíveis até você usar.",
  badge: "Melhor valor",
  visitorCta: "Criar conta grátis",
  visitorSupport: "Você pode experimentar antes de comprar.",
  note: "Os 50 créditos diários continuam após a compra. O consumo usa primeiro os diários, depois os iniciais e, por último, os avulsos, que não vencem.",
  support: {
    1000: "Para explorar além do saldo gratuito.",
    3000: "Para dar continuidade à sua rotina de estudos.",
    6000: "O menor preço por mil créditos entre os pacotes.",
    10000: "Para quem prefere uma reserva maior de créditos.",
  } as Record<number, string>,
};

export const FAQ = [
  {
    id: "assinar",
    q: "Preciso assinar ou pagar para começar?",
    a: "Não. Você cria uma conta Free e recebe 800 créditos iniciais, além de 50 por dia. Todas as ferramentas ficam disponíveis. A compra de créditos é opcional e não cria mensalidade.",
  },
  {
    id: "cartao",
    q: "Preciso informar meu cartão?",
    a: "Não. O cadastro não pede cartão e não inicia cobrança automática. Você só paga quando decide comprar um pacote de créditos.",
  },
  {
    id: "vencem",
    q: "Meus créditos vencem?",
    a: "Os 50 créditos diários não acumulam. Os 800 iniciais são concedidos uma vez e ficam disponíveis até você usar. Os créditos avulsos comprados não vencem. O consumo prioriza os diários, depois os iniciais e, por último, os avulsos.",
  },
  {
    id: "confiar",
    q: "Posso confiar em tudo que a IA escreve?",
    a: "A IA pode cometer erros. Use a GNOSIS AI para organizar e aprofundar o estudo, conferindo interpretações e referências na Bíblia e na bibliografia. Ela não substitui a Escritura nem o discernimento da sua comunidade.",
  },
  {
    id: "seminario",
    q: "Serve para quem não fez seminário?",
    a: "Sim. Você pode começar com resumos e contexto de passagens e avançar conforme suas perguntas. O mesmo painel também oferece recursos para preparação de sermões e pesquisa acadêmica.",
  },
  {
    id: "celular",
    q: "Funciona no celular?",
    a: "Sim. Você acessa pelo navegador e pode instalar o site na tela inicial. É necessário estar conectado à internet para usar a plataforma.",
  },
  {
    id: "por-que",
    q: "Por que usar a GNOSIS AI?",
    a: "Você encontra caminhos específicos para o estudo bíblico: contexto, originais, doutrina, pregação, pesquisa e aplicação brasileira. Escolha a ferramenta e continue aprofundando o estudo na mesma sala.",
  },
  {
    id: "pacote",
    q: "Qual pacote devo comprar primeiro?",
    a: "Nenhum é necessário para começar. Experimente os créditos gratuitos e observe seu uso. Quando quiser recarregar, o pacote de 1.000 é a menor compra, e o de 6.000 oferece o menor preço por mil créditos.",
  },
];

export const CLOSE = {
  title: "Abra sua conta. Dê profundidade ao próximo estudo.",
  body: "Você já tem uma passagem para estudar, uma aula para preparar ou uma pergunta para aprofundar. Comece grátis com um instrumento a serviço da compreensão das Escrituras.",
};

export const FOOTER = {
  description:
    "Ferramentas de inteligência artificial para aprofundar o estudo bíblico — sermão, exegese, doutrina e pesquisa em um só lugar.",
  tagline: "A serviço da compreensão das Escrituras.",
  previewNote: "Prévia interna para administradores.",
};
