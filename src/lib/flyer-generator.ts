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
 * @param ctx - Contexto de canvas
 * @param text - Texto a dividir
 * @param maxWidth - Ancho máximo en píxeles
 * @param maxLines - Número máximo de líneas
 * @returns Array de líneas
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number = 3
): string[] {
  if (!text) return []
  
  // Dividir por palabras (respetando espacios)
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = words[0] || ''
  
  for (let i = 1; i < words.length; i++) {
    const word = words[i]
    const testLine = currentLine + ' ' + word
    const metrics = ctx.measureText(testLine)
    const testWidth = metrics.width
    
    if (testWidth > maxWidth && currentLine.length > 0) {
      lines.push(currentLine)
      currentLine = word
      
      // Si ya alcanzamos el máximo de líneas, salimos
      if (lines.length >= maxLines) {
        // Añadir "..." a la última línea si hay más texto
        const lastLine = lines[lines.length - 1]
        if (lastLine && i < words.length - 1) {
          // Truncar la última línea para agregar "..."
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
  
  // Agregar la última línea
  if (currentLine.length > 0 && lines.length < maxLines) {
    lines.push(currentLine)
  }
  
  return lines
}

/**
 * Dibuja texto con wrap en canvas, manejando correctamente el overflow
 */
function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number = 3,
  textAlign: CanvasTextAlign = 'left'
): number {
  if (!text) return y
  
  const originalAlign = ctx.textAlign
  ctx.textAlign = textAlign
  
  const lines = wrapText(ctx, text, maxWidth, maxLines)
  let currentY = y
  
  for (let i = 0; i < lines.length; i++) {
    let drawX = x
    if (textAlign === 'center') {
      drawX = x
    } else if (textAlign === 'right') {
      drawX = x
    }
    ctx.fillText(lines[i], drawX, currentY)
    currentY += lineHeight
  }
  
  ctx.textAlign = originalAlign
  return currentY
}

/**
 * Trunca texto a una sola línea con "..." si excede el ancho
 */
function truncateToWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string {
  if (!text) return ''
  
  let truncated = text
  let width = ctx.measureText(truncated).width
  
  if (width <= maxWidth) return text
  
  while (width > maxWidth && truncated.length > 3) {
    truncated = truncated.slice(0, -1)
    width = ctx.measureText(truncated + '...').width
  }
  
  return truncated + '...'
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
 * Dibuja un cuadro con texto con wrap automático y fondo
 */
function drawTextBox(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  boxWidth: number,
  boxHeight: number,
  bgColor: string,
  textColor: string,
  font: string,
  maxLines: number = 3,
  lineHeightMultiplier: number = 1.3
): void {
  if (!text) return
  
  // Guardar estado
  ctx.save()
  
  // Dibujar fondo del cuadro
  ctx.fillStyle = bgColor
  ctx.beginPath()
  ctx.roundRect(x, y - boxHeight * 0.7, boxWidth, boxHeight, 10)
  ctx.fill()
  
  // Configurar fuente y color
  ctx.font = font
  ctx.fillStyle = textColor
  ctx.textAlign = 'left'
  
  // Calcular line height basado en el tamaño de fuente
  const fontSize = parseInt(font.match(/\d+px/)?.[0] || '30px')
  const lineHeight = fontSize * lineHeightMultiplier
  
  // Calcular posición Y centrada verticalmente en el cuadro
  const lines = wrapText(ctx, text, boxWidth - 20, maxLines)
  const totalTextHeight = lines.length * lineHeight
  const startY = y - (totalTextHeight / 2) + (lineHeight / 2)
  
  // Dibujar cada línea
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], x + 15, startY + (i * lineHeight))
  }
  
  ctx.restore()
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

  // 2. Overlay oscuro
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
  ctx.fillRect(0, 0, width, height)

  // 3. Franja lateral de color
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

  // 6. PRECIO
  const priceY = height * 0.48
  const priceBoxHeight = height * 0.12
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'
  ctx.beginPath()
  ctx.roundRect(width * 0.05, priceY - priceBoxHeight * 0.8, width * 0.4, priceBoxHeight, 15)
  ctx.fill()
  
  ctx.font = `900 ${width * 0.16}px 'Outfit', sans-serif`
  ctx.fillStyle = '#00FF88'
  ctx.textAlign = 'left'
  const truncatedPrice = truncateToWidth(ctx, price, width * 0.35)
  ctx.fillText(truncatedPrice, width * 0.08, priceY)

  // 7. NOMBRE - usando drawTextBox
  const titleBoxWidth = width * 0.4
  const titleBoxHeight = height * 0.14
  const titleY = height * 0.62
  
  drawTextBox(
    ctx,
    title,
    width * 0.05,
    titleY,
    titleBoxWidth,
    titleBoxHeight,
    'rgba(0, 0, 0, 0.8)',
    '#FFFFFF',
    `bold ${width * 0.065}px 'Outfit', sans-serif`,
    3,
    1.2
  )

  // 8. DESCRIPCIÓN
  if (description) {
    const descBoxWidth = width * 0.4
    const descBoxHeight = height * 0.14
    const descY = height * 0.77
    
    drawTextBox(
      ctx,
      description,
      width * 0.05,
      descY,
      descBoxWidth,
      descBoxHeight,
      'rgba(0, 0, 0, 0.75)',
      'rgba(255, 255, 255, 0.95)',
      `${width * 0.032}px 'DM Sans', sans-serif`,
      3,
      1.3
    )
  }

  // 9. CONTACTO
  if (contact) {
    const contactBoxWidth = width * 0.4
    const contactBoxHeight = height * 0.09
    const contactY = height * 0.92
    
    drawTextBox(
      ctx,
      contact,
      width * 0.05,
      contactY,
      contactBoxWidth,
      contactBoxHeight,
      '#FF1744',
      '#FFFFFF',
      `bold ${width * 0.038}px 'DM Sans', sans-serif`,
      1,
      1.2
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
  const priceBoxHeight = height * 0.1
  
  ctx.fillStyle = mainColor
  ctx.beginPath()
  ctx.roundRect(width * 0.12, priceY - priceBoxHeight * 0.75, width * 0.35, priceBoxHeight, 12)
  ctx.fill()
  
  ctx.font = `900 ${width * 0.14}px 'Outfit', sans-serif`
  ctx.fillStyle = '#FFFFFF'
  ctx.textAlign = 'left'
  const truncatedPrice = truncateToWidth(ctx, price, width * 0.3)
  ctx.fillText(truncatedPrice, width * 0.15, priceY)

  // Título
  const titleBoxWidth = width * 0.35
  const titleBoxHeight = height * 0.12
  const titleY = height * 0.58
  
  drawTextBox(
    ctx,
    title,
    width * 0.12,
    titleY,
    titleBoxWidth,
    titleBoxHeight,
    'rgba(26, 26, 46, 0.95)',
    '#FFFFFF',
    `bold ${width * 0.07}px 'Outfit', sans-serif`,
    2,
    1.2
  )

  // Descripción
  if (description) {
    const descBoxWidth = width * 0.35
    const descBoxHeight = height * 0.1
    const descY = height * 0.71
    
    drawTextBox(
      ctx,
      description,
      width * 0.12,
      descY,
      descBoxWidth,
      descBoxHeight,
      'rgba(0, 0, 0, 0.08)',
      'rgba(0, 0, 0, 0.8)',
      `${width * 0.03}px 'DM Sans', sans-serif`,
      2,
      1.3
    )
  }

  // Contacto
  if (contact) {
    const contactBoxWidth = width * 0.35
    const contactBoxHeight = height * 0.09
    const contactY = height * 0.82
    
    drawTextBox(
      ctx,
      contact,
      width * 0.12,
      contactY,
      contactBoxWidth,
      contactBoxHeight,
      mainColor,
      '#FFFFFF',
      `bold ${width * 0.038}px 'DM Sans', sans-serif`,
      1,
      1.2
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
  ctx.font = `bold ${width * 0.055}px 'Outfit', sans-serif`
  ctx.fillStyle = '#FFFFFF'
  ctx.textAlign = 'center'
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
  ctx.shadowBlur = 10
  
  const titleLines = wrapText(ctx, title, width * 0.8, 2)
  const titleLineHeight = height * 0.065
  let titleY = height * 0.73
  
  for (let i = 0; i < titleLines.length; i++) {
    ctx.fillText(titleLines[i], width / 2, titleY)
    titleY += titleLineHeight
  }
  ctx.shadowBlur = 0

  // Precio
  ctx.font = `bold ${width * 0.09}px 'Outfit', sans-serif`
  ctx.fillStyle = '#00D9A5'
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'
  ctx.shadowBlur = 15
  const truncatedPrice = truncateToWidth(ctx, price, width * 0.7)
  ctx.fillText(truncatedPrice, width / 2, height * 0.83)
  ctx.shadowBlur = 0

  // Descripción
  if (description) {
    ctx.font = `${width * 0.026}px 'DM Sans', sans-serif`
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
    ctx.textAlign = 'center'
    
    const descLines = wrapText(ctx, description, width * 0.85, 2)
    let descY = height * 0.89
    
    for (let i = 0; i < descLines.length; i++) {
      ctx.fillText(descLines[i], width / 2, descY)
      descY += height * 0.035
    }
  }

  // Contacto
  if (contact) {
    ctx.font = `bold ${width * 0.028}px 'DM Sans', sans-serif`
    ctx.fillStyle = '#FFFFFF'
    ctx.textAlign = 'center'
    const truncatedContact = truncateToWidth(ctx, contact, width * 0.85)
    ctx.fillText(truncatedContact, width / 2, height * 0.94)
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
