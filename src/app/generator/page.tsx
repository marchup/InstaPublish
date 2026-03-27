'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import FlyerGenerator from '@/components/FlyerGenerator'
import styles from './generator.module.css'

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
  const [generatingDesc, setGeneratingDesc] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

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

  const formatPrice = (p: string) => {
    const num = p.replace(/[^\d]/g, '')
    if (!num) return '$0'
    return '$' + parseInt(num).toLocaleString('es-AR')
  }

  // Formatear contacto para los flyers
  const getContactText = (): string | undefined => {
    if (contactType === 'MP privado') {
      return '📧 Enviar mensaje por privado'
    } else if (contactType === 'WhatsApp' && whatsapp) {
      return '💬 ' + whatsapp
    }
    return undefined
  }

  // Validar antes de mostrar el generador
  const isValid = image && title.trim() && price.trim()

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
              </div>

              <div className="input-group">
                <label>Precio (ARS) *</label>
                <input
                  type="text"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="15000"
                />
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
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={async () => {
                    if (!title.trim() || !price.trim()) {
                      setErrors({ ...errors, title: 'Escribí el nombre del producto', price: 'Agregá el precio' })
                      return
                    }
                    setGeneratingDesc(true)
                    try {
                      const res = await fetch('/api/generate-description', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                          producto: title, 
                          precio: price, 
                          categoria: category,
                          descripcion: description
                        })
                      })
                      const data = await res.json()
                      if (data.error) {
                        setErrors({ ...errors, descripcion: data.error })
                      } else {
                        setDescription(data.descripcion)
                        setErrors({ ...errors, descripcion: '' })
                      }
                    } catch {
                      setErrors({ ...errors, descripcion: 'Error al generar. Intentá de nuevo.' })
                    } finally {
                      setGeneratingDesc(false)
                    }
                  }}
                  disabled={generatingDesc}
                  style={{ marginTop: '8px', width: '100%' }}
                >
                  {generatingDesc ? '✨ Generando...' : '✨ Generar descripción'}
                </button>
              </div>

              <div className="input-group">
                <label>Tu contacto</label>
                <select 
                  value={contactType} 
                  onChange={(e) => setContactType(e.target.value)}
                  style={{ marginBottom: '8px' }}
                >
                  <option value="">Seleccionar...</option>
                  <option value="MP privado">📧 Enviar mensaje por privado</option>
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
            </div>
          </div>

          <div className={styles.resultSection}>
            {isValid ? (
              <FlyerGenerator
                image={image}
                title={title}
                price={formatPrice(price)}
                description={description}
                contact={getContactText()}
              />
            ) : (
              <div className={styles.placeholder}>
                <span>📋</span>
                <p>Completá los datos del producto para generar tus flyers</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
