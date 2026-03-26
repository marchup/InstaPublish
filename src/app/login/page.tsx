'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase'
import styles from './auth.module.css'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        router.push('/dashboard')
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(err.message || 'Algo salió mal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className={styles.main}>
      <Navbar />
      
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>
            {isLogin ? 'Bienvenido de nuevo' : 'Crear cuenta'}
          </h1>
          <p className={styles.subtitle}>
            {isLogin 
              ? 'Ingresá a tu cuenta para crear flyers' 
              : 'Registrate gratis y empezá a crear flyers'}
          </p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className="input-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
              />
            </div>

            <div className="input-group">
              <label>Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            {error && <p className="error-text">{error}</p>}

            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%' }}
            >
              {loading ? 'Cargando...' : isLogin ? 'Ingresar' : 'Crear cuenta'}
            </button>
          </form>

          <p className={styles.switch}>
            {isLogin ? '¿No tenés cuenta? ' : '¿Ya tenés cuenta? '}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className={styles.switchBtn}
            >
              {isLogin ? 'Crear cuenta' : 'Iniciar sesión'}
            </button>
          </p>
        </div>
      </div>
    </main>
  )
}