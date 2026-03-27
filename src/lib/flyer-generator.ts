'use client'

import type { GeneratedFlyer } from './types'

// Re-exportar el tipo para uso externo
export type { GeneratedFlyer, FlyerGenerationOptions } from './types'

// ============================================
// UTILIDADES DE COLOR
// ============================================

/**
 * Obtiene el color dominante de una imagen promediando los píxeles
 */
export async function getDominantColor(imageSrc: string): Promise<{ r: number; g: number; b: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('No se pudo crear el canvas'))
        return
      }

      // Usar una versión pequeña para el análisis de color
      const sampleSize = 50
      canvas.width = sampleSize
      canvas.height = sampleSize
      ctx.drawImage(img, 0, 0, sampleSize, sampleSize)

      const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize)
      const data = imageData.data

      let r = 0, g = 0, b = 0, count = 0

      for (let i = 0; i < data.length; i += 4) {
        // Ignorar píxeles transparente o muy oscuros
        if (data[i + 3] > 128 && (data[i] + data[i + 1] + data[i + 2]) > 30) {
          r += data[i]
          g += data[i + 1]
          b += data[i + 2]
          count++
        }
      }

      if (count === 0) {
        resolve({ r: 128, g: 128, b: 128 })
        return
      }

      resolve({
        r: Math.round(r / count),
        g: Math.round(g / count),
        b: Math.round(b / count)
      })
    }
    img.onerror = () => resolve({ r: 128, g: 128, b: 128 })
    img.src = imageSrc
  })
}

/**
 * Genera una paleta de colores basada en el color dominante
 */
export function generatePalette(dominant: { r: number; g: number; b: number }): {
  mainColor: string
  darkColor: string
  lightColor: string
  accentColor: string
} {
  const { r, g, b } = dominant

  // mainColor: color dominante
  const mainColor = `rgb(${r}, ${g}, ${b})`

  // darkColor: versión oscura (30% más oscuro)
  const darkR = Math.round(r * 0.7)
  const darkG = Math.round(g * 0.7)
  const darkB = Math.round(b * 0.7)
  const darkColor = `rgb(${darkR}, ${darkG}, ${darkB})`

  // lightColor: versión clara (mezcla con blanco)
  const lightR = Math.round(r + (255 - r) * 0.6)
  const lightG = Math.round(g + (255 - g) * 0.6)
  const lightB = Math.round(b + (255 - b) * 0.6)
  const lightColor = `rgb(${lightR}, ${lightG}, ${lightB})`

  // accentColor: color complementario (inverso)
  const accentColor = `rgb(${255 - r}, ${255 - g}, ${255 - b})`

  return { mainColor, darkColor, lightColor, accentColor }
}

/**
 * Convierte rgb a hex
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
}

/**
 * Oscurece un color rgb por un factor
 */
export function darkenColor(r: number, g: number, b: number, factor: number = 0.7): string {
  return `rgb(${Math.round(r * factor)}, ${Math.round(g * factor)}, ${Math.round(b * factor)})`
}

// ============================================
// PROCESAMIENTO DE IMAGEN
// ============================================

/**
 * Redimensiona imagen manteniendo calidad usando canvas
 */
export function resizeImage(
  imageSrc: string,
  targetWidth: number,
  targetHeight: number,
  improve: boolean = false
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('No se pudo crear el canvas'))
        return
      }

      canvas.width = targetWidth
      canvas.height = targetHeight

      // Calcular cover (ocupar todo el espacio manteniendo proporción)
      const scale = Math.max(targetWidth / img.width, targetHeight / img.height)
      const w = img.width * scale
      const h = img.height * scale
      const x = (targetWidth - w) / 2
      const y = (targetHeight - h) / 2

      // Aplicar filtro si está habilitado
      if (improve) {
        ctx.filter = 'brightness(1.1) contrast(1.2) saturate(1.2)'
      }

      ctx.drawImage(img, x, y, w, h)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => reject(new Error('Error al cargar la imagen'))
    img.src = imageSrc
  })
}

/**
 * Aplica blur a una imagen
 */
export function applyBlur(imageSrc: string, blurAmount: number = 20): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('No se pudo crear el canvas'))
        return
      }

      canvas.width = img.width
      canvas.height = img.height

      // Aplicar blur
      ctx.filter = `blur(${blurAmount}px)`
      ctx.drawImage(img, 0, 0)

      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => reject(new Error('Error al aplicar blur'))
    img.src = imageSrc
  })
}

// ============================================
// FORMATOS DE OUTPUT
// ============================================

export const OUTPUT_FORMATS = [
  { id: 'ig-post', name: 'Instagram Post', width: 1080, height: 1080, platform: 'Instagram' },
  { id: 'story', name: 'Story', width: 1080, height: 1920, platform: 'Instagram' },
  { id: 'marketplace', name: 'Marketplace', width: 1200, height: 900, platform: 'Facebook' },
] as const

