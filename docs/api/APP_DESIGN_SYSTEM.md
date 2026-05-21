# Gnosis AI - App Design System & Guidelines

Este documento fornece as diretrizes visuais e arquiteturais de design (Design System) para a criação dos aplicativos móveis (iOS e Android) do Gnosis AI. O objetivo é manter a consistência visual de "Parchment & Gold" (Pergaminho e Ouro) estabelecida no frontend web, garantindo uma experiência premium, clássica e imersiva.

## 1. Tipografia (Typography)

O aplicativo deve importar e utilizar exatamente as mesmas fontes do Google Fonts utilizadas no site web.

*   **Títulos e Cabeçalhos (Headings - H1 ao H6)**
    *   **Fonte:** `Cinzel` (Serif)
    *   **Pesos (Weights):** Regular (400), SemiBold (600), Bold (700)
    *   **Uso:** Nomes de ferramentas de IA, títulos de telas, destaques no dashboard.
*   **Corpo de Texto (Body & Inputs)**
    *   **Fonte:** `Crimson Text` (Serif)
    *   **Pesos (Weights):** Regular (400), SemiBold (600), Italic (400i)
    *   **Uso:** Textos gerados pela IA, descrições, botões, campos de texto, histórico de chat.

> [!TIP]
> **Dica Mobile:** No React Native, use bibliotecas como `expo-font` ou baixe os arquivos `.ttf` do Google Fonts para incorporar no projeto nativo de forma offline para garantir o carregamento instantâneo.

---

## 2. Paleta de Cores (Color Palette)

O aplicativo suporta implicitamente o **Light Mode** e **Dark Mode**. Os desenvolvedores mobile devem configurar seus `ThemeProviders` (seja no React Native Navigation, Flutter ThemeData, ou SwiftUI) usando estes tokens exatos.

### Tema Principal (Parchment & Gold Theme) - Light Mode
O tema principal traz uma estética de estudos teológicos clássicos.

*   **Background (Fundo Principal):**
    *   Hex: `#FFFACD` (Cream/Pergaminho)
    *   Uso: Fundo das telas principais (Dashboard, Lista de Estudos).
*   **Foreground (Texto Principal):**
    *   Hex: `#1E3A5F` (Navy / Azul Marinho Escuro)
    *   Uso: Textos gerais, títulos.
*   **Primary (Cor Principal de Destaque):**
    *   Hex: `#D4AF37` (Gold / Ouro)
    *   Uso: Botões primários, ícones ativos, bordas de destaque.
*   **Primary Foreground (Texto sobre a Cor Principal):**
    *   Hex: `#1E3A5F` (Navy)
    *   Uso: Texto dentro de botões dourados.
*   **Secondary (Secundária):**
    *   Hex: `#8B6F47` (Brown / Marrom clássico)
    *   Uso: Botões secundários, detalhes, badges.
*   **Muted (Fundo de elementos neutros):**
    *   Cor: Creme um pouco mais escuro ou opaco.
    *   Uso: Fundo de mensagens do usuário no chat, placeholders.
*   **Destructive / Error:**
    *   Hex: `#E63946` (Vermelho)
    *   Uso: Botões de excluir estudo, mensagens de erro de saldo insuficiente.

### Tema Escuro (Dark Mode)
O tema escuro utiliza uma paleta invertida, baseada em tons profundos de azul/marinho com detalhes dourados.

*   **Background:** Azul muito escuro (próximo do preto).
*   **Foreground:** Branco / Off-white.
*   **Primary:** Ouro (Mesmo `#D4AF37` do light mode para contraste) ou um tom mais vibrante.
*   **Card / Popover:** Azul Escuro (levemente mais claro que o background para gerar profundidade).

---

## 3. Elementos de Interface (UI Components)

### Raios de Borda (Border Radius)
O visual não é nem totalmente quadrado, nem totalmente arredondado. Ele mantém um leve arredondamento premium.
*   **Base Radius:** `12px` (`0.75rem`)
*   **Uso:** Cartões de ferramentas, modais, botões principais, balões de chat.

