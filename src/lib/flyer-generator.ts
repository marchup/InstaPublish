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

      const sampleSize = 50
      canvas.width = sampleSize
      canvas.height = sampleSize
      ctx.drawImage(img, 0, 0, sampleSize, sampleSize)

      const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize)
      const data = imageData.data

      let r = 0, g = 0, b = 0, count = 0

      for (let i = 0; i < data.length; i += 4) {
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

  const mainColor = `rgb(${r}, ${g}, ${b})`
  const darkR = Math.round(r * 0.7)
  const darkG = Math.round(g * 0.7)
  const darkB = Math.round(b * 0.7)
  const darkColor = `rgb(${darkR}, ${darkG}, ${darkB})`
  const lightR = Math.round(r + (255 - r) * 0.6)
  const lightG = Math.round(g + (255 - g) * 0.6)
  const lightB = Math.round(b + (255 - b) * 0.6)
  const lightColor = `rgb(${lightR}, ${lightG}, ${lightB})`
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

      const scale = Math.max(targetWidth / img.width, targetHeight / img.height)
      const w = img.width * scale
      const h = img.height * scale
      const x = (targetWidth - w) / 2
      const y = (targetHeight - h) / 2

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
// UTILIDADES DE TEXTO CON WRAP CORRECTAS
// ============================================

/**
 * Divide texto en líneas respetando palabras completas
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number = 5
): string[] {
  if (!text || text.trim() === '') return []
  
  const cleanText = text.trim().replace(/\s+/g, ' ')
  const words = cleanText.split(' ')
  const lines: string[] = []
  let currentLine = ''
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i]
    const testLine = currentLine ? `${currentLine} ${word}` : word
    const metrics = ctx.measureText(testLine)
    
    if (metrics.width > maxWidth && currentLine.length > 0) {
      lines.push(currentLine)
      currentLine = word
      
      if (lines.length >= maxLines) {
        const lastLine = lines[lines.length - 1]
        if (lastLine && i < words.length - 1) {
          let truncated = lastLine
          while (ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 0) {
            truncated = truncated.slice(0, -1)
          }
          lines[lines.length - 1] = truncated + '...'
        }
        return lines
      }
    } else {
      currentLine = testLine
    }
  }
  
  if (currentLine.length > 0 && lines.length < maxLines) {
    lines.push(currentLine)
  }
  
  return lines
}

/**
 * Dibuja un cuadro con texto que se auto-ajusta al tamaño
 */
function drawAdaptiveTextBox(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  boxWidth: number,
  boxHeight: number,
  bgColor: string,
  textColor: string,
  baseFontSize: number,
  maxLines: number = 3,
  minFontSize: number = 12
): void {
  if (!text) return
  
  ctx.save()
  
  // Dibujar fondo
  ctx.fillStyle = bgColor
  ctx.beginPath()
  ctx.roundRect(x, y - boxHeight / 2, boxWidth, boxHeight, 12)
  ctx.fill()
  
  ctx.fillStyle = textColor
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  
  const padding = 20
  let fontSize = baseFontSize
  let lines: string[] = []
  let fits = false
  
  while (fontSize >= minFontSize && !fits) {
    ctx.font = `bold ${fontSize}px 'Outfit', sans-serif`
    lines = wrapText(ctx, text, boxWidth - padding, maxLines)
    
    const lineHeight = fontSize * 1.2
    const totalHeight = lines.length * lineHeight
    
    if (totalHeight <= boxHeight - padding) {
      fits = true
    } else {
      fontSize -= 2
    }
  }
  
  const lineHeight = fontSize * 1.2
  const startY = y - ((lines.length - 1) * lineHeight) / 2
  
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], x + 15, startY + (i * lineHeight))
  }
  
  ctx.restore()
}

/**
 * Dibuja un cuadro para texto de una sola línea (contacto, precio)
 */
