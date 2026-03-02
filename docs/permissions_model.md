# CoffeePix - Arquitetura e Modelo de Permissões

## 1. Modelo de Tenancy (Hierarquia e Isolamento)

O CoffeePix utiliza uma arquitetura **Multi-tenant com Sub-tenants**. O isolamento de dados é garantido em nível de banco de dados (Row-Level Security no PostgreSQL ou filtragem estrita via ORM baseada no contexto do usuário autenticado).

### Níveis Hierárquicos

1. **Nível 0: SaaS Owner (CoffeePix Admin)**
   - **Contexto**: Acesso global (Superadmin).
   - **Visibilidade**: Todas as `companies`, todas as `machines`, `clients` e volume total. 
   - **Isolamento**: Não possui tenant_id associado, mas as queries administrativas acessam tudo.

2. **Nível 1: Empresa Operadora (Tenant)**
   - **Contexto**: `tenant_id` (ID da Company).
   - **Visibilidade**: Apenas dados vinculados ao seu `company_id`.
   - **Isolamento**: Toda máquina, produto e cliente (ponto) pertence a um `company_id`. As listagens e relatórios são filtrados estritamente por essa chave. Não tem acesso a `payment_configs` dos clientes.

3. **Nível 2: Cliente Final / Ponto (Sub-tenant)**
   - **Contexto**: `client_id` + `tenant_id`.
   - **Visibilidade**: Apenas dados vinculados ao seu `client_id`.
   - **Isolamento**: Suas próprias máquinas, vendas e, **exclusivamente**, suas credenciais Pix (`payment_configs`).

---

## 2. Matriz de Permissões (RBAC / ABAC)

A autorização será baseada no token JWT, que deve conter:
- `sub`: user_id
- `role`: `SAAS_ADMIN` | `COMPANY_ADMIN` | `CLIENT_ADMIN`
- `company_id`: UUID (nulo para SAAS_ADMIN)
- `client_id`: UUID (nulo para SAAS_ADMIN e COMPANY_ADMIN)

| Recurso / Entidade | Nível 0 (SaaS Owner) | Nível 1 (Empresa) | Nível 2 (Ponto / Cliente) |
| :--- | :--- | :--- | :--- |
| **Empresas (Companies)** | Criar, Editar, Bloquear, Ver Tudo | Ver própria, Editar própria | Invisível |
| **Clientes (Clients)** | Ver Todos, Bloquear | Criar, Editar, Bloquear (do seu tenant) | Ver/Editar próprio |
| **Máquinas (Machines)** | Ver Todas | Criar, Vincular ao Ponto, Ver (do seu tenant) | Ver status, Vendas (do seu client_id) |
| **Catálogo/Preços (Products)** | Ver Todos | Criar e Editar (do seu tenant) | Apenas Leitura (do seu client_id) |
| **Vendas (Transactions)** | Ver Todas (Consolidado) | Ver agregadas e por máquina (do seu tenant) | Ver detalhadas (do seu client_id) |
| **Credenciais Pix** | 🚫 Acesso Negado | 🚫 Acesso Negado | Criar, Editar, Ver (do seu client_id) |
| **Auditoria Global** | Acesso Total | Acesso restrito ao tenant | Invisível |

*Nota: As "Credenciais Pix" adotam controle de acesso explícito onde somente um usuário com role=CLIENT_ADMIN e um client_id válido correspondente pode realizar leitura/escrita.*

---

## 3. Isolamento e Segurança Financeira

- **Criptografia em Repouso**: As credenciais Pix configuradas pelo Ponto (Client) são criptografadas no banco (ex: AES-256-GCM com chave gerenciada por KMS) e descriptografadas apenas em memória, no momento de chamar o gateway.
- **Orquestração Blindada**: A Empresa Operadora cria a máquina, mas o pagamento é gerido atrelado ao `client_id` da máquina. O processo de pagamento busca as chaves criptografadas via `client_id` sem expor o conteúdo à API de administração.
- **Prevenção de Ataques (IDOR)**: Toda requisição à API (ex: `GET /machines/:id`) exige validação que garanta que a `Machine` pertence ao `company_id` (e `client_id`, se aplicável) extraído token do usuário que faz a requisição.
