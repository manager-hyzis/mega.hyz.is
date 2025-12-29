# Mega da Virada 2026 - Sistema de Bolão Colaborativo

Um sistema completo de bolão colaborativo para a Mega da Virada 2026 com autenticação por whatsapp, geração inteligente de números baseada em numerologia e análise histórica.

## Funcionalidades

- Criar bolões com quantidade customizável de jogos
- Autenticação por whatsapp (sem senha)
- Geração inteligente de números (numerologia 2026 + análise de 16 anos)
- Reserva de jogos por participante
- Edição de números dos jogos reservados
- Compartilhamento via link único
- Interface responsiva e moderna
- Banco de dados PostgreSQL com Prisma ORM

## Instalação

### Pré-requisitos

- Node.js 18+
- PostgreSQL 12+
- pnpm (recomendado)

### Passo 1: Instalar Dependências

```bash
pnpm install
```

### Passo 2: Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Banco de dados PostgreSQL
DATABASE_URL="postgresql://usuario:senha@localhost:5432/bolao_mega"

# JWT Secret para autenticação
JWT_SECRET="sua_chave_secreta_super_segura_aqui_123456"

# URL da aplicação
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Passo 3: Configurar Banco de Dados

```bash
# Gerar Prisma Client
pnpm prisma generate

# Criar tabelas no banco
pnpm prisma db push
```

### Passo 4: Executar Aplicação

```bash
pnpm dev
```

Acesse [http://localhost:3000](http://localhost:3000) no navegador.

## Como Usar

### Criar um Bolão

1. Acesse a página inicial
2. Preencha o nome, descrição e quantidade de jogos
3. Clique em "Criar Bolão"
4. Você será redirecionado para o bolão criado

### Compartilhar Bolão

1. Clique no botão "Compartilhar"
2. O link será copiado ou compartilhado via WhatsApp
3. Envie para seus amigos

### Participar do Bolão

1. Clique no link do bolão
2. Preencha seu nome e whatsapp
3. Escolha um jogo disponível
4. (Opcional) Edite os números do seu jogo

## Estrutura do Projeto

```
mega.hyz.is/
├── app/
│   ├── api/
│   │   ├── auth/route.ts          # Autenticação por whatsapp
│   │   ├── bolao/route.ts         # CRUD de bolões
│   │   └── jogos/route.ts         # Gerenciamento de jogos
│   ├── bolao/[id]/page.tsx        # Página do bolão
│   ├── page.tsx                   # Página inicial
│   ├── layout.tsx                 # Layout raiz
│   └── globals.css                # Estilos globais
├── lib/
│   ├── prisma.ts                  # Cliente Prisma
│   └── gerador.ts                 # Gerador de números inteligente
├── prisma/
│   └── schema.prisma              # Schema do banco de dados
├── package.json
└── tsconfig.json
```

## Autenticação

O sistema usa autenticação baseada em whatsapp com JWT:

- Usuários se registram com nome e whatsapp
- Um token JWT é gerado e armazenado no localStorage
- Tokens expiram em 7 dias
- Não há senha, apenas whatsapp como identificador único

## Algoritmo de Geração

Os números são gerados considerando:

1. **Numerologia 2026**: 2+0+2+6 = 10 → 1+0 = 1
   - Números que reduzem para 1: [1, 10, 19, 28, 37, 46, 55]
   - 2-3 desses números por jogo

2. **Frequência Histórica**: Análise de 16 anos (2009-2024)
   - Números mais sorteados têm maior probabilidade

3. **Distribuição por Dezenas**: Equilibra números em 6 faixas
   - 1-10, 11-20, 21-30, 31-40, 41-50, 51-60

4. **Padrão de Pares/Ímpares**: Distribuição balanceada

## Banco de Dados

### Tabelas

**usuarios**
- id (UUID)
- nome (String)
- whatsapp (String, único)
- createdAt, updatedAt

**boloes**
- id (UUID)
- nome (String)
- descricao (String)
- ativo (Boolean)
- linkCompartilhamento (String, único)
- createdAt, updatedAt

**jogos**
- id (UUID)
- numeros (Int[])
- reservado (Boolean)
- editado (Boolean)
- bolaoId (FK)
- usuarioId (FK, nullable)
- createdAt, updatedAt

## Desenvolvimento

### Comandos Úteis

```bash
# Executar em desenvolvimento
pnpm dev

# Build para produção
pnpm build

# Iniciar servidor de produção
pnpm start

# Gerar Prisma Client
pnpm prisma generate

# Abrir Prisma Studio (visualizar dados)
pnpm prisma studio

# Resetar banco de dados (desenvolvimento)
pnpm prisma migrate reset
```

### Variáveis de Ambiente

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| DATABASE_URL | URL de conexão PostgreSQL | postgresql://user:pass@localhost:5432/db |
| JWT_SECRET | Chave secreta para JWT | chave_super_secreta_123 |
| NEXT_PUBLIC_APP_URL | URL pública da aplicação | http://localhost:3000 |

## Deploy

### Vercel (Recomendado)

1. Faça push do código para GitHub
2. Conecte o repositório no Vercel
3. Configure variáveis de ambiente
4. Deploy automático

### Outras Plataformas

- Railway
- Render
- Heroku
- DigitalOcean

## Avisos Importantes

- Este é um sistema para fins de entretenimento
- Jogue com responsabilidade
- Não há garantias de ganho
- Dados são armazenados apenas para gerenciar o bolão

## Licença

MIT

## Contribuições

Contribuições são bem-vindas! Abra uma issue ou pull request.
