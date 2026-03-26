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
  const [contact, setContact] = useState('')
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
    if (!contact.trim()) newErrors.contact = 'Agregá tu contacto'
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
      CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
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

          ctx.fillStyle = '#1A1A2E'
          ctx.fillRect(0, 0, fmt.width, fmt.height)

          const gradient = ctx.createLinearGradient(0, 0, fmt.width, fmt.height)
          gradient.addColorStop(0, '#1A1A2E')
          gradient.addColorStop(1, '#16213E')
          ctx.fillStyle = gradient
          ctx.fillRect(0, 0, fmt.width, fmt.height)

          ctx.drawImage(img, x, y, w, h)

          const overlayHeight = 280
          const gradient2 = ctx.createLinearGradient(0, fmt.height - overlayHeight, 0, fmt.height)
          gradient2.addColorStop(0, 'rgba(26, 26, 46, 0)')
          gradient2.addColorStop(1, 'rgba(26, 26, 46, 1)')
          ctx.fillStyle = gradient2
          ctx.fillRect(0, fmt.height - overlayHeight, fmt.width, overlayHeight)

          ctx.font = 'bold 56px Outfit, sans-serif'
          ctx.fillStyle = '#00D9A5'
          ctx.fillText(formatPrice(price), 40, fmt.height - 160)

          ctx.font = 'bold 40px Outfit, sans-serif'
          ctx.fillStyle = '#FFFFFF'
          const titleY = fmt.height - 100
          ctx.fillText(title.substring(0, 25) + (title.length > 25 ? '...' : ''), 40, titleY)

          ctx.font = '24px DM Sans, sans-serif'
          ctx.fillStyle = '#A0A0B0'
          ctx.fillText(contact, 40, fmt.height - 50)

          if (description) {
            ctx.font = '20px DM Sans, sans-serif'
            const desc = description.substring(0, 60) + (description.length > 60 ? '...' : '')
            ctx.fillText(desc, 40, 60)
          }

          const badgeColor = fmt.platform === 'Instagram' ? '#E94560' : 
                            fmt.platform === 'WhatsApp' ? '#25D366' : '#1877F2'
          ctx.fillStyle = badgeColor
          ctx.beginPath()
          ctx.roundRect(20, 20, 180, 40, 20)
          ctx.fill()
          ctx.fillStyle = '#FFFFFF'
          ctx.font = 'bold 20px DM Sans, sans-serif'
          ctx.fillText(fmt.platform, 40, 48)

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
                <label>Tu contacto (WhatsApp o email) *</label>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="+54 9 11 1234-5678"
                />
                {errors.contact && <p className="error-text">{errors.contact}</p>}
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