// ============================================
// GENERADORES DE ESTILO
// ============================================

interface FlyerOptions {
  image: string
  title: string
  price: string
  description?: string
  contact?: string
  paleta: {
    mainColor: string
    darkColor: string
    lightColor: string
    accentColor: string
  }
  improveImage?: boolean
}

/**
 * ESTILO AGRESIVO: fondo con blur fuerte, overlay oscuro, precio grande
 */
export async function generateAgresivo(
  imageSrc: string,
  options: FlyerOptions,
  width: number,
  height: number
): Promise<string> {
  const { title, price, description, contact, paleta, improveImage } = options
  const { mainColor, darkColor } = paleta

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo crear el contexto')

  // 1. Fondo con blur fuerte
  const blurAmount = height * 0.05 // 5% de la altura
  const blurredBg = await applyBlur(imageSrc, blurAmount)
  const bgImg = new Image()
  bgImg.crossOrigin = 'anonymous'
  await new Promise<void>((resolve) => {
    bgImg.onload = () => {
      const scale = Math.max(width / bgImg.width, height / bgImg.height)
      const w = bgImg.width * scale
      const h = bgImg.height * scale
      const x = (width - w) / 2
      const y = (height - h) / 2
      ctx.drawImage(bgImg, x, y, w, h)
      resolve()
    }
    bgImg.src = blurredBg
  })

  // 2. Overlay oscuro (35% opacidad)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'
  ctx.fillRect(0, 0, width, height)

  // 3. Franja de color lateral (mainColor o rojo)
  const stripeWidth = width * 0.08
  ctx.fillStyle = mainColor
  ctx.fillRect(0, 0, stripeWidth, height)

  // Barra decorativa adicional
  ctx.fillStyle = '#E94560' // Rojo vibrante
  ctx.fillRect(stripeWidth, 0, width * 0.02, height)

  // 4. Imagen del producto (centrada, más pequeña)
  const imgSize = Math.min(width, height) * 0.5
  const productImg = new Image()
  productImg.crossOrigin = 'anonymous'
  
  await new Promise<void>((resolve) => {
    productImg.onload = () => {
      const scale = Math.max(imgSize / productImg.width, imgSize / productImg.height)
      const w = productImg.width * scale
      const h = productImg.height * scale
      const x = (width - w) / 2
      const y = height * 0.15

      // Mejorar imagen si está habilitado
      if (improveImage) {
        ctx.filter = 'brightness(1.1) contrast(1.2) saturate(1.2)'
      }

      // Sombra detrás de la imagen
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
      ctx.shadowBlur = 30
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 10
      
      ctx.drawImage(productImg, x, y, w, h)
      ctx.filter = 'none'
      ctx.shadowBlur = 0
      resolve()
    }
    productImg.src = imageSrc
  })

  // 5. PRECIO - GRANDE Y IMPACTANTE (verde vibrante)
  ctx.font = `bold ${width * 0.14}px 'Outfit', sans-serif`
  ctx.fillStyle = '#00FF88'
  ctx.textAlign = 'center'
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)'
  ctx.shadowBlur = 25
  ctx.shadowOffsetX = 2
  ctx.shadowOffsetY = 2
  ctx.fillText(price, width / 2, height * 0.68)
  ctx.shadowBlur = 0

  // 6. NOMBRE - más grande y visible
  ctx.font = `bold ${width * 0.065}px 'Outfit', sans-serif`
  ctx.fillStyle = '#FFFFFF'
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)'
  ctx.shadowBlur = 15
  const titleText = title.length > 20 ? title.substring(0, 20) + '...' : title
  ctx.fillText(titleText, width / 2, height * 0.76)
  ctx.shadowBlur = 0

  // 7. DESCRIPCIÓN si existe - más visible
  if (description) {
    ctx.font = `${width * 0.032}px 'DM Sans', sans-serif`
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)'
    ctx.shadowBlur = 10
    const descText = description.length > 50 ? description.substring(0, 50) + '...' : description
    ctx.fillText(descText, width / 2, height * 0.82)
    ctx.shadowBlur = 0
  }

  // 8. CONTACTO si existe - más grande
  if (contact) {
    ctx.font = `bold ${width * 0.038}px 'DM Sans', sans-serif`
    ctx.fillStyle = '#FFFFFF'
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)'
    ctx.shadowBlur = 12
    ctx.fillText(contact, width / 2, height * 0.88)
    ctx.shadowBlur = 0
  }

  // 9. Badge de plataforma
  ctx.fillStyle = '#E94560'
  ctx.beginPath()
  ctx.roundRect(25, 25, width * 0.15, 40, 20)
  ctx.fill()
  ctx.fillStyle = '#FFFFFF'
  ctx.font = `bold ${width * 0.018}px 'DM Sans', sans-serif`
  ctx.textAlign = 'left'
  ctx.fillText('AGRESIVO', 35, 52)

  return canvas.toDataURL('image/png')
}

