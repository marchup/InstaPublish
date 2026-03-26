import Link from 'next/link'
import Navbar from '@/components/Navbar'
import styles from './page.module.css'

export default function Home() {
  return (
    <main className={styles.main}>
      <Navbar />
      
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.title}>
            Crea flyers profesionales
            <span className={styles.accent}> en segundos</span>
          </h1>
          <p className={styles.subtitle}>
            Sube tu foto, agrega precio y contacto, y genera imágenes listas 
            para Instagram, WhatsApp y Marketplace. Sin diseño, sin complicaciones.
          </p>
          <Link href="/login" className="btn btn-primary">
            🚀 Empezar gratis
          </Link>
        </div>
        
        <div className={styles.heroVisual}>
          <div className={styles.mockup}>
            <div className={styles.mockupHeader}>
              <span>Instagram</span>
            </div>
            <div className={styles.mockupImage}>
              <span>📷</span>
            </div>
            <div className={styles.mockupInfo}>
              <span className={styles.mockupPrice}>$15.000</span>
              <span className={styles.mockupTitle}>Remera Nike vintage</span>
              <span className={styles.mockupContact}>+54 9 11 1234-5678</span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.features}>
        <div className={styles.featuresGrid}>
          <div className={`card ${styles.featureCard}`}>
            <div className={styles.featureIcon}>📸</div>
            <h3>Sube tu producto</h3>
            <p>Arrastrá o elegí la foto de tu producto. Funciona con cualquier imagen de tu galería.</p>
          </div>
          
          <div className={`card ${styles.featureCard}`}>
            <div className={styles.featureIcon}>💰</div>
            <h3>Agregá detalles</h3>
            <p>Escribí el precio, una descripción y tu contacto. Nosotros generamos el diseño.</p>
          </div>
          
          <div className={`card ${styles.featureCard}`}>
            <div className={styles.featureIcon}>✨</div>
            <h3>Descargá tu pack</h3>
            <p>Obtené versiones optimizadas para Instagram, WhatsApp y Marketplace listas para publicar.</p>
          </div>
        </div>
      </section>

      <section className={styles.cta}>
        <h2>¿Qué esperás?</h2>
        <p>Empezá a vender más rápido hoy mismo</p>
        <Link href="/login" className="btn btn-primary">
          Crear mi primer flyer
        </Link>
      </section>

      <footer className={styles.footer}>
        <p>© 2026 FlyerGen. Hecho con ❤️ para vendedores argentinos.</p>
      </footer>
    </main>
  )
}