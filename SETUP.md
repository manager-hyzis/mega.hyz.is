# 🔧 Guia de Configuração - Mega da Virada 2026

## Pré-requisitos

- Node.js 18+
- PostgreSQL 12+
- pnpm (recomendado)

## Passo 1: Instalar Dependências

```bash
pnpm install
```

## Passo 2: Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env
# Banco de dados PostgreSQL
# Formato: postgresql://usuario:senha@host:porta/nome_banco
DATABASE_URL="postgresql://usuario:senha@localhost:5432/bolao_mega"

# Chave secreta para JWT (use uma string aleatória segura)
JWT_SECRET="sua_chave_secreta_super_segura_aqui_123456"

# URL pública da aplicação
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Variáveis Explicadas

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DATABASE_URL` | URL de conexão com PostgreSQL | `postgresql://postgres:password@localhost:5432/bolao_mega` |
| `JWT_SECRET` | Chave para assinar tokens JWT (mínimo 32 caracteres) | `chave_aleatoria_super_segura_123456789` |
| `NEXT_PUBLIC_APP_URL` | URL base da aplicação (usada para gerar links) | `http://localhost:3000` ou `https://seu-dominio.com` |

## Passo 3: Criar Banco de Dados PostgreSQL

### Opção A: PostgreSQL Local

```bash
# Criar banco de dados
createdb bolao_mega

# Ou via psql
psql -U postgres
CREATE DATABASE bolao_mega;
```

### Opção B: PostgreSQL em Docker

```bash
docker run --name postgres-bolao \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=bolao_mega \
  -p 5432:5432 \
  -d postgres:15
```

### Opção C: Serviços Cloud

- **Neon**: https://neon.tech (gratuito)
- **Supabase**: https://supabase.com (gratuito)
- **Railway**: https://railway.app (gratuito com créditos)
- **Render**: https://render.com (gratuito)

## Passo 4: Configurar Prisma

```bash
# Gerar Prisma Client
pnpm prisma generate

# Criar tabelas no banco (push schema)
pnpm prisma db push

# (Opcional) Abrir Prisma Studio para visualizar dados
pnpm prisma studio
```

## Passo 5: Executar Aplicação

```bash
# Desenvolvimento
pnpm dev

# Produção
pnpm build
pnpm start
```

Acesse [http://localhost:3000](http://localhost:3000) no navegador.

## 🔑 Gerando JWT_SECRET Seguro

### Opção 1: Node.js

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Opção 2: OpenSSL

```bash
openssl rand -hex 32
```

### Opção 3: Online (não recomendado para produção)

Use um gerador online como: https://www.uuidgenerator.net/

## 🗄️ Estrutura do Banco de Dados

O Prisma criará automaticamente as seguintes tabelas:

### usuarios
- `id` (UUID, chave primária)
- `nome` (String)
- `whatsapp` (String, único)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### boloes
- `id` (UUID, chave primária)
- `nome` (String)
- `descricao` (String, opcional)
- `ativo` (Boolean, padrão: true)
- `linkCompartilhamento` (String, único)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### jogos
- `id` (UUID, chave primária)
- `numeros` (Int[], array de 6 números)
- `reservado` (Boolean, padrão: false)
- `editado` (Boolean, padrão: false)
- `bolaoId` (FK para boloes)
- `usuarioId` (FK para usuarios, nullable)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

## 🚀 Deploy

### Vercel (Recomendado)

1. Faça push do código para GitHub
2. Conecte o repositório no Vercel
3. Configure variáveis de ambiente no painel
4. Deploy automático

### Railway

1. Conecte seu repositório GitHub
2. Crie um serviço PostgreSQL
3. Configure variáveis de ambiente
4. Deploy automático

### Render

1. Conecte seu repositório GitHub
2. Crie um banco PostgreSQL
3. Configure variáveis de ambiente
4. Deploy automático

## 🐛 Troubleshooting

### Erro: "Cannot find module '@prisma/client'"

```bash
pnpm prisma generate
```

### Erro: "Database connection failed"

- Verifique se PostgreSQL está rodando
- Confira a URL do DATABASE_URL
- Teste a conexão: `psql <DATABASE_URL>`

### Erro: "Relation 'public.usuarios' does not exist"

```bash
# Resetar banco (desenvolvimento apenas)
pnpm prisma migrate reset

# Ou fazer push novamente
pnpm prisma db push
```

### Porta 3000 já em uso

```bash
# Usar porta diferente
pnpm dev -- -p 3001
```

## 📝 Variáveis de Ambiente por Ambiente

### Desenvolvimento

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/bolao_mega"
JWT_SECRET="dev_secret_key_123456789"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Produção

```env
DATABASE_URL="postgresql://user:password@prod-db.example.com:5432/bolao_mega"
JWT_SECRET="<gerar com: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\">"
NEXT_PUBLIC_APP_URL="https://seu-dominio.com"
```

## ✅ Checklist de Setup

- [ ] Node.js 18+ instalado
- [ ] PostgreSQL instalado ou conta em serviço cloud
- [ ] Dependências instaladas (`pnpm install`)
- [ ] Arquivo `.env.local` criado com variáveis
- [ ] Banco de dados criado
- [ ] Prisma Client gerado (`pnpm prisma generate`)
- [ ] Tabelas criadas (`pnpm prisma db push`)
- [ ] Aplicação rodando (`pnpm dev`)
- [ ] Acesso em http://localhost:3000

## 🆘 Suporte

Para mais informações:
- [Documentação Next.js](https://nextjs.org/docs)
- [Documentação Prisma](https://www.prisma.io/docs)
- [Documentação PostgreSQL](https://www.postgresql.org/docs)
