export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg']

export const ACCEPTED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg']

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB (warning only)

export interface ValidationResult {
  valid: boolean
  error?: string
}

export function validateImageFile(file: File): ValidationResult {
  // Check file type by MIME type
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    // Fallback: check by extension
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!ext || !ACCEPTED_IMAGE_EXTENSIONS.includes(`.${ext}`)) {
      return {
        valid: false,
        error: 'Invalid file type. Please upload a JPG or JPEG image.'
      }
    }
  }

  // Check file size (warning, not blocking)
  if (file.size > MAX_IMAGE_SIZE) {
    console.warn('Large file detected:', (file.size / 1024 / 1024).toFixed(2), 'MB')
  }

  return { valid: true }
}