/**
 * ESTILO LIMPIO: fondo claro, diseño minimalista, mucho espacio vacío
 */
export async function generateLimpio(
  imageSrc: string,
  options: FlyerOptions,
  width: number,
  height: number
): Promise<string> {
  const { title, price, description, contact, paleta, improveImage } = options
  const { darkColor, lightColor } = paleta

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo crear el contexto')

  // 1. Fondo claro/blanco
  ctx.fillStyle = '#FAFAFA'
  ctx.fillRect(0, 0, width, height)

  // 2. Imagen del producto (centrada, con improve si está habilitado)
  const imgSize = Math.min(width, height) * 0.55
  const productImg = new Image()
  productImg.crossOrigin = 'anonymous'
  
  await new Promise<void>((resolve) => {
    productImg.onload = () => {
      const scale = Math.max(imgSize / productImg.width, imgSize / productImg.height)
      const w = productImg.width * scale
      const h = productImg.height * scale
      const x = (width - w) / 2
      const y = height * 0.1

      if (improveImage) {
        ctx.filter = 'brightness(1.1) contrast(1.2) saturate(1.2)'
      }

      // Borde sutil
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.roundRect(x - 5, y - 5, w + 10, h + 10, 8)
      ctx.stroke()

      ctx.drawImage(productImg, x, y, w, h)
      ctx.filter = 'none'
      resolve()
    }
    productImg.src = imageSrc
  })

  // 3. NOMBRE - texto oscuro/negro
  ctx.font = `bold ${width * 0.05}px 'Outfit', sans-serif`
  ctx.fillStyle = '#1A1A2E'
  ctx.textAlign = 'center'
  const titleText = title.length > 30 ? title.substring(0, 30) + '...' : title
  ctx.fillText(titleText, width / 2, height * 0.72)

  // 4. PRECIO - visible pero no dominante
  ctx.font = `bold ${width * 0.07}px 'Outfit', sans-serif`
  ctx.fillStyle = darkColor
  ctx.fillText(price, width / 2, height * 0.8)

  // 5. DESCRIPCIÓN si existe (texto más suave)
  if (description) {
    ctx.font = `${width * 0.028}px 'DM Sans', sans-serif`
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    const descText = description.length > 80 ? description.substring(0, 80) + '...' : description
    ctx.fillText(descText, width / 2, height * 0.86)
  }

  // 6. CONTACTO si existe
  if (contact) {
    ctx.font = `bold ${width * 0.025}px 'DM Sans', sans-serif`
    ctx.fillStyle = darkColor
    ctx.fillText(contact, width / 2, height * 0.92)
  }

  // 7. Badge de plataforma discreto
  ctx.fillStyle = lightColor
  ctx.beginPath()
  ctx.roundRect(25, 25, width * 0.12, 35, 18)
  ctx.fill()
  ctx.fillStyle = darkColor
  ctx.font = `bold ${width * 0.015}px 'DM Sans', sans-serif`
  ctx.textAlign = 'left'
  ctx.fillText('LIMPIO', 32, 48)

  // 8. Footer sutil
  ctx.font = `${width * 0.012}px 'DM Sans', sans-serif`
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
  ctx.textAlign = 'center'
  ctx.fillText('InstaPublish', width / 2, height - 20)

  return canvas.toDataURL('image/png')
}

/**
 * ESTILO INSTAGRAM: degradado con mainColor + lightColor, glow, texto blanco
 */
