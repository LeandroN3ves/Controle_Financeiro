# 💰 Projeto: Controle Financeiro Familiar

> Este documento serve como guia completo de instruções para o desenvolvimento do projeto. Leia tudo antes de escrever qualquer linha de código.

---

## 🎯 Objetivo

Desenvolver um site de controle financeiro pessoal e familiar, com visual dark mode, gráficos interativos, autenticação por usuário e banco de dados em nuvem. Cada membro da família terá sua própria conta e visualizará apenas os seus próprios dados.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia | Observação |
|---|---|---|
| Frontend | HTML + CSS + JavaScript | Sem frameworks obrigatórios |
| Gráficos | Chart.js | CDN, sem instalação |
| Banco de dados | Supabase | Gratuito, real-time, auth integrado |
| Hospedagem | Vercel ou Netlify | Deploy gratuito via GitHub |

---

## 🎨 Design

- Tema: **Dark mode** — fundo escuro, tipografia clara, acentos em verde ou roxo
- Layout responsivo — deve funcionar bem em **desktop e celular**
- Estilo moderno e clean, inspirado em dashboards financeiros
- Evitar poluição visual — priorizar espaçamento e hierarquia clara

---

## 🔐 Autenticação

- Usar o sistema de autenticação nativo do **Supabase Auth**
- Fluxo: cadastro com e-mail e senha → login → sessão persistente
- Cada usuário só acessa e manipula **seus próprios dados**
- Redirecionar para login se não houver sessão ativa

---

## 📄 Páginas e Funcionalidades

### 1. Tela de Login / Cadastro
- Formulário de e-mail e senha
- Botão alternar entre "Entrar" e "Criar conta"
- Mensagens de erro amigáveis (ex: senha incorreta, e-mail já cadastrado)

---

### 2. Dashboard (Página Principal)

#### Cards de Resumo (topo da página)
Exibir 5 cards com os seguintes valores calculados dinamicamente:

| Card | Descrição |
|---|---|
| 💸 Total de Gastos | Soma de todos os gastos do mês atual |
| ✅ Total Pago | Soma dos gastos marcados como pagos |
| ⏳ Falta Pagar | Total de Gastos − Total Pago |
| 🏦 Saldo Atual | Valor informado manualmente pelo usuário |
| 💚 Sobra | Saldo Atual − Total de Gastos |

- O **Saldo Atual** deve ter um campo editável diretamente no dashboard para o usuário atualizar quando quiser
- A **Sobra** deve mudar de cor: verde se positivo, vermelho se negativo

---

#### Tabela de Gastos
Colunas: `Nome` · `Valor` · `Vencimento` · `Tipo` · `Parcelas` · `Status` · `Ações`

- **Tipo**: Fixo ou Parcelado
- **Parcelas**: exibir "−" para fixos; "X/Y" para parcelados (ex: 2/6)
- **Status**: badge visual — 🟡 Pendente / 🟢 Pago
- **Ações**: botão "Marcar como pago", botão "Editar", botão "Excluir"
- Ordenação padrão: por data de vencimento (mais próximo primeiro)
- Linha vencida e não paga deve ter destaque visual (ex: borda vermelha)

---

#### Seção de Gráficos (abaixo da tabela)
Três gráficos usando **Chart.js**, todos estilizados para dark mode:

1. **Gráfico de Rosca** — Proporção entre Pago e A Pagar no mês atual
2. **Gráfico de Barras** — Total de gastos por mês (últimos 6 meses)
3. **Gráfico de Linha** — Evolução do saldo disponível ao longo dos meses

---

### 3. Modal / Tela de Adicionar ou Editar Gasto
Campos obrigatórios:
- Nome do gasto (texto livre)
- Valor (numérico, aceitar centavos)
- Data de vencimento (date picker)
- Tipo: `Fixo` ou `Parcelado`
- Se **Parcelado**: exibir campo extra com número total de parcelas e parcela atual
- Status inicial: sempre começa como **Pendente**

---

## 🗄️ Estrutura do Banco de Dados (Supabase)

### Tabela: `profiles`
```sql
id          uuid  PRIMARY KEY REFERENCES auth.users
nome        text
created_at  timestamp
```

### Tabela: `gastos`
```sql
id            uuid      PRIMARY KEY DEFAULT gen_random_uuid()
usuario_id    uuid      REFERENCES profiles(id)
nome          text      NOT NULL
valor         numeric   NOT NULL
vencimento    date      NOT NULL
tipo          text      CHECK (tipo IN ('fixo', 'parcelado'))
parcela_atual int       DEFAULT NULL
total_parcelas int      DEFAULT NULL
pago          boolean   DEFAULT false
mes_ref       text      NOT NULL  -- formato: 'YYYY-MM'
created_at    timestamp DEFAULT now()
```

### Tabela: `saldo`
```sql
id               uuid     PRIMARY KEY DEFAULT gen_random_uuid()
usuario_id       uuid     REFERENCES profiles(id)
valor_disponivel numeric  NOT NULL
mes_ref          text     NOT NULL  -- formato: 'YYYY-MM'
updated_at       timestamp DEFAULT now()
```

> ⚠️ Habilitar **Row Level Security (RLS)** em todas as tabelas. Cada usuário só pode SELECT/INSERT/UPDATE/DELETE nos próprios registros.

---

## 🔒 Regras de Segurança (RLS — Supabase)

Para cada tabela, criar policies como:

```sql
-- Exemplo para a tabela gastos
CREATE POLICY "usuarios acessam apenas seus gastos"
ON gastos
FOR ALL
USING (auth.uid() = usuario_id);
```

Aplicar o mesmo padrão para `saldo` e `profiles`.

---

## 📁 Estrutura de Arquivos Sugerida

```
/
├── index.html          → Tela de login/cadastro
├── dashboard.html      → Página principal (protegida)
├── css/
│   └── style.css       → Estilos globais dark mode
├── js/
│   ├── auth.js         → Login, cadastro, logout, proteção de rota
│   ├── dashboard.js    → Lógica dos cards, tabela e saldo
│   ├── graficos.js     → Inicialização e atualização dos gráficos
│   └── gastos.js       → CRUD de gastos (criar, editar, excluir, pagar)
└── supabase/
    └── client.js       → Inicialização do cliente Supabase
```

---

## 🚀 Ordem de Desenvolvimento Recomendada

1. Criar projeto no Supabase e configurar as tabelas com RLS
2. Configurar as variáveis de ambiente (`SUPABASE_URL` e `SUPABASE_ANON_KEY`)
3. Construir tela de login/cadastro com Supabase Auth
4. Proteger o dashboard — redirecionar se não logado
5. Implementar CRUD completo de gastos
6. Implementar lógica dos 5 cards de resumo
7. Implementar campo editável de saldo atual
8. Integrar os 3 gráficos com Chart.js
9. Aplicar design dark mode completo e responsividade
10. Publicar no Vercel conectando ao repositório GitHub

---

## ✅ Checklist Final antes do Deploy

- [ ] RLS ativo em todas as tabelas do Supabase
- [ ] Nenhuma chave secreta exposta no código frontend (usar apenas `anon key`)
- [ ] Funcionando em mobile (testar no Chrome DevTools)
- [ ] Gráficos renderizando corretamente com dados reais
- [ ] Card "Sobra" muda de cor conforme positivo/negativo
- [ ] Gastos vencidos e não pagos com destaque visual
- [ ] Logout funcionando e redirecionando para login

---

*Documento gerado como guia de instruções para desenvolvimento assistido por IA.*
