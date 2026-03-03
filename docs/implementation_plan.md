# Arquitetura e Plano de Implementação: CoffeePix

## Resumo do Objetivo
Desenvolver o CoffeePix, um SaaS B2B Multi-tenant para gestão de máquinas de café (Jetinno JL22) com orquestração de pagamentos Pix direto para as contas dos pontos (clientes finais), garantindo isolamento de dados e hierarquia de três níveis (Dono do SaaS, Empresa Operadora, Cliente Final/Ponto).

## User Review Required
> [!IMPORTANT]
> Este é o projeto arquitetural completo. Por favor, revise as tabelas de banco de dados, o fluxo do Pix e a stack tecnológica escolhida (Node.js/NestJS + Next.js). Verifique se o isolamento financeiro atende perfeitamente à sua necessidade antes de passarmos para a execução de código.

---

## 1. Modelo de Dados (PostgreSQL)

O banco de dados deve refletir a hierarquia e garantir Row-Level Security (RLS) ou filtragem rígida na camada de acesso a dados (ORM Prisma/TypeORM).

### Tabelas Principais

- **`roles`**: `id`, `name` (SAAS_ADMIN, COMPANY_ADMIN, CLIENT_ADMIN)
- **`users`**: 
  - `id`, `email`, `password_hash`, `role_id`
  - `company_id` (FK para companies, Nullable para SaaS Admin)
  - `client_id` (FK para clients, Nullable para SaaS e Company Admins)
- **`companies`** (Empresas Operadoras):
  - `id`, `name`, `cnpj`, `status`, `created_at`
- **`clients`** (Pontos / Locais):
  - `id`, `name`, `company_id` (FK) -> Uma empresa tem vários pontos.
- **`machines`**:
  - `id`, `serial_number`, `model` (default: 'JL22'), `status` (ONLINE/OFFLINE), `hmac_secret` (para auth da máquina)
  - `company_id` (FK)
  - `client_id` (FK) -> A qual ponto pertence.
- **`products`**:
  - `id`, `name`, `price`, `company_id` (FK) -> Catálogo da empresa, não do ponto.
- **`payment_configs`** (Configurações Pix do Ponto):
  - `id`, `client_id` (FK Unique!), `gateway_provider` (ex: MercadoPago, Asaas, etc), `encrypted_credentials` (AES-256-GCM), `pix_key`
- **`transactions`**:
  - `id`, `machine_id` (FK), `client_id` (FK), `company_id` (FK), `product_id` (FK)
  - `amount`, `status` (PENDING, SUCCESS, FAILED, TIMEOUT), `provider_tx_reference`
  - `created_at`, `updated_at`
- **`audit_logs`**:
  - `id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `created_at`

---

## 2. Arquitetura e Fluxo de Pagamentos Pix (Orquestração)

**Stack Backend**: Node.js + NestJS, PostgreSQL, Redis (para caching, rate limit e pub/sub de status). 
**Testes Backend**: Swagger (OpenAPI) para documentação interativa e testes manuais dos endpoints.
**Internacionalização (i18n)**: Módulo `nestjs-i18n` para suporte a múltiplos idiomas em mensagens de erro e respostas da API.

### Fluxo de Pagamento na Máquina JL22:
1. **Início**: Cliente seleciona o café na JL22.
2. **Requisição**: JL22 envia HTTP POST para `api.coffeepix.com/v1/payments/request` com `machine_id`, `product_id` e uma assinatura HMAC (usando o `hmac_secret` da máquina).
3. **Identificação e Roteamento (CoffeePix)**:
   - Backend valida o HMAC.
   - Busca no banco o `client_id` vinculado ao `machine_id`.
   - Busca a `payment_configs` do `client_id` e descriptografa as credenciais em memória.
4. **Chamada Gateway**: CoffeePix chama a API do Gateway Pix (Mercado Pago, etc) usando as credenciais do Cliente Final.
5. **Retorno à Máquina**: O Gateway retorna o Payload (Copia e Cola) / QR Code. CoffeePix repassa à JL22. Status da transação no banco: `PENDING`.
6. **Polling (Timeout 90s)**:
   - A máquina faz requisições (Polling) a cada 2s para `api.coffeepix.com/v1/payments/:id/status`.
   - O CoffeePix consulta um cache rápido no Redis ou seu próprio banco.
7. **Webhook Gateway**:
   - Assim que o cliente paga, o Gateway chama o Webhook do CoffeePix.
   - CoffeePix atualiza a Transação para `SUCCESS` e salva no Redis.
8. **Finalização**:
   - No próximo polling de 2s, a máquina recebe `SUCCESS` e libera o café.

---

## 3. Estruturação Frontend (Next.js)

O Dashboard será construído em React com Next.js (App Router). Terá rotas dinâmicas que renderizam layouts diferentes baseados na `role` do usuário (via JWT).

- **`/admin`** (SAAS_ADMIN): Visão Global (Empresas ativas, listagem geral, auditoria).
- **`/company`** (COMPANY_ADMIN): Visão da Empresa (Gestão de máquinas, clientes/pontos, catálogo, relatórios de vendas da empresa).
- **`/client`** (CLIENT_ADMIN): Visão do Ponto (Suas máquinas, extrato apenas de suas transações, formulário para configurar credencial Pix).

*Visual e UI*: **Shadcn UI** integrado com Tailwind CSS. Garante componentes modernos, responsivos, acessíveis e com suporte nativo a temas (Light Mode / Dark Mode).
*Internacionalização (i18n)*: **`next-intl`** para prover suporte multi-idioma nas interfaces do Dashboard.
*Autenticação*: JWT em cookies HTTP-Only ou LocalStorage (dependendo da preferência de SSR vs SPA).

---

## 4. Plano de Execução (90 Dias)

- **Mês 1: Fundação e Core Backend**
  - Setup do repositório (NestJS + Prisma/TypeORM, Next.js).
  - Modelagem do banco e migrações.
  - Implementação do Auth (JWT) e RBAC/ABAC multi-tenant.
  - CRUDs básicos: Empresas, Clientes, Máquinas, Produtos.
- **Mês 2: Orquestração de Pagamentos e Integração**
  - Implementação da tabela de Configurações Pix com criptografia (AES-256).
  - Integração com pelo menos 1 gateway Pix (Open API / Mercado Pago).
  - Desenvolvimento dos endpoints de API da máquina JL22 (Request, HMAC auth, Polling).
  - Setup do Redis e tratamento de Webhooks e Timeouts (90s).
- **Mês 3: Frontend, Dashboards e Produção**
  - Construção das interfaces separadas por Nível.
  - Visualização de faturamento e gráficos.
  - Testes de concorrência e carga.
  - Infraestrutura (AWS/GCP, Docker, CI/CD).
  - Homologação final e ajustes de UX.

---

## 5. Checklist de Produção (Security & Scale)
- [ ] Conexão HTTPs obrigatória (TLS 1.2+).
- [ ] Senhas com hashing bcrypt/argon2.
- [ ] Credenciais Pix de clientes (`payment_configs`) criptografadas no banco (AES-256-GCM) com rotação de chaves.
- [ ] Validação HMAC rigorosa nas APIs expostas às máquinas.
- [ ] Rate limit por IP e por `machine_id` (Redis) para evitar ataques de DDoS em geração de Pix.
- [ ] Idempotência implementada para criações e webhooks de pagamento.
- [ ] Transações gravadas com status claro e auditoria (`audit_logs`) em ações críticas (edições, deleções, mudanças de chaves).
- [ ] Banco configurado para backups diários Point-in-Time Recovery.
