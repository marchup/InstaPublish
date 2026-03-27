import { NextResponse } from 'next/server'

// Frases de engagement positivas (sin inventar características)
const engagement = [
  "¡No te lo pierdas!",
  "¡Última oportunidad!",
  "¡Precio mínimo!",
  "¡Buenísimo!",
  "¡Ideal para vos!",
  "¡No va a durar!",
  "¡Super oportunidad!",
]

// Llamados a acción (sin inventar envío)
const cta = [
  "Escribime y coordinamos",
  "Escribime por privado",
  "Contactame y acordamos",
  "Mandame un mensaje",
]

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function formatPrice(precio: string): string {
  const num = parseInt(precio.replace(/[^\d]/g, ''))
  return '$' + num.toLocaleString('es-AR', {
    minimumFractionDigits: 0,
  })
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export async function POST(request: Request) {
  try {
    const { producto, precio, categoria, descripcion } = await request.json()

    if (!producto || !precio || !categoria) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos: producto, precio y categoría' },
        { status: 400 }
      )
    }

    // Limpiar el producto (capitalizar, quitar espacios extra)
    const cleanProduct = capitalize(producto.trim())
    const formattedPrice = formatPrice(precio)
    
    // Si el usuario escribió algo, mejorarlo; si no, generar uno nuevo
    let finalDescripcion = ''
    
    if (descripcion && descripcion.trim().length > 0) {
      // Mejorar la descripción del usuario
      const userDesc = descripcion.trim()
      
      switch (categoria) {
        case 'ropa':
          finalDescripcion = `${getRandomItem(engagement)} ${cleanProduct}. ${userDesc}.
Talle disponible (consultame). ${formattedPrice}.
${getRandomItem(cta)} 💬`
          break
          
        case 'muebles':
          finalDescripcion = `${cleanProduct}. ${userDesc}.
${formattedPrice}.
Ideal para tu hogar. ${getRandomItem(cta)} 🏠`
          break
          
        case 'electronica':
          finalDescripcion = `${cleanProduct}. ${userDesc}.
${formattedPrice}.
${getRandomItem(cta)} 📱`
          break
          
        default:
          finalDescripcion = `${getRandomItem(engagement)} ${cleanProduct}. ${userDesc}.
${formattedPrice}.
${getRandomItem(cta)} ✨`
      }
    } else {
      // Generar descripción desde cero
      switch (categoria) {
        case 'ropa':
          finalDescripcion = `${getRandomItem(engagement)} ${cleanProduct} en muy buen estado.
Talle disponible (consultame). ${formattedPrice}.
${getRandomItem(cta)} 💬`
          break
          
        case 'muebles':
          finalDescripcion = `${cleanProduct} en muy buen estado.
${formattedPrice}.
Ideal para tu hogar. ${getRandomItem(cta)} 🏠`
          break
          
        case 'electronica':
          finalDescripcion = `${cleanProduct} en muy buen estado, funciona perfecto.
${formattedPrice}.
${getRandomItem(cta)} 📱`
          break
          
        default:
          finalDescripcion = `${getRandomItem(engagement)} ${cleanProduct} en muy buen estado.
${formattedPrice}.
${getRandomItem(cta)} ✨`
      }
    }

    return NextResponse.json({ descripcion: finalDescripcion })
  } catch (error) {
    console.error('Error generating description:', error)
    return NextResponse.json(
      { error: 'Error al generar. Intentá de nuevo.' },
      { status: 500 }
    )
  }
}