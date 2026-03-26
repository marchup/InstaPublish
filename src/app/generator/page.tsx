'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import styles from './generator.module.css'

interface GeneratedFlyer {
  id: string
  platform: string
  format: string
  dataUrl: string
}

export default function Generator() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  
  const [image, setImage] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [contactType, setContactType] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [category, setCategory] = useState('otros')
  const [generating, setGenerating] = useState(false)
  const [flyers, setFlyers] = useState<GeneratedFlyer[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const canvasRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({})

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setErrors({ ...errors, image: 'La imagen es muy grande (máx 5MB)' })
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      setImage(e.target?.result as string)
      setErrors({ ...errors, image: '' })
    }
    reader.readAsDataURL(file)
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!image) newErrors.image = 'Subí una imagen de tu producto'
    if (!title.trim()) newErrors.title = 'Escribí el nombre del producto'
    if (!price.trim()) newErrors.price = 'Agregá el precio'
    // Contacto es opcional ahora
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const formatPrice = (p: string) => {
    const num = p.replace(/[^\d]/g, '')
    if (!num) return '$0'
    return '$' + parseInt(num).toLocaleString('es-AR')
  }

  const generateFlyers = async () => {
    if (!validate() || !image) return

    setGenerating(true)
    setFlyers([])

    await new Promise(resolve => setTimeout(resolve, 500))

    if (!CanvasRenderingContext2D.prototype.roundRect) {
      CanvasRenderingContext2D.prototype.roundRect = function(x: number, y: number, w: number, h: number, r: number) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        this.beginPath();
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        this.closePath();
        return this;
      }
    }

    const formats = [
      { id: 'ig-story', platform: 'Instagram', format: 'Story (9:16)', width: 1080, height: 1920 },
      { id: 'ig-post', platform: 'Instagram', format: 'Post (1:1)', width: 1080, height: 1080 },
      { id: 'whatsapp', platform: 'WhatsApp', format: 'Cuadrado', width: 1080, height: 1080 },
      { id: 'marketplace', platform: 'Facebook', format: 'Marketplace', width: 1200, height: 1200 },
    ]

    const generatedFlyers: GeneratedFlyer[] = []

    for (const fmt of formats) {
      const canvas = document.createElement('canvas')
      canvas.width = fmt.width
      canvas.height = fmt.height
      const ctx = canvas.getContext('2d')!

      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      await new Promise<void>((resolve) => {
        img.onload = () => {
          const scale = Math.max(fmt.width / img.width, fmt.height / img.height)
          const w = img.width * scale
          const h = img.height * scale
          const x = (fmt.width - w) / 2
          const y = (fmt.height - h) / 2

          // Background con gradiente mejorado
          const bgGradient = ctx.createLinearGradient(0, 0, fmt.width, fmt.height)
          bgGradient.addColorStop(0, '#1a1a2e')
          bgGradient.addColorStop(0.5, '#16213e')
          bgGradient.addColorStop(1, '#0f0f1a')
          ctx.fillStyle = bgGradient
          ctx.fillRect(0, 0, fmt.width, fmt.height)

          // Efecto de luz sutil
          const lightGradient = ctx.createRadialGradient(
            fmt.width / 2, fmt.height / 3, 0,
            fmt.width / 2, fmt.height / 3, fmt.width * 0.8
          )
          lightGradient.addColorStop(0, 'rgba(233, 69, 96, 0.15)')
          lightGradient.addColorStop(1, 'transparent')
          ctx.fillStyle = lightGradient
          ctx.fillRect(0, 0, fmt.width, fmt.height)

          // Dibujar imagen con cobertura completa
          ctx.drawImage(img, x, y, w, h)

          // Overlay oscuro en la parte inferior
          const overlayHeight = fmt.height * 0.35
          const overlayGradient = ctx.createLinearGradient(0, fmt.height - overlayHeight, 0, fmt.height)
          overlayGradient.addColorStop(0, 'rgba(15, 15, 26, 0)')
          overlayGradient.addColorStop(0.3, 'rgba(15, 15, 26, 0.7)')
          overlayGradient.addColorStop(1, 'rgba(15, 15, 26, 0.95)')
          ctx.fillStyle = overlayGradient
          ctx.fillRect(0, fmt.height - overlayHeight, fmt.width, overlayHeight)

          // Línea decorativa superior
          ctx.strokeStyle = '#E94560'
          ctx.lineWidth = 4
          ctx.beginPath()
          ctx.moveTo(0, 0)
          ctx.lineTo(fmt.width, 0)
          ctx.stroke()

          // PRECIO - destacado con sombra
          ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
          ctx.shadowBlur = 20
          ctx.font = `bold ${fmt.width * 0.06}px Outfit, sans-serif`
          ctx.fillStyle = '#00D9A5'
          ctx.fillText(formatPrice(price), 40, fmt.height - 180)
          ctx.shadowBlur = 0

          // TÍTULO del producto
          ctx.font = `bold ${fmt.width * 0.045}px Outfit, sans-serif`
          ctx.fillStyle = '#FFFFFF'
          const titleText = title.length > 30 ? title.substring(0, 30) + '...' : title
          ctx.fillText(titleText, 40, fmt.height - 120)

          // DESCRICIÓN - texto de venta si existe
          if (description) {
            ctx.font = `${fmt.width * 0.022}px DM Sans, sans-serif`
            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
            const descText = description.length > 80 ? description.substring(0, 80) + '...' : description
            ctx.fillText(descText, 40, fmt.height - 85)
          }

          // CONTACTO - basado en contactType
          let contactText = ''
          if (contactType === 'MP privado') {
            contactText = '📩 Enviar mensaje por privado'
          } else if (contactType === 'WhatsApp' && whatsapp) {
            contactText = '💬 ' + whatsapp
          }
          
          if (contactText) {
            ctx.font = `bold ${fmt.width * 0.025}px DM Sans, sans-serif`
            ctx.fillStyle = '#E94560'
            ctx.fillText(contactText, 40, fmt.height - 45)
          }

          // Badge de plataforma con estilo
          const badgeW = fmt.width * 0.18
          const badgeH = 45
          const badgeX = 25
          const badgeY = 25
          
          ctx.fillStyle = fmt.platform === 'Instagram' ? '#E94560' : 
                        fmt.platform === 'WhatsApp' ? '#25D366' : '#1877F2'
          ctx.beginPath()
          ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 25)
          ctx.fill()
          
          ctx.fillStyle = '#FFFFFF'
          ctx.font = `bold ${fmt.width * 0.018}px DM Sans, sans-serif`
          ctx.fillText(fmt.platform, badgeX + 20, badgeY + 30)

          // Footer con "Publicado con InstaPublish"
          ctx.font = `${fmt.width * 0.015}px DM Sans, sans-serif`
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
          ctx.fillText('Publicado con InstaPublish', fmt.width - 200, fmt.height - 25)

          generatedFlyers.push({
            id: fmt.id,
            platform: fmt.platform,
            format: fmt.format,
            dataUrl: canvas.toDataURL('image/png')
          })
          resolve()
        }
        img.onerror = () => {
          generatedFlyers.push({
            id: fmt.id,
            platform: fmt.platform,
            format: fmt.format,
            dataUrl: ''
          })
          resolve()
        }
        img.src = image
      })
    }

    setFlyers(generatedFlyers)
    setGenerating(false)
  }

  const downloadFlyer = (flyer: GeneratedFlyer) => {
    if (!flyer.dataUrl) return
    const link = document.createElement('a')
    link.download = `flyergen-${flyer.id}.png`
    link.href = flyer.dataUrl
    link.click()
  }

  const downloadAll = async () => {
    const JSZip = (await import('jszip')).default
    const { saveAs } = await import('file-saver')

    const zip = new JSZip()
    flyers.forEach(flyer => {
      if (flyer.dataUrl) {
        const base64 = flyer.dataUrl.split(',')[1]
        zip.file(`flyer-${flyer.platform.toLowerCase()}-${flyer.format.toLowerCase().replace(/[^a-z0-9]/g, '')}.png`, base64, { base64: true })
      }
    })

    const content = await zip.generateAsync({ type: 'blob' })
    saveAs(content, 'flyers.zip')
  }

  if (authLoading || !user) {
    return <div className={styles.loading}>Cargando...</div>
  }

  return (
    <main className={styles.main}>
      <Navbar user={user} onLogout={async () => { await supabase.auth.signOut(); router.push('/') }} />
      
      <div className={styles.container}>
        <div className={styles.header}>
          <Link href="/dashboard" className={styles.backLink}>← Volver</Link>
          <h1>Crear nuevo flyer</h1>
        </div>

        <div className={styles.content}>
          <div className={styles.formSection}>
            <div className="card">
              <h3>📸 Tu producto</h3>
              
              <div className={styles.uploadArea}>
                {image ? (
                  <div className={styles.imagePreview}>
                    <img src={image} alt="Preview" />
                    <button onClick={() => setImage(null)} className={styles.removeImage}>✕</button>
                  </div>
                ) : (
                  <label className={styles.uploadLabel}>
                    <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
                    <span className={styles.uploadIcon}>📁</span>
                    <span>Arrastrá tu imagen o hacé click</span>
                  </label>
                )}
              </div>
              {errors.image && <p className="error-text">{errors.image}</p>}

              <div className="input-group">
                <label>Nombre del producto *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Remera Nike vintage"
                  maxLength={80}
                />
                {errors.title && <p className="error-text">{errors.title}</p>}
              </div>

              <div className="input-group">
                <label>Precio (ARS) *</label>
                <input
                  type="text"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="15000"
                />
                {errors.price && <p className="error-text">{errors.price}</p>}
              </div>

              <div className="input-group">
                <label>Descripción (opcional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Talle, estado, detalles..."
                  maxLength={500}
                  rows={3}
                />
              </div>

              <div className="input-group">
                <label>Tu contacto</label>
                <select 
                  value={contactType} 
                  onChange={(e) => setContactType(e.target.value)}
                  style={{ marginBottom: '8px' }}
                >
                  <option value="">Seleccionar...</option>
                  <option value="MP privado">📩 Enviar mensaje por privado</option>
                  <option value="WhatsApp">💬 Escribir por WhatsApp</option>
                </select>
                {contactType === 'WhatsApp' && (
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="+54 9 11 1234-5678"
                  />
                )}
              </div>

              <div className="input-group">
                <label>Categoría</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="ropa">Ropa</option>
                  <option value="muebles">Muebles</option>
                  <option value="electronica">Electrónica</option>
                  <option value="otros">Otros</option>
                </select>
              </div>

              <button 
                className="btn btn-primary"
                onClick={generateFlyers}
                disabled={generating}
                style={{ width: '100%', marginTop: '16px' }}
              >
                {generating ? '🎨 Generando...' : '✨ Generar mis flyers'}
              </button>
            </div>
          </div>

          <div className={styles.resultSection}>
            {flyers.length > 0 ? (
              <div className="card">
                <div className={styles.resultHeader}>
                  <h3>¡Tus flyers están listos! 🎉</h3>
                  <button className="btn btn-secondary" onClick={downloadAll}>
                    📥 Descargar todo (ZIP)
                  </button>
                </div>
                
                <div className={styles.flyersGrid}>
                  {flyers.map((flyer) => (
                    <div key={flyer.id} className={styles.flyerCard}>
                      <div className={styles.flyerPreview}>
                        {flyer.dataUrl ? (
                          <img src={flyer.dataUrl} alt={flyer.format} />
                        ) : (
                          <div className={styles.flyerError}>Error</div>
                        )}
                      </div>
                      <div className={styles.flyerInfo}>
                        <span className={styles.flyerPlatform}>{flyer.platform}</span>
                        <span className={styles.flyerFormat}>{flyer.format}</span>
                      </div>
                      <button 
                        className="btn btn-secondary"
                        onClick={() => downloadFlyer(flyer)}
                        style={{ width: '100%', padding: '10px' }}
                      >
                        💾 Descargar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className={styles.placeholder}>
                <span>🎯</span>
                <p>Completá los datos y generá tu flyer</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}