function drawSingleLineBox(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  boxWidth: number,
  boxHeight: number,
  bgColor: string,
  textColor: string,
  baseFontSize: number
): void {
  if (!text) return
  
  ctx.save()
  
  // Dibujar fondo
  ctx.fillStyle = bgColor
  ctx.beginPath()
  ctx.roundRect(x, y - boxHeight / 2, boxWidth, boxHeight, 12)
  ctx.fill()
  
  ctx.fillStyle = textColor
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  
  let fontSize = baseFontSize
  let textWidth = ctx.measureText(text).width
  
  while (textWidth > boxWidth - 30 && fontSize > 12) {
    fontSize -= 2
    ctx.font = `bold ${fontSize}px 'DM Sans', sans-serif`
    textWidth = ctx.measureText(text).width
  }
  
  ctx.font = `bold ${fontSize}px 'DM Sans', sans-serif`
  ctx.fillText(text, x + 15, y)
  
  ctx.restore()
}

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

  // 1. Fondo con blur
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

  // 2. Overlay oscuro
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
  ctx.fillRect(0, 0, width, height)

  // 3. Franja lateral
  const stripeWidth = width * 0.12
  ctx.fillStyle = mainColor
  ctx.fillRect(0, 0, stripeWidth, height)

  // 4. Barra decorativa
  ctx.fillStyle = '#FF1744'
  ctx.fillRect(stripeWidth, 0, width * 0.03, height)

  // 5. Imagen del producto
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

  // 6. PRECIO - con ajuste automático de tamaño
  const priceY = height * 0.48
  const priceBoxWidth = width * 0.4
  const priceBoxHeight = height * 0.1
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'
  ctx.beginPath()
  ctx.roundRect(width * 0.05, priceY - priceBoxHeight / 2, priceBoxWidth, priceBoxHeight, 15)
  ctx.fill()
  
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  
  let priceFontSize = width * 0.12
  let priceText = price
  ctx.font = `900 ${priceFontSize}px 'Outfit', sans-serif`
  let priceWidth = ctx.measureText(priceText).width
  
  while (priceWidth > priceBoxWidth - 30 && priceFontSize > 20) {
    priceFontSize -= 4
    ctx.font = `900 ${priceFontSize}px 'Outfit', sans-serif`
    priceWidth = ctx.measureText(priceText).width
  }
  
  ctx.fillStyle = '#00FF88'
  ctx.fillText(priceText, width * 0.08, priceY)

  // 7. NOMBRE
  const titleBoxWidth = width * 0.4
  const titleBoxHeight = height * 0.14
  const titleY = height * 0.62
  
  drawAdaptiveTextBox(
    ctx,
    title,
    width * 0.05,
    titleY,
    titleBoxWidth,
    titleBoxHeight,
    'rgba(0, 0, 0, 0.8)',
    '#FFFFFF',
    width * 0.065,
    3,
    18
  )

  // 8. DESCRIPCIÓN
  if (description) {
    const descBoxWidth = width * 0.4
    const descBoxHeight = height * 0.15
    const descY = height * 0.77
    
    drawAdaptiveTextBox(
      ctx,
      description,
      width * 0.05,
      descY,
      descBoxWidth,
      descBoxHeight,
      'rgba(0, 0, 0, 0.75)',
      'rgba(255, 255, 255, 0.95)',
      width * 0.032,
      4,
      12
    )
  }

  // 9. CONTACTO
  if (contact) {
    const contactBoxWidth = width * 0.4
    const contactBoxHeight = height * 0.08
    const contactY = height * 0.93
    
    drawSingleLineBox(
      ctx,
      contact,
      width * 0.05,
      contactY,
      contactBoxWidth,
      contactBoxHeight,
      '#FF1744',
      '#FFFFFF',
      width * 0.038
    )
  }

  // 10. Badge
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
 * ESTILO LIMPIO: fondo claro, diseño minimalista
 */
