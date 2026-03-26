'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import styles from './dashboard.module.css'

interface Flyer {
  id: string
  title: string
  price: number
  created_at: string
  image_url?: string
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth()
  const [flyers, setFlyers] = useState<Flyer[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (authLoading || !user) {
    return <div className={styles.loading}>Cargando...</div>
  }

  return (
    <main className={styles.main}>
      <Navbar user={user} onLogout={handleLogout} />
      
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>¡Hola, {user.email?.split('@')[0]}! 👋</h1>
            <p>Creá tus flyers y empezá a vender más rápido</p>
          </div>
          <Link href="/generator" className="btn btn-primary">
            + Nuevo Flyer
          </Link>
        </div>

        <div className={styles.stats}>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>🎨</span>
            <div>
              <span className={styles.statValue}>3</span>
              <span className={styles.statLabel}>Flyers generados</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>🎁</span>
            <div>
              <span className={styles.statValue}>7</span>
              <span className={styles.statLabel}>Créditos gratis</span>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2>Tus Flyers Recientes</h2>
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>📦</span>
            <p>No tenés flyers todavía</p>
            <Link href="/generator" className="btn btn-secondary">
              Crear mi primer flyer
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}