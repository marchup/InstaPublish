import { NextResponse } from 'next/server'

// Plantillas de descripción por categoría (sin API, 100% gratis)
const templates: Record<string, string[]> = {
  ropa: [
    "¡Increíble oportunidad! Esta {producto} está en excelente estado, listo para usar. Talle {talle}. No te lo pierdas, calidad y precio perfecto. Escribime y coordinamos la entrega 📦",
    "{producto} en muy buen estado, super cómoda y moderna. El talle es {talle}. Precio inmejorable! consulted por otros talles. Escribime y coordinamos 😊",
    "Excelente calidad! {producto} - estado como nuevo. {talle} disponible. Ideal para tu guardarropa. Envíos a todo el país. Escribime y coordinamos 🚚",
  ],
  muebles: [
    "¡Impecable! {producto} en perfecto estado, robusto y listo para usar. Ideal para tu hogar. Precio especial! No te quedes sin él. Escribime y coordinamos ✨",
    "{producto} en excelente estado, muy buena calidad. Perfecto para cualquier espacio. El precio incluye entrega en zona. Escribime y coordinamos 🏠",
    "¡ Oportunidad única! {producto} en muy buen estado, fuerte y duradero. Precio de/remate. Lo podés retirar o mandamos a tu casa. Escribime y coordinamos 📦",
  ],
  electronica: [
    "{producto} en perfecto funcionamiento! Probado y listo para usar. Precio promocional. No esperes más, stock limitado. Escribime y coordinamos 📱",
    "¡Excelente! {producto} funciona perfectamente, estado general muy bueno. Incluye accesorios. Precio inmejorable! Escribime y coordinamos 🔋",
    "{producto} en muy buen estado, funciona 100%. Ideal para uso diario. El mejor precio del mercado. Escribime y coordinamos 💡",
  ],
  otros: [
    "¡Muy buen estado! {producto} listo para usar. Precio especial! No te lo pierdas. Escribime y coordinamos la entrega 😊",
    "{producto} en excelente estado, funciona perfecto. Precio competitivo. Envíos a todo el país. Escribime y coordinamos 📦",
    "¡Impecable! {producto} en muy buen estado, como nuevo. Precio de/remate! No te quedes sin él. Escribime y coordinamos ✨",
  ],
}

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function formatDescription(template: string, producto: string, precio: string): string {
  // Agregar precio al template
  const priceFormatted = parseInt(precio.replace(/[^\d]/g, '')).toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  })

  return template
    .replace('{producto}', producto)
    .replace('{precio}', priceFormatted)
    .replace('{talle}', getRandomTalle())
}

function getRandomTalle(): string {
  const talles = ['S', 'M', 'L', 'XL', 'Único']
  return getRandomItem(talles)
}

export async function POST(request: Request) {
  try {
    const { producto, precio, categoria } = await request.json()

    if (!producto || !precio || !categoria) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos: producto, precio y categoría' },
        { status: 400 }
      )
    }

    // Obtener plantillas para la categoría
    const categoryTemplates = templates[categoria] || templates['otros']
    
    // Seleccionar plantilla aleatoria
    const template = getRandomItem(categoryTemplates)
    
    // Generar descripción
    const descripcion = formatDescription(template, producto, precio)

    return NextResponse.json({ descripcion })
  } catch (error) {
    console.error('Error generating description:', error)
    return NextResponse.json(
      { error: 'Error al generar descripción. Intentá de nuevo.' },
      { status: 500 }
    )
  }
}