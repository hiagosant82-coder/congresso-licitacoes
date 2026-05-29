# 🧠 MARKETING COPILOT — FUNCTIONS (GENERIC v3)

## 🎯 OBJETIVO
Sistema de funções para gerar campanhas de alta conversão em qualquer nicho,
com foco em WhatsApp e performance.

---

# ⚙️ MODO DE USO

Sempre chamar funções com:

- nicho
- público
- oferta (se houver)
- objetivo

---

# 🧩 FUNÇÕES PRINCIPAIS

---

## 🧲 1. CREATE_OFFER

### Uso:
create_offer(nicho, publico, ticket, objetivo)

### Prompt:
Você é um especialista em marketing direto focado em conversão.

Crie uma oferta irresistível para:
- Nicho: {{nicho}}
- Público: {{publico}}
- Ticket: {{ticket}}
- Objetivo: {{objetivo}}

Regras:
- Clareza > criatividade
- Valor percebido alto
- Sem enrolação
- Foco em ação imediata

Saída obrigatória:
- Headline
- Subheadline
- Oferta
- Benefícios (3-5)
- CTA forte
- Versão agressiva

---

## 🎨 2. GENERATE_AD

### Uso:
generate_ad(nicho, publico, oferta)

### Prompt:
Crie um anúncio para Meta Ads com foco em conversão.

Contexto:
- Nicho: {{nicho}}
- Público: {{publico}}
- Oferta: {{oferta}}

Regras:
- Visual simples
- Pouco texto
- Impacto imediato
- Nada de poluição

Saída:
- Ideia visual (descrição clara)
- Texto da imagem (curto)
- Copy principal
- Headline
- CTA

---

## 🧠 3. GENERATE_COPY

### Uso:
generate_copy(oferta, publico)

### Prompt:
Crie uma copy de alta conversão para WhatsApp.

Contexto:
- Oferta: {{oferta}}
- Público: {{publico}}

Estrutura:
1. Gancho forte
2. Problema
3. Solução
4. Prova
5. CTA

Regras:
- Direto
- Persuasivo
- Sem linguagem técnica
- Foco em ação

---

## 📊 4. BUILD_CAMPAIGN

### Uso:
build_campaign(nicho, objetivo, publico, oferta)

### Prompt:
Monte uma campanha completa de Meta Ads.

Contexto:
- Nicho: {{nicho}}
- Objetivo: {{objetivo}}
- Público: {{publico}}
- Oferta: {{oferta}}

Saída:
- Tipo de campanha
- Estrutura (CBO ou ABO)
- Público (detalhado)
- Criativos sugeridos
- Orçamento inicial
- Métrica principal
- Expectativa de resultado

---

## ⚙️ 5. SETUP_TRACKING

### Uso:
setup_tracking(tipo_funnel)

### Prompt:
Crie um plano de tracking para campanhas com foco em WhatsApp.

Contexto:
- Tipo de funil: {{tipo_funnel}}

Saída:
- Evento principal
- Configuração GTM
- Evento Meta
- Nome padrão de eventos
- Validação

---

## 💰 6. OPTIMIZE_CAMPAIGN

### Uso:
optimize_campaign(metricas)

### Prompt:
Analise e otimize uma campanha.

Dados:
{{metricas}}

Regras:
- Foco em ação
- Sem teoria
- Decisões claras

Saída:
- Diagnóstico
- Problema principal
- Ação imediata
- Próximo teste

---

## 🚀 7. SCALE_CAMPAIGN

### Uso:
scale_campaign(dados)

### Prompt:
Defina estratégia de escala.

Contexto:
{{dados}}

Saída:
- Quando escalar
- Como escalar
- O que duplicar
- O que testar
- Riscos

---

## 🤖 8. AUTOMATION_FLOW

### Uso:
automation_flow(nicho, objetivo)

### Prompt:
Crie um fluxo de automação para leads via WhatsApp.

Contexto:
- Nicho: {{nicho}}
- Objetivo: {{objetivo}}

Saída:
- Fluxo completo
- Gatilhos
- Mensagens
- Ferramentas sugeridas
- Execução prática

---

# 🔁 FLUXO IDEAL DE USO

1. create_offer()
2. generate_ad()
3. generate_copy()
4. build_campaign()
5. setup_tracking()
6. rodar campanha
7. optimize_campaign()
8. scale_campaign()

---

# ⚠️ REGRAS DO SISTEMA

- Sempre priorizar conversão
- Sempre pensar em escala
- Sempre simplificar
- Nunca complicar com teoria

---

# 🧠 FILOSOFIA

"Campanha boa é campanha rodando e vendendo, não campanha perfeita."

---

# 🔚
Pronto para uso imediato em qualquer nicho.