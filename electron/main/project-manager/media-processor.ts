import path from 'node:path'
import fs from 'node:fs/promises'
import { app } from 'electron'
import sharp from 'sharp'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import { logger } from '../logger'

// Set ffmpeg path
try {
  let ffmpegPath = ffmpegInstaller.path
  if (app.isPackaged) {
    // In production, the binary is unpacked to app.asar.unpacked
    ffmpegPath = ffmpegPath.replace('app.asar', 'app.asar.unpacked')
  }
  logger.info(`Setting ffmpeg path to: ${ffmpegPath}`)
  ffmpeg.setFfmpegPath(ffmpegPath)
} catch (error) {
  logger.error(`Failed to set ffmpeg path: ${error}`)
}

/**
 * Detect media type based on file extension
 * @param filePath - Path to the media file
 * @returns 'image' or 'video'
 */
export function getMediaType(filePath: string): 'image' | 'video' {
  const ext = path.extname(filePath).toLowerCase()
  const videoExtensions = ['.mp4', '.webm', '.ogv', '.mov', '.avi']
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']
  
  if (videoExtensions.includes(ext)) {
    return 'video'
  }
  return 'image' // Default to image for backward compatibility
}

/**
 * Generate a thumbnail from an image file
 * @param sourcePath - Path to the source image
 * @param destPath - Path where thumbnail should be saved
 * @param width - Target width in pixels (height will be calculated to maintain aspect ratio)
 * @returns Path to the generated thumbnail
 */
export async function generateThumbnail(
  sourcePath: string, 
  destPath: string, 
  width: number = 400
): Promise<string> {
  try {
    await sharp(sourcePath)
      .resize(width, null, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 80 })
      .toFile(destPath)
    
    return destPath
  } catch (error) {
    console.error('Failed to generate thumbnail:', error)
    throw error
  }
}

/**
 * Generate a thumbnail from a video file
 * @param sourcePath - Path to the source video
 * @param destPath - Path where thumbnail should be saved
 * @param width - Target width in pixels
 * @returns Path to the generated thumbnail
 */
export async function generateVideoThumbnail(
  sourcePath: string,
  destPath: string,
  width: number = 400
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Create a temporary file for the extracted frame
    const tempFramePath = destPath.replace('.jpg', '_temp.jpg')
    
    ffmpeg(sourcePath)
      .screenshots({
        timestamps: ['1'], // Extract frame at 1 second
        filename: path.basename(tempFramePath),
        folder: path.dirname(tempFramePath),
        size: `${width}x?` // Width x auto-height to maintain aspect ratio
      })
      .on('end', async () => {
        try {
          // Use sharp to ensure consistent quality and format
          await sharp(tempFramePath)
            .jpeg({ quality: 80 })
            .toFile(destPath)
          
          // Clean up temp file
          await fs.unlink(tempFramePath).catch(() => {})
          
          resolve(destPath)
        } catch (error) {
          reject(error)
        }
      })
      .on('error', (error) => {
        reject(error)
      })
  })
}