### Botões (Buttons)
*   **Primário:** Fundo `#D4AF37` (Gold), Texto `#1E3A5F` (Navy), Borda arredondada (12px).
*   **Secundário/Ghost:** Fundo transparente, borda de `1px` sólida na cor Gold, Texto Navy.
*   **Interações:** Adicionar efeito de opacidade (`0.7` ou `0.8`) no estado `Pressed` (Mobile).

### Campos de Texto (Inputs / TextAreas)
*   **Fundo:** Transparente ou levemente opaco (Cream escuro).
*   **Bordas:** `1px` sólida na cor Gold (`#D4AF37`).
*   **Foco (Active/Focus):** Aumentar espessura da borda para `2px` ou adicionar um anel luminoso (Ring) na mesma cor dourada.

### Balões de Chat (Interface de Estudo)
A tela de geração de estudos é o Core do App. Deve seguir o padrão de interface conversacional:
*   **Mensagem do Usuário:**
    *   Alinhamento: Direita.
    *   Estilo: Fundo Creme Neutro / Marrom claro, com cantos arredondados (exceto o canto inferior direito).
*   **Mensagem da IA (Estudo Gerado):**
    *   Alinhamento: Esquerda.
    *   Estilo: Sem fundo fechado (transparente) ou fundo muito suave, com a fonte `Crimson Text`. Permitir renderização de **Markdown** nativo (Textos em negrito, listas, citações).

---

## 4. Animações e Micro-Interações

Para transmitir a sensação de um aplicativo "Premium", as transições não devem ser abruptas.

1.  **Skeleton Loaders:** Ao carregar listas (ferramentas, histórico) ou ao abrir a tela de Perfil, utilizar *Skeleton Screens* com uma leve animação de pulso/brilho no tom Creme/Dourado, em vez de spinners clássicos.
2.  **Gerando Estudo (Loading de IA):**
    *   Durante a chamada de `POST /api/v1/mobile/tools/generate` (que pode demorar alguns segundos), a tela não pode ficar congelada.
    *   Exibir uma animação temática (ex: um ícone de livro ou pena desenhando, ou partículas douradas) com a frase dinâmica: *"Buscando nas escrituras...", "Estruturando o estudo..."*.
3.  **Transições de Tela:** Suaves transições horizontais padrão nativas (Slide do iOS ou Fade-through do Material Design 3).

---

## 5. Estrutura Visual Base (Layout)

### Bottom Navigation (Barra Inferior)
O App utilizará uma navegação inferior fixa para as funções principais do usuário.
*   **Ícones Sugeridos (Lucide Icons, como na web):**
    1.  **Início (Home/Dashboard):** Ícone `LayoutGrid`. Lista de ferramentas.
    2.  **Meus Estudos:** Ícone `BookOpen`. Lista do histórico salvo.
    3.  **Assinatura/Planos:** Ícone `Star` ou `CreditCard`. Visualização de saldo e planos.
    4.  **Perfil:** Ícone `User`. Configurações, afiliado, logout.

### AppBar / Header (Barra Superior)
*   **Padrão:** O Header deve conter o logo "Gnosis AI" centralizado com a fonte `Cinzel`.
*   **Lado Direito:** Um indicativo sutil com um ícone de moeda/raio dourado mostrando o "Saldo Atual" de créditos, chamando a API `/credits/balance`. Ao clicar, leva para a tela de Assinaturas/Planos.

---

> [!IMPORTANT]
> **Renderização de Markdown**
> É crítico que o app possua uma biblioteca robusta de renderização de Markdown (ex: `react-native-markdown-display` para React Native). As respostas da IA contêm cabeçalhos (H2, H3), negritos e listas. O visual do markdown deve ser mapeado para utilizar a fonte `Crimson Text` no conteúdo e `Cinzel` nos cabeçalhos gerados pela IA.
