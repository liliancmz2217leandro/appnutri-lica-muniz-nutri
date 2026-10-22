import { createAuthClient } from '@neondatabase/auth'
import { neon } from '@neondatabase/serverless'

const authUrl = import.meta.env.VITE_NEON_AUTH_URL || ''
const dbUrl = import.meta.env.VITE_NEON_DATABASE_URL || ''

if (!dbUrl) {
  console.warn('[Security/Config] VITE_NEON_DATABASE_URL is not defined in the environment. Please configure it in your .env or Vercel Environment Variables.')
}

// Neon Auth Client
export const authClient = createAuthClient(authUrl || 'https://auth.neon.tech')

// Direct Neon SQL Client for queries & inserts
export const sql = neon(dbUrl || 'postgresql://user:pass@localhost/neondb')

export interface UserSession {
  id: string
  name: string
  email: string
  createdAt?: string
}

const LOCAL_SESSION_KEY = 'nutrisystem_user_session'

export const getStoredSession = (): UserSession | null => {
  try {
    const raw = localStorage.getItem(LOCAL_SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as UserSession
  } catch {
    return null
  }
}

export const setStoredSession = (user: UserSession | null) => {
  if (user) {
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(LOCAL_SESSION_KEY)
  }
}

// Ensure record exists in public.nutricionistas table
export async function syncNutricionista(name: string, email: string): Promise<UserSession> {
  try {
    const existing = await sql`
      SELECT id, nome, email, created_at 
      FROM nutricionistas 
      WHERE email = ${email}
      LIMIT 1
    `
    if (existing && existing.length > 0) {
      return {
        id: existing[0].id,
        name: existing[0].nome,
        email: existing[0].email,
        createdAt: existing[0].created_at,
      }
    }

    const inserted = await sql`
      INSERT INTO nutricionistas (nome, email)
      VALUES (${name}, ${email})
      ON CONFLICT (email) DO UPDATE SET nome = EXCLUDED.nome
      RETURNING id, nome, email, created_at
    `
    return {
      id: inserted[0].id,
      name: inserted[0].nome,
      email: inserted[0].email,
      createdAt: inserted[0].created_at,
    }
  } catch (err) {
    console.warn('Sync nutricionista error, falling back to local object:', err)
    return {
      id: crypto.randomUUID(),
      name,
      email,
    }
  }
}
