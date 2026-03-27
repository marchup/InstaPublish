'use client'

import { useState } from 'react'
import { GeneratedFlyer, generateAllFlyers } from '@/lib/flyer-generator'
import styles from './FlyerGenerator.module.css'

interface FlyerGeneratorProps {
  image: string
  title: string
  price: string
  description?: string
  contact?: string
}

const STYLE_INFO = {
  agresivo: {
    name: 'Agresivo',
    description: 'Fondo con blur, precio impactante',
    icon: '🔥',
  },
  limpio: {
    name: 'Limpio',
    description: 'Diseño minimalista, fondo claro',
    icon: '✨',
  },
  instagram: {
    name: 'Instagram',
    description: 'Degradado moderno, texto blanco',
    icon: '📸',
  },
}

const FORMAT_INFO = {
  'ig-post': { name: '1:1', desc: 'Instagram Post' },
  'story': { name: '9:16', desc: 'Story' },
  'marketplace': { name: '4:3', desc: 'Marketplace' },
}

export default function FlyerGenerator({
  image,
  title,
  price,
  description,
  contact,
}: FlyerGeneratorProps) {
  const [flyers, setFlyers] = useState<GeneratedFlyer[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [improveImage, setImproveImage] = useState(true)

  const handleGenerate = async () => {
    if (!image || !title || !price) {
      setError('Faltan datos requeridos')
      return
    }

    setLoading(true)
    setError('')
    setFlyers([])

    try {
      const results = await generateAllFlyers(image, title, price, {
        description,
        contact,
        improveImage,
      })
      setFlyers(results)
    } catch (err) {
      console.error('Error generating flyers:', err)
      setError('Error al generar flyers. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const downloadFlyer = (flyer: GeneratedFlyer) => {
    if (!flyer.dataUrl) return
    const link = document.createElement('a')
    link.download = `flyer-${flyer.style}-${flyer.format}.png`
    link.href = flyer.dataUrl
    link.click()
  }

  const downloadAll = async () => {
    try {
      // Descargar cada flyer individualmente en lugar de ZIP
      for (const flyer of flyers) {
        if (flyer.dataUrl) {
          const link = document.createElement('a')
          link.download = `flyer-${flyer.style}-${flyer.format}.png`
          link.href = flyer.dataUrl
          link.click()
          // Pequeña pausa entre descargas
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }
    } catch (err) {
      console.error('Error descargando flyers:', err)
      setError('Error al descargar los flyers')
    }
  }

  // Agrupar por estilo
  const groupedFlyers = flyers.reduce((acc, flyer) => {
    if (!acc[flyer.style]) acc[flyer.style] = []
    acc[flyer.style].push(flyer)
    return acc
  }, {} as Record<string, GeneratedFlyer[]>)

  return (
    <div className={styles.container}>
      {/* Controls */}
      <div className={styles.controls}>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={improveImage}
            onChange={(e) => setImproveImage(e.target.checked)}
          />
          <span>Mejorar imagen (brillo + contraste)</span>
        </label>

        <button
          className={styles.generateBtn}
          onClick={handleGenerate}
          disabled={loading || !image || !title || !price}
        >
          {loading ? '⏳ Generando...' : '🎨 Generar Flyers'}
        </button>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {/* Results */}
      {flyers.length > 0 && (
        <div className={styles.results}>
          <div className={styles.resultsHeader}>
            <h3>🎉 Tus flyers están listos!</h3>
            <button className={styles.downloadAllBtn} onClick={downloadAll}>
              ⬇️ Descargar todo (ZIP)
            </button>
          </div>

          {Object.entries(groupedFlyers).map(([style, styleFlyers]) => (
            <div key={style} className={styles.styleSection}>
              <div className={styles.styleHeader}>
                <span className={styles.styleIcon}>
                  {STYLE_INFO[style as keyof typeof STYLE_INFO]?.icon}
                </span>
                <div>
                  <h4>{STYLE_INFO[style as keyof typeof STYLE_INFO]?.name}</h4>
                  <p>
                    {STYLE_INFO[style as keyof typeof STYLE_INFO]?.description}
                  </p>
                </div>
              </div>

              <div className={styles.flyersGrid}>
                {styleFlyers.map((flyer) => (
                  <div key={flyer.id} className={styles.flyerCard}>
                    <div className={styles.flyerPreview}>
                      {flyer.dataUrl ? (
                        <img src={flyer.dataUrl} alt={flyer.formatName} />
                      ) : (
                        <div className={styles.flyerError}>Error</div>
                      )}
                    </div>
                    <div className={styles.flyerInfo}>
                      <span className={styles.formatBadge}>
                        {FORMAT_INFO[flyer.format as keyof typeof FORMAT_INFO]?.name}
                      </span>
                      <span className={styles.formatDesc}>
                        {FORMAT_INFO[flyer.format as keyof typeof FORMAT_INFO]?.desc}
                      </span>
                    </div>
                    <button
                      className={styles.downloadBtn}
                      onClick={() => downloadFlyer(flyer)}
                    >
                      ⬇️ Descargar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Generando tus flyers...</p>
        </div>
      )}
    </div>
  )
}
