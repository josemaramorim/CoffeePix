# Guia rápido de Deploy (produção econômica)

Objetivo: publicar a API do CoffeePix em produção com custo baixo, usando um host PaaS simples (Render ou Cloud Run) e seus serviços de Postgres e Redis já existentes.

Resumo da abordagem recomendada (barata e prática)
- Hospedagem da API: Render (autodeploy via GitHub) ou Cloud Run (GCP) — ambos têm planos gratuitos/pequenos e exigem pouca operação.
- Banco de dados: seu Postgres já existente (fornecer `DATABASE_URL`).
- Cache/Lock/Redis: seu Redis já existente (fornecer `REDIS_URL`).
- Build: Docker (recomendado) ou build via Node no serviço PaaS.
- Migrations: `prisma migrate deploy` executado como step de release/build.

Pré-requisitos
- Conta no Render (ou GCP) com acesso para criar serviços.
- Acesso ao repositório GitHub do projeto.
- Variáveis de ambiente sensíveis (JWT secret, DATABASE_URL, REDIS_URL, etc.).

1) Preparar Dockerfile (exemplo compacto)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json pnpm-lock.yaml ./
RUN npm ci --production=false
COPY . .
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./package.json
EXPOSE 3001
CMD ["node", "dist/main.js"]
```

Observações: ajuste conforme seu processo (pnpm/yarn/npm, paths). Port default: `3001`.

2) Variáveis de ambiente essenciais
- `DATABASE_URL` → sua URL Postgres (ex: `postgresql://user:pass@host:5432/dbname?schema=public`)
- `REDIS_URL` → sua URL Redis (ex: `redis://:password@host:6379`)
- `JWT_SECRET` → segredo para tokens JWT
- `NODE_ENV=production`
- `PORT=3001`
- Outros: `SMTP_*`, `SENTRY_DSN`, `SOME_API_KEYS` conforme necessário

3) Migrations (Prisma)
- Antes do deploy inicial, execute localmente ou em job CI:

```bash
# gerar migration localmente (apenas se houver mudanças de schema)
npx prisma migrate dev --name <nome>

# no deploy/production, executar:
npx prisma migrate deploy
```

Recomendação: adicionar `prisma migrate deploy` como comando de release/start do serviço para garantir esquema atualizado antes da API aceitar tráfego.

4) Deploy no Render (fluxo rápido)
- Criar novo `Web Service` no Render
  - Environment: `Docker` (ou `Node` se preferir)
  - Conectar repositório GitHub e branch (ex: `main`)
  - Configurar `Build Command`: (se Docker, Render fará build da imagem com Dockerfile)
  - Configurar `Start Command`: `node dist/main.js` (ou `npm run start:prod`)
  - Definir `PORT` em Environment; Render injeta variável `PORT` automaticamente.
  - Definir Environment Variables no painel: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, etc.
  - Em *Advanced*, configurar `Health check` para `http://$PORT/health` (implemente endpoint `/health` que retorna 200).
- Release command (opcional): `npx prisma migrate deploy --preview-feature` ou apenas `npx prisma migrate deploy` (garanta que `NODE_ENV=production` esteja configurado).

