/**
 * Flyer generado con los 3 estilos y 3 formatos
 */
export interface GeneratedFlyer {
  id: string
  style: 'agresivo' | 'limpio' | 'instagram'
  format: string
  formatName: string
  platform: string
  width: number
  height: number
  dataUrl: string
}

/**
 * Opciones para generar flyers
 */
export interface FlyerGenerationOptions {
  description?: string
  contact?: string
  improveImage?: boolean
}
