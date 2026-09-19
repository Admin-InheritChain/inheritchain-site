# InheritChain — Landing Page: Ponto de Situação

**Data:** 8 Agosto 2026  
**URL local:** http://localhost:8082  
**Ficheiros:** `index.html`, `styles.css`, `gsap.min.js`, `InheritChain_logo_v2.png`

---

## Estrutura Atual

### Layout
- **Header (navbar):** vazio (sem elementos visíveis)
- **Hero section:**
  - **Orbital** (canto superior direito, 620px, absolute positioned)
    - `orb-glow` — gradiente radial azul/ciano, blur(50px), breathing animation
    - `orb` — 520px, 3 camadas (`span`) com morph orgânico
  - **hero-bottom** (canto inferior esquerdo, flex column, align flex-start)
    - Logo InheritChain (50px height, mix-blend-mode: screen)
    - h1: "Where / digital legacy / meets immortality." (50% viewport width, 3 linhas com `<br>`)
    - Waitlist form (input email + botão "Join waitlist")
- **Side labels** (lado direito, rodado -90°):
  - "Privacy by design"
  - "Coming soon"

### Elementos Removidos
- Logo dentro da esfera (hero-logo)
- Status "Building" (com dot pulsante)
- Build canvas com partículas convergentes
- Progress ring
- Chain-link animation (elos do logo)
- Heartbeat animation

---

## Animações Ativas (GSAP)

### Timeline de entrada (page load)
1. `header` — slide down + fade in (1s)
2. `.orb-glow` — scale 0.6→1 + fade in (1.6s, expo.out)
3. `.orb` — scale 0.5→1 + fade in (1.4s, expo.out)
4. `.nav-logo` — slide up + fade in (0.8s)
5. `.hero-bottom` — fade in (0.1s)
6. `.hero-title` — slide up + fade in (1s)
7. `.waitlist-form` — slide up + fade in (0.6s)

### Animações contínuas
- **Rotação do orb:** 360° em 120s, loop infinito, linear
- **Float do orb:** x:14px, y:-10px, 9s, yoyo, sine.inOut
- **Glow breathing:** scale 1.08, 7s, yoyo, sine.inOut
- **Morph orgânico (3 camadas):**
  - `span:nth-child(1)`: 5 estados de border-radius, 12s, loop
  - `span:nth-child(2)`: 5 estados (reversed), 15s, loop
  - `span:nth-child(3)`: 4 estados, 10s, yoyo, sine.inOut

### Interações
- **Cursor customizado:** ring + dot, segue rato com quickTo, expande no hover de interativos
- **Spotlight:** gradiente radial segue rato via CSS vars `--mx`, `--my`
- **Parallax orb:** CSS vars `--px`, `--py` controlam deslocamento do orb-glow
- **Magnetic button:** botão "Join waitlist" atrai-se ao rato (0.25x), retorna com elastic.out
- **Form submit:** shake animation no input, scale no botão, texto muda para "Subscribed ✓" por 2.5s

---

## Estilos CSS Principais

### Cores (CSS variables)
- `--bg: #03050a` (fundo quase preto)
- `--text: #f5f7ff`
- `--muted: #7b7f8b`
- `--accent: #0066ff` (azul)
- `--accent-2: #00e5ff` (ciano)
- `--border: rgba(255,255,255,0.06)`

### Orb
- 3 camadas com `mix-blend-mode: screen`
- Camada 1: gradiente radial ciano/azul, blur(6px), opacity 0.7
- Camada 2: gradiente radial azul, blur(10px), opacity 0.55
- Camada 3: border 1px ciano, gradiente radial azul, opacity 0.5
- Border-radius inicial: `60% 40% 35% 65% / 60% 35% 65% 40%` (forma orgânica)

### Waitlist form
- Input: 220px, glassmorphism (backdrop-filter: blur(10px)), border-radius 100px
- Botão: gradiente azul/ciano, border-radius 100px, hover brightness(1.15) + translateY(-1px)
- `pointer-events: auto` no form (hero-bottom não bloqueia)

### Side labels
- Fixed, right: 1.25rem, rotate(-90deg), gap: 2rem
- Sempre visíveis (sem opacity 0 no CSS nem GSAP)

### Responsive
- **≤900px:** orbital 480px, orb 400px, side-labels hidden, padding reduzido
- **≤640px:** orbital 340px, orb 290px, logo 28px, form em coluna, cursor hidden

---

## Estilos CSS não utilizados (legacy)
- `.build-canvas` — canvas para partículas (removido do HTML)
- `.progress-ring` + `::before` — anel de progresso (removido do HTML)
- `.hero-logo` — logo dentro da esfera (removido do HTML)
- `.status`, `.status-dot`, `.status-value`, `@keyframes pulse-dot` — status "Building" (removido do HTML)
- `.nav-cta`, `.nav-cta:hover` — botão CTA da navbar (não usado)

---

## Logo
- **Ficheiro:** `InheritChain_logo_v2.png`
- **Processado:** cortado padding preto (1999×786 → 1568×354)
- **Uso atual:** apenas no hero-bottom (50px height)
- **Mix-blend-mode:** screen (para fundo escuro)

---

## Pendentes / Possíveis melhorias
- Limpar CSS não utilizado (build-canvas, progress-ring, hero-logo, status, nav-cta)
- Header está vazio — considerar adicionar navegação ou remover
- Form submit é apenas visual (não envia para backend)
- Considerar font Inter via CDN (atualmente usa system-ui fallback)
- Adicionar meta tags SEO (description, og:image, etc.)
- Favicon não definido