export async function generateInstagram(
  imageSrc: string,
  options: FlyerOptions,
  width: number,
  height: number
): Promise<string> {
  const { title, price, description, contact, paleta, improveImage } = options
  const { mainColor, lightColor } = paleta
  const { r, g, b } = parseRgb(mainColor)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo crear el contexto')

  // 1. Fondo con gradiente usando mainColor + lightColor
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.9)`)
  gradient.addColorStop(0.5, `rgba(${Math.round(r * 0.8)}, ${Math.round(g * 0.8)}, ${Math.round(b * 0.8)}, 0.95)`)
  gradient.addColorStop(1, `rgba(${Math.round(r * 0.6)}, ${Math.round(g * 0.6)}, ${Math.round(b * 0.6)}, 1)`)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  // 2. Glow suave detrás del producto
  const glowGradient = ctx.createRadialGradient(
    width / 2, height * 0.4, 0,
    width / 2, height * 0.4, width * 0.5
  )
  glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)')
  glowGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)')
  glowGradient.addColorStop(1, 'transparent')
  ctx.fillStyle = glowGradient
  ctx.fillRect(0, 0, width, height)

  // 3. Imagen del producto
  const imgSize = Math.min(width, height) * 0.52
  const productImg = new Image()
  productImg.crossOrigin = 'anonymous'
  
  await new Promise<void>((resolve) => {
    productImg.onload = () => {
      const scale = Math.max(imgSize / productImg.width, imgSize / productImg.height)
      const w = productImg.width * scale
      const h = productImg.height * scale
      const x = (width - w) / 2
      const y = height * 0.12

      if (improveImage) {
        ctx.filter = 'brightness(1.15) contrast(1.15) saturate(1.3)'
      }

      // Sombra y borde
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
      ctx.shadowBlur = 25
      ctx.shadowOffsetY = 15
      
      // Borde blanco sutil
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.roundRect(x, y, w, h, 12)
      ctx.stroke()
      
      ctx.drawImage(productImg, x, y, w, h)
      ctx.filter = 'none'
      ctx.shadowBlur = 0
      resolve()
    }
    productImg.src = imageSrc
  })

  // 4. NOMBRE - texto blanco
  ctx.font = `bold ${width * 0.055}px 'Outfit', sans-serif`
  ctx.fillStyle = '#FFFFFF'
  ctx.textAlign = 'center'
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
  ctx.shadowBlur = 10
  const titleText = title.length > 28 ? title.substring(0, 28) + '...' : title
  ctx.fillText(titleText, width / 2, height * 0.73)
  ctx.shadowBlur = 0

  // 5. PRECIO - destacado
  ctx.font = `bold ${width * 0.09}px 'Outfit', sans-serif`
  ctx.fillStyle = '#00D9A5' // Verde vibrante
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'
  ctx.shadowBlur = 15
  ctx.fillText(price, width / 2, height * 0.81)
  ctx.shadowBlur = 0

  // 6. DESCRIPCIÓN si existe
  if (description) {
    ctx.font = `${width * 0.026}px 'DM Sans', sans-serif`
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
    const descText = description.length > 70 ? description.substring(0, 70) + '...' : description
    ctx.fillText(descText, width / 2, height * 0.87)
  }

  // 7. CONTACTO si existe
  if (contact) {
    ctx.font = `bold ${width * 0.028}px 'DM Sans', sans-serif`
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText(contact, width / 2, height * 0.92)
  }

  // 8. Badge de plataforma
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
  ctx.beginPath()
  ctx.roundRect(25, 25, width * 0.16, 40, 20)
  ctx.fill()
  ctx.fillStyle = '#FFFFFF'
  ctx.font = `bold ${width * 0.016}px 'DM Sans', sans-serif`
  ctx.textAlign = 'left'
  ctx.fillText('INSTAGRAM', 35, 52)

  return canvas.toDataURL('image/png')
}

// ============================================
// FUNCION PRINCIPAL
// ============================================

/**
 * Genera todos los flyers en los 3 estilos y 3 formatos
 */
export async function generateAllFlyers(
  imageSrc: string,
  title: string,
  price: string,
  options: {
    description?: string
    contact?: string
    improveImage?: boolean
  } = {}
): Promise<GeneratedFlyer[]> {
  const { description, contact, improveImage } = options

  // Obtener color dominante y generar paleta
  const dominant = await getDominantColor(imageSrc)
  const paleta = generatePalette(dominant)

  const flyerOptions: FlyerOptions = {
    image: imageSrc,
    title,
    price,
    description,
    contact,
    paleta,
    improveImage,
  }

  const results: GeneratedFlyer[] = []

  // Generar cada estilo
  const styles: Array<{ id: 'agresivo' | 'limpio' | 'instagram'; generator: typeof generateAgresivo }> = [
    { id: 'agresivo', generator: generateAgresivo },
    { id: 'limpio', generator: generateLimpio },
    { id: 'instagram', generator: generateInstagram },
  ]

  for (const style of styles) {
    for (const format of OUTPUT_FORMATS) {
      const dataUrl = await style.generator(imageSrc, flyerOptions, format.width, format.height)
      
      results.push({
        id: `${style.id}-${format.id}`,
        style: style.id,
        format: format.id,
        formatName: format.name,
        platform: format.platform,
        width: format.width,
        height: format.height,
        dataUrl,
      })
    }
  }

  return results
}

// ============================================
// HELPERS
// ============================================

function parseRgb(rgb: string): { r: number; g: number; b: number } {
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
  if (match) {
    return {
      r: parseInt(match[1]),
      g: parseInt(match[2]),
      b: parseInt(match[3]),
    }
  }
  return { r: 100, g: 100, b: 200 } // Default azul
}
