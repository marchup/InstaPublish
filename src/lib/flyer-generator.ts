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
  const { mainColor } = paleta

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo crear el contexto')

  // 1. Fondo con blur fuerte
  const blurAmount = height * 0.08
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

  // 2. Overlay oscuro fuerte (50% opacidad)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
  ctx.fillRect(0, 0, width, height)

  // 3. Franja lateral de color (mainColor)
  const stripeWidth = width * 0.12
  ctx.fillStyle = mainColor
  ctx.fillRect(0, 0, stripeWidth, height)

  // 4. Barra roja decorativa
  ctx.fillStyle = '#FF1744'
  ctx.fillRect(stripeWidth, 0, width * 0.03, height)

  // 5. Imagen del producto (lado derecho, más pequeña)
  const imgSize = Math.min(width, height) * 0.45
  const productImg = new Image()
  productImg.crossOrigin = 'anonymous'
  
  await new Promise<void>((resolve) => {
    productImg.onload = () => {
      const scale = Math.max(imgSize / productImg.width, imgSize / productImg.height)
      const w = productImg.width * scale
      const h = productImg.height * scale
      const x = width * 0.55 - w / 2
      const y = height * 0.35 - h / 2

      if (improveImage) {
        ctx.filter = 'brightness(1.15) contrast(1.25) saturate(1.3)'
      }

      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
      ctx.shadowBlur = 40
      ctx.shadowOffsetX = 5
      ctx.shadowOffsetY = 15
      
      ctx.drawImage(productImg, x, y, w, h)
      ctx.filter = 'none'
      ctx.shadowBlur = 0
      resolve()
    }
    productImg.src = imageSrc
  })

  // 6. PRECIO - ENORME Y IMPACTANTE (verde neón)
  ctx.font = `900 ${width * 0.18}px 'Outfit', sans-serif`
  ctx.fillStyle = '#00FF88'
  ctx.textAlign = 'left'
  ctx.shadowColor = 'rgba(0, 0, 0, 1)'
  ctx.shadowBlur = 30
  ctx.shadowOffsetX = 3
  ctx.shadowOffsetY = 3
  ctx.fillText(price, width * 0.08, height * 0.55)
  ctx.shadowBlur = 0

  // 7. NOMBRE - grande y visible
  ctx.font = `bold ${width * 0.08}px 'Outfit', sans-serif`
  ctx.fillStyle = '#FFFFFF'
  ctx.textAlign = 'left'
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
  ctx.shadowBlur = 20
  const titleText = title.length > 25 ? title.substring(0, 25) + '...' : title
  ctx.fillText(titleText, width * 0.08, height * 0.68)
  ctx.shadowBlur = 0

  // 8. DESCRIPCIÓN si existe
  if (description) {
    ctx.font = `${width * 0.035}px 'DM Sans', sans-serif`
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
    ctx.textAlign = 'left'
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)'
    ctx.shadowBlur = 15
    const descText = description.length > 60 ? description.substring(0, 60) + '...' : description
    ctx.fillText(descText, width * 0.08, height * 0.76)
    ctx.shadowBlur = 0
  }

  // 9. CONTACTO si existe
  if (contact) {
    ctx.font = `bold ${width * 0.04}px 'DM Sans', sans-serif`
    ctx.fillStyle = '#00FF88'
    ctx.textAlign = 'left'
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
    ctx.shadowBlur = 15
    ctx.fillText(contact, width * 0.08, height * 0.84)
    ctx.shadowBlur = 0
  }

  // 10. Badge de plataforma
  ctx.fillStyle = '#FF1744'
  ctx.beginPath()
  ctx.roundRect(width * 0.08, height * 0.05, width * 0.18, 50, 25)
  ctx.fill()
  ctx.fillStyle = '#FFFFFF'
  ctx.font = `bold ${width * 0.022}px 'Outfit', sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText('AGRESIVO', width * 0.17, height * 0.085)

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
  const { mainColor, darkColor } = paleta

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo crear el contexto')

  // 1. Fondo blanco puro
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, width, height)

  // 2. Barra lateral de color (mainColor)
  const barWidth = width * 0.08
  ctx.fillStyle = mainColor
  ctx.fillRect(0, 0, barWidth, height)

  // 3. Imagen del producto (lado derecho, más pequeña)
  const imgSize = Math.min(width, height) * 0.48
  const productImg = new Image()
  productImg.crossOrigin = 'anonymous'
  
  await new Promise<void>((resolve) => {
    productImg.onload = () => {
      const scale = Math.max(imgSize / productImg.width, imgSize / productImg.height)
      const w = productImg.width * scale
      const h = productImg.height * scale
      const x = width * 0.65 - w / 2
      const y = height * 0.35 - h / 2

      if (improveImage) {
        ctx.filter = 'brightness(1.1) contrast(1.2) saturate(1.2)'
      }

      // Sombra sutil
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)'
      ctx.shadowBlur = 20
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 8
      
      ctx.drawImage(productImg, x, y, w, h)
      ctx.filter = 'none'
      ctx.shadowBlur = 0
      resolve()
    }
    productImg.src = imageSrc
  })

  // 4. PRECIO - GRANDE Y DESTACADO
  ctx.font = `900 ${width * 0.16}px 'Outfit', sans-serif`
  ctx.fillStyle = mainColor
  ctx.textAlign = 'left'
  ctx.fillText(price, width * 0.12, height * 0.45)

  // 5. NOMBRE - grande y visible
  ctx.font = `bold ${width * 0.075}px 'Outfit', sans-serif`
  ctx.fillStyle = '#1A1A2E'
  ctx.textAlign = 'left'
  const titleText = title.length > 28 ? title.substring(0, 28) + '...' : title
  ctx.fillText(titleText, width * 0.12, height * 0.58)

  // 6. DESCRIPCIÓN si existe
  if (description) {
    ctx.font = `${width * 0.032}px 'DM Sans', sans-serif`
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
    ctx.textAlign = 'left'
    const descText = description.length > 70 ? description.substring(0, 70) + '...' : description
    ctx.fillText(descText, width * 0.12, height * 0.66)
  }

  // 7. CONTACTO si existe
  if (contact) {
    ctx.font = `bold ${width * 0.038}px 'DM Sans', sans-serif`
    ctx.fillStyle = mainColor
    ctx.textAlign = 'left'
    ctx.fillText(contact, width * 0.12, height * 0.75)
  }

  // 8. Badge de plataforma
  ctx.fillStyle = mainColor
  ctx.beginPath()
  ctx.roundRect(width * 0.12, height * 0.05, width * 0.15, 45, 22)
  ctx.fill()
  ctx.fillStyle = '#FFFFFF'
  ctx.font = `bold ${width * 0.02}px 'Outfit', sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText('LIMPIO', width * 0.195, height * 0.082)

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
