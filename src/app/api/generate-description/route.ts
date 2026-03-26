import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(request: Request) {
  try {
    const { producto, precio, categoria } = await request.json()

    if (!producto || !precio || !categoria) {
      return NextResponse.json(
        { error: 'Faltan datos requiredos: producto, precio y categoría' },
        { status: 400 }
      )
    }

    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API no configurada. Contactá al administrador.' },
        { status: 500 }
      )
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash-8b',
      generationConfig: {
        responseMimeType: 'text/plain',
      }
    })

    const prompt = `Escribí una descripción persuasiva para vender este producto en Argentina.

Producto: ${producto}
Precio: ${precio}
Categoría: ${categoria}

Requisitos:
- Tono informal argentino
- Máximo 80 palabras
- Incluir beneficios
- Incluir estado del producto (asumir buen estado)
- Incluir llamada a la acción tipo 'Escribime y coordinamos'
- Usar emojis relevantes
- Formato listo para Marketplace o Instagram`

    const result = await model.generateContent(prompt)
    const response = result.response.text()

    return NextResponse.json({ descripcion: response })
  } catch (error: unknown) {
    console.error('Error generating description:', error)

    // Check for specific error types
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      
      if (error.message.includes('API_KEY') || error.message.includes('quota') || error.message.includes('400')) {
        return NextResponse.json(
          { error: 'Límite alcanzado, probá más tarde' },
          { status: 429 }
        )
      }
      
      // Check for invalid API key
      if (error.message.includes('Invalid') || error.message.includes('PERMISSION_DENIED')) {
        return NextResponse.json(
          { error: 'API no configurada. Verificá la API key en Vercel.' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Error al generar descripción. Intentá de nuevo.' },
      { status: 500 }
    )
  }
}