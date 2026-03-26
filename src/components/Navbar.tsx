import Link from 'next/link'
import { User } from '@supabase/supabase-js'
import styles from './Navbar.module.css'

interface NavbarProps {
  user?: User | null
  onLogout?: () => void
}

export default function Navbar({ user, onLogout }: NavbarProps) {
  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>⚡</span>
          FlyerGen
        </Link>
        
        <div className={styles.links}>
          <Link href="/" className={styles.link}>
            Inicio
          </Link>
          {user ? (
            <>
              <Link href="/dashboard" className={styles.link}>
                Dashboard
              </Link>
              <button onClick={onLogout} className="btn btn-ghost">
                Cerrar sesión
              </button>
            </>
          ) : (
            <Link href="/login" className="btn btn-primary">
              Comenzar
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}