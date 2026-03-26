# FlyerGen

SAAS para generar flyers profesionales con IA para vender productos en Instagram, WhatsApp y Marketplace.

## 🚀 Quick Start

### 1. Clonar el repo
```bash
git clone <tu-repo-url>
cd flyer-gen
```

### 2. Configurar Supabase
1. Crear proyecto en [supabase.com](https://supabase.com)
2. Copiar `.env.local.example` a `.env.local`
3. Agregar tus credenciales:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Instalar dependencias
```bash
npm install
```

### 4. Correr local
```bash
npm run dev
```

### 5. Deploy a Vercel
1. Push a GitHub
2. Importar en Vercel
3. Configurar environment variables
4. Deploy!

## 📋 Features (MVP)

- ✅ Landing page dark/moderna
- ✅ Login/Register con Supabase Auth
- ✅ Dashboard con stats
- ✅ Generador de flyers (4 formatos)
- ✅ Descarga individual + ZIP
- ✅ UI responsive mobile-first

## 🎨 Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Supabase (Auth + DB)
- CSS Modules
- Vercel (Deploy)

## 📝 Licencia

MIT
