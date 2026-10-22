# App Nutri — Lica Muniz Nutri

Sistema completo de gestão de pacientes, consultas nutricionais, evolução corporal e planos alimentares.

## 🚀 Tecnologias

- **React 19** + **TypeScript**
- **Vite**
- **Tailwind CSS v4** + **Lucide React**
- **Neon Database (PostgreSQL Serverless)** + **Neon Auth**

---

## 🔒 Segurança & Variáveis de Ambiente

Por segurança, **o arquivo `.env` NUNCA é enviado para o GitHub**. 
O repositório inclui um arquivo [`.env.example`](.env.example) como modelo de referência.

### Variáveis necessárias:
| Variável | Descrição |
|---|---|
| `VITE_NEON_AUTH_URL` | URL do endpoint Neon Auth |
| `VITE_NEON_DATABASE_URL` | String de conexão segura do banco Neon (PostgreSQL) |

---

## 💻 Como Rodar Localmente

1. Clone o repositório:
```bash
git clone https://github.com/liliancmz2217leandro/appnutri-lica-muniz-nutri.git
cd appnutri-lica-muniz-nutri
```

2. Instale as dependências:
```bash
npm install
```

3. Crie o arquivo `.env` na raiz do projeto baseado no `.env.example`:
```env
VITE_NEON_AUTH_URL=https://ep-autumn-tooth-b5ol4ngl.neonauth.c-7.us-east-2.aws.neon.tech/neondb/auth
VITE_NEON_DATABASE_URL=postgresql://neondb_owner:SUA_SENHA@ep-autumn-tooth-b5ol4ngl-pooler.c-7.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require
```

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

---

## ☁️ Deploy na Vercel

1. Acesse [vercel.com](https://vercel.com) e conecte com o GitHub.
2. Importe o repositório **appnutri-lica-muniz-nutri**.
3. Em **Environment Variables**, adicione as chaves:
   - `VITE_NEON_AUTH_URL`
   - `VITE_NEON_DATABASE_URL`
4. Clique em **Deploy**. O arquivo `vercel.json` já está configurado para roteamento SPA sem erros 404!
