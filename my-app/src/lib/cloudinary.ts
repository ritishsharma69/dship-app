/**
 * Cloudinary Image Optimization Utility
 * 
 * Transforms Cloudinary URLs to add optimizations:
 * - f_auto: Auto format (WebP/AVIF based on browser)
 * - q_auto: Auto quality compression
 * - w_XXX: Resize to specified width
 */

type ImageSize = 'thumb' | 'card' | 'product' | 'full'

const SIZE_MAP: Record<ImageSize, number> = {
  thumb: 100,    // Thumbnails, dots
  card: 400,     // Product cards on homepage
  product: 800,  // Product detail page
  full: 1200,    // Lightbox / zoom
}

/**
 * Optimize a Cloudinary image URL
 * 
 * @param url - Original Cloudinary URL
 * @param size - Preset size or custom width number
 * @returns Optimized URL with transformations
 * 
 * @example
 * optimizeImage(url, 'card')  // 400px wide, auto format/quality
 * optimizeImage(url, 600)     // 600px wide, auto format/quality
 */
export function optimizeImage(url: string | undefined, size: ImageSize | number = 'card'): string {
  if (!url) return ''
  
  // Only transform Cloudinary URLs
  if (!url.includes('res.cloudinary.com')) {
    return url
  }
  
  // Check if already has transformations
  if (url.includes('/f_auto') || url.includes('/q_auto') || url.includes('/w_')) {
    return url
  }
  
  const width = typeof size === 'number' ? size : SIZE_MAP[size]
  const transforms = `f_auto,q_auto,w_${width}`
  
  // Insert transforms after /upload/
  // URL format: https://res.cloudinary.com/xxx/image/upload/v123/folder/image.png
  const uploadIndex = url.indexOf('/upload/')
  if (uploadIndex === -1) return url
  
  const before = url.slice(0, uploadIndex + 8) // includes '/upload/'
  const after = url.slice(uploadIndex + 8)
  
  return `${before}${transforms}/${after}`
}

/**
 * Shorthand for common sizes
 */
export const img = {
  thumb: (url?: string) => optimizeImage(url, 'thumb'),
  card: (url?: string) => optimizeImage(url, 'card'),
  product: (url?: string) => optimizeImage(url, 'product'),
  full: (url?: string) => optimizeImage(url, 'full'),
}

export default optimizeImage