export async function generateLimpio(
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

  // Fondo blanco
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, width, height)

  // Barra lateral
  const barWidth = width * 0.08
  ctx.fillStyle = mainColor
  ctx.fillRect(0, 0, barWidth, height)

  // Imagen del producto
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

  // Precio
  const priceY = height * 0.42
  const priceBoxWidth = width * 0.35
  const priceBoxHeight = height * 0.1
  
  ctx.fillStyle = mainColor
  ctx.beginPath()
  ctx.roundRect(width * 0.12, priceY - priceBoxHeight / 2, priceBoxWidth, priceBoxHeight, 12)
  ctx.fill()
  
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  
  let priceFontSize = width * 0.12
  let priceText = price
  ctx.font = `900 ${priceFontSize}px 'Outfit', sans-serif`
  let priceWidth = ctx.measureText(priceText).width
  
  while (priceWidth > priceBoxWidth - 30 && priceFontSize > 20) {
    priceFontSize -= 4
    ctx.font = `900 ${priceFontSize}px 'Outfit', sans-serif`
    priceWidth = ctx.measureText(priceText).width
  }
  
  ctx.fillStyle = '#FFFFFF'
  ctx.fillText(priceText, width * 0.15, priceY)

  // Título
  const titleBoxWidth = width * 0.35
  const titleBoxHeight = height * 0.12
  const titleY = height * 0.58
  
  drawAdaptiveTextBox(
    ctx,
    title,
    width * 0.12,
    titleY,
    titleBoxWidth,
    titleBoxHeight,
    'rgba(26, 26, 46, 0.95)',
    '#FFFFFF',
    width * 0.07,
    2,
    18
  )

  // Descripción
  if (description) {
    const descBoxWidth = width * 0.35
    const descBoxHeight = height * 0.12
    const descY = height * 0.71
    
    drawAdaptiveTextBox(
      ctx,
      description,
      width * 0.12,
      descY,
      descBoxWidth,
      descBoxHeight,
      'rgba(0, 0, 0, 0.08)',
      'rgba(0, 0, 0, 0.8)',
      width * 0.03,
      3,
      12
    )
  }

  // Contacto
  if (contact) {
    const contactBoxWidth = width * 0.35
    const contactBoxHeight = height * 0.08
    const contactY = height * 0.84
    
    drawSingleLineBox(
      ctx,
      contact,
      width * 0.12,
      contactY,
      contactBoxWidth,
      contactBoxHeight,
      mainColor,
      '#FFFFFF',
      width * 0.038
    )
  }

  // Badge
  ctx.fillStyle = mainColor
  ctx.beginPath()
  ctx.roundRect(width * 0.12, height * 0.05, width * 0.12, 45, 22)
  ctx.fill()
  ctx.fillStyle = '#FFFFFF'
  ctx.font = `bold ${width * 0.02}px 'Outfit', sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText('LIMPIO', width * 0.18, height * 0.082)

  return canvas.toDataURL('image/png')
}

/**
 * ESTILO INSTAGRAM: degradado
 */
export async function generateInstagram(
  imageSrc: string,
  options: FlyerOptions,
  width: number,
  height: number
): Promise<string> {
  const { title, price, description, contact, paleta, improveImage } = options
  const { mainColor } = paleta
  const { r, g, b } = parseRgb(mainColor)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo crear el contexto')

  // Gradiente de fondo
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.9)`)
  gradient.addColorStop(0.5, `rgba(${Math.round(r * 0.8)}, ${Math.round(g * 0.8)}, ${Math.round(b * 0.8)}, 0.95)`)
  gradient.addColorStop(1, `rgba(${Math.round(r * 0.6)}, ${Math.round(g * 0.6)}, ${Math.round(b * 0.6)}, 1)`)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  // Glow
  const glowGradient = ctx.createRadialGradient(width / 2, height * 0.4, 0, width / 2, height * 0.4, width * 0.5)
  glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)')
  glowGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)')
  glowGradient.addColorStop(1, 'transparent')
  ctx.fillStyle = glowGradient
  ctx.fillRect(0, 0, width, height)

  // Imagen del producto
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

      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
      ctx.shadowBlur = 25
      ctx.shadowOffsetY = 15
      
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

  // Título (centrado)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
  ctx.shadowBlur = 10
  
  let titleFontSize = width * 0.055
  let titleLines: string[] = []
  let fits = false
  
  while (titleFontSize > 24 && !fits) {
    ctx.font = `bold ${titleFontSize}px 'Outfit', sans-serif`
    titleLines = wrapText(ctx, title, width * 0.8, 2)
    const lineHeight = titleFontSize * 1.2
    const totalHeight = titleLines.length * lineHeight
    
    if (totalHeight <= height * 0.12) {
      fits = true
    } else {
      titleFontSize -= 2
    }
  }
  
  let titleY = height * 0.73
  const titleLineHeight = titleFontSize * 1.2
  const titleStartY = titleY - ((titleLines.length - 1) * titleLineHeight) / 2
  
  for (let i = 0; i < titleLines.length; i++) {
    ctx.fillText(titleLines[i], width / 2, titleStartY + (i * titleLineHeight))
  }
  ctx.shadowBlur = 0

  // Precio
  const priceY = height * 0.83
  let priceFontSize = width * 0.09
  let priceText = price
  ctx.font = `bold ${priceFontSize}px 'Outfit', sans-serif`
  let priceWidth = ctx.measureText(priceText).width
  
  while (priceWidth > width * 0.7 && priceFontSize > 24) {
    priceFontSize -= 4
    ctx.font = `bold ${priceFontSize}px 'Outfit', sans-serif`
    priceWidth = ctx.measureText(priceText).width
  }
  
  ctx.fillStyle = '#00D9A5'
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'
  ctx.shadowBlur = 15
  ctx.fillText(priceText, width / 2, priceY)
  ctx.shadowBlur = 0

  // Descripción
  if (description) {
    let descFontSize = width * 0.026
    ctx.font = `${descFontSize}px 'DM Sans', sans-serif`
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
    
    let descLines = wrapText(ctx, description, width * 0.85, 2)
    let descY = height * 0.89
    
    for (let i = 0; i < descLines.length; i++) {
      ctx.fillText(descLines[i], width / 2, descY)
      descY += height * 0.035
    }
  }

  // Contacto
  if (contact) {
    let contactFontSize = width * 0.028
    ctx.font = `bold ${contactFontSize}px 'DM Sans', sans-serif`
    ctx.fillStyle = '#FFFFFF'
    
    let contactText = contact
    let contactWidth = ctx.measureText(contactText).width
    
    while (contactWidth > width * 0.85 && contactFontSize > 16) {
      contactFontSize -= 2
      ctx.font = `bold ${contactFontSize}px 'DM Sans', sans-serif`
      contactWidth = ctx.measureText(contactText).width
    }
    
    ctx.fillText(contactText, width / 2, height * 0.94)
  }

  // Badge
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
  return { r: 100, g: 100, b: 200 }
}

// Extensión de CanvasRenderingContext2D para roundRect
declare global {
  interface CanvasRenderingContext2D {
    roundRect(x: number, y: number, w: number, h: number, r: number): void
  }
}

if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    if (w < 2 * r) r = w / 2
    if (h < 2 * r) r = h / 2
    this.moveTo(x+r, y)
    this.lineTo(x+w-r, y)
    this.quadraticCurveTo(x+w, y, x+w, y+r)
    this.lineTo(x+w, y+h-r)
    this.quadraticCurveTo(x+w, y+h, x+w-r, y+h)
    this.lineTo(x+r, y+h)
    this.quadraticCurveTo(x, y+h, x, y+h-r)
    this.lineTo(x, y+r)
    this.quadraticCurveTo(x, y, x+r, y)
    return this
  }
}