4.1) Deploy na Railway (alternativa rápida e conveniente)
- Railway é uma ótima opção para deploy rápido de APIs Node.js: integra com GitHub, oferece addons para Postgres/Redis e tem um painel simples para configurar variáveis de ambiente.
- Fluxo rápido:
  - Crie um projeto na Railway e conecte o repositório GitHub.
  - Escolha `Deploy from GitHub` (branch principal) ou configure manualmente com Dockerfile.
  - Em `Variables`, adicione `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `PORT=3001` e outras variáveis.
  - Para executar migrations automaticamente, você pode adicionar um "Release Command" no Railway: `npx prisma migrate deploy` ou criar um `one-off` job que execute esse comando antes de promover a versão.
  - Railway também tem *Deploy Hooks* e *Jobs* para tarefas manuais (execução de migrations, seeds, etc.).

Prós da Railway:
- Deploy muito rápido e interface simples.
- Possibilidade de adicionar Postgres/Redis via addons (útil se você preferir gerenciar tudo na Railway).
- Bom para protótipos e projetos com operação enxuta.

Contras:
- Para produção de alto tráfego, atenção ao plano e limites de conexões ao Postgres; pode ser necessário ajustar pool ou usar réplicas/um plano maior.


5) Deploy no Cloud Run (alternativa barata)
- Build image e push para Google Container Registry / Artifact Registry (via GitHub Actions). Exemplo resumido:

```bash
# build local
docker build -t gcr.io/$PROJECT_ID/coffeepix:$TAG .
docker push gcr.io/$PROJECT_ID/coffeepix:$TAG
# deploy
gcloud run deploy coffeepix --image gcr.io/$PROJECT_ID/coffeepix:$TAG --region us-central1 --platform managed --set-env-vars DATABASE_URL=...
```

6) GitHub Actions (exemplo simples)

Crie `.github/workflows/ci-cd.yml` com os passos: test, build, push image (opcional), deploy (opcional). Exemplo para deploy no Render via GitHub (Render pode autodeploy do repo):

```yaml
name: CI
on:
  push:
    branches: [ main ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Use Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install
        run: npm ci
      - name: Test
        run: npm test --silent
      - name: Build
        run: npm run build

# (opcional) deploy automático: Render/Cloud Run fazem deploy direto do repo/image
```

7) Health checks, readiness e graceful shutdown
- Implemente `/health` e `/ready` endpoints que retornem 200 quando a app estiver pronta. Configure o serviço PaaS para checar essas rotas.
- Configure process signal handlers (SIGTERM) para fechar conexões e liberar recursos.

8) Logs, métricas e erros
- Use provider de logs do host (Render/Cloud Run) para coletar stdout/stderr. Integre Sentry para erros e Prometheus/Grafana (ou DataDog) para métricas, quando estiver escalando.

9) Backups e DR
- Seu Postgres deve ter backups automáticos (habilite snapshot/point-in-time se possível).
- Teste restore periodicamente em ambiente de staging.

10) Segurança prática e custo-controlado
- Não exponha endpoints administrativos publicamente — use VPN ou IP whitelisting. Os endpoints `/public/*` que criamos são úteis para debug, mas devem ser desabilitados em produção ou protegidos por IP/feature flag.
- Armazene segredos em Secrets (Render Environment Secrets ou Secret Manager). Nunca commite `DATABASE_URL` no repo.
- Ative rate-limiting (Cloudflare ou o próprio PaaS) para proteção contra abuso.

Posso usar o Vercel?
- Sim, mas com ressalvas: o Vercel é ideal para frontend Next.js (o `dashboard`) e serverless functions. Para a API NestJS completa, o Vercel não é a opção mais direta — você precisaria adaptar a API para serverless handlers ou usar um container (Vercel agora suporta Deploy via Docker em algumas ofertas, mas é menos comum).
- Recomendação prática: implante a **API** no Railway / Render / Cloud Run (container ou serviço Node), e implante o **dashboard** no Vercel — essa é a combinação mais simples e econômica.

Resumo de recomendações rápidas
- API (NestJS): Railway (rápido), Render (estável) ou Cloud Run (escalável).
- Frontend (Next.js dashboard): Vercel (ótimo suporte e deploys instantâneos).

--

Se você confirmou que vai usar **Railway** para a API e **Vercel** para o dashboard, eu gero um `README-deploy.md` com passo-a-passo copy/paste (GitHub Actions pronto, comandos para migrations e variáveis a configurar). Quer que eu gere esse README agora?

11) Rollback e runbook simples
- Mudar para a tag/commit anterior no painel do Render ou no Cloud Run com `gcloud run deploy --image <previous>`.
- Se a migração falhar: primeiro rodar rollback do banco (se aplicável) ou restaurar do snapshot e reverter a imagem.

Checklist de pós-deploy
- [ ] `prisma migrate deploy` executado com sucesso
- [ ] Health check returns 200
- [ ] Logs sem erros críticos
- [ ] Endpoints de pagamento testados (request, status, webhook)
- [ ] Backups automáticos habilitados para Postgres

--

Se você confirmar que quer seguir com **Render + sua Postgres + seu Redis**, eu crio um `docs/deploy_production.md` passo-a-passo ainda mais detalhado com exemplos prontos para copiar/colar (Terraform não incluído, apenas comandos e workflows GitHub Actions). 

Diga `ok` para que eu gere a versão completa (com mais exemplos de workflow e comandos), ou `ajuste` e diga o que quer mudar.
