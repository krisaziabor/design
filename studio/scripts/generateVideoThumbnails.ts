import { createClient } from 'next-sanity'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const execAsync = promisify(exec)

// Load env variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SANITY_PROJECT_ID = process.env.SANITY_STUDIO_PROJECT_ID;
const SANITY_DATASET = process.env.SANITY_STUDIO_DATASET;
const SANITY_TOKEN = process.env.SANITY_API_TOKEN;

// Initialize Sanity client
const client = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  token: SANITY_TOKEN,
  useCdn: false,
  apiVersion: '2023-01-01',
})


interface Element {
  _id: string
  fileName: string
  fileType: string
  file?: {
    asset: {
      _ref: string
      url?: string
    }
  }
  thumbnail?: {
    asset: {
      _ref: string
    }
  }
}

// Create temp directory for thumbnails
const tempDir = path.join(__dirname, 'temp-thumbnails')

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true })
}

async function downloadVideo(videoUrl: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const command = `curl -L -o "${outputPath}" "${videoUrl}"`
    exec(command, (error) => {
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    })
  })
}

async function extractThumbnail(videoPath: string, thumbnailPath: string): Promise<void> {
  try {
    // Extract high-quality thumbnail from first frame with better quality settings
    const command = `ffmpeg -i "${videoPath}" -vframes 1 -q:v 1 -vf "scale=1280:720:force_original_aspect_ratio=decrease" -y "${thumbnailPath}"`
    await execAsync(command)
    console.log(`✅ Thumbnail extracted: ${thumbnailPath}`)
  } catch (error) {
    console.error(`❌ FFmpeg error:`, error)
    throw error
  }
}

async function uploadThumbnailToSanity(thumbnailPath: string, fileName: string): Promise<string> {
  try {
    const imageBuffer = fs.readFileSync(thumbnailPath)
    const asset = await client.assets.upload('image', imageBuffer, {
      filename: `${fileName}-thumbnail.jpg`
    })
    console.log(`✅ Thumbnail uploaded to Sanity: ${asset._id}`)
    return asset._id
  } catch (error) {
    console.error(`❌ Sanity upload error:`, error)
    throw error
  }
}

async function updateElementThumbnail(elementId: string, thumbnailAssetId: string): Promise<void> {
  try {
    await client
      .patch(elementId)
      .set({
        thumbnail: {
          _type: 'image',
          asset: {
            _type: 'reference',
            _ref: thumbnailAssetId
          }
        }
      })
      .commit()
    console.log(`✅ Element ${elementId} updated with thumbnail`)
  } catch (error) {
    console.error(`❌ Element update error:`, error)
    throw error
  }
}

async function getVideoUrl(fileRef: string): Promise<string> {
  // Extract the asset ID from the file reference
  const assetId = fileRef.replace('file-', '').split('-')[0]
  return `https://cdn.sanity.io/files/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${assetId}.mp4`
}

async function processVideoElement(element: Element, index: number, total: number): Promise<void> {
  if (!element.file?.asset?._ref) {
    console.log(`⚠️  Skipping ${element.fileName}: No file reference`)
    return
  }

  console.log(`\n🎥 Processing: ${element.fileName} (${index + 1}/${total})`)

  const videoPath = path.join(tempDir, `${element._id}.${element.fileType}`)
  const thumbnailPath = path.join(tempDir, `${element._id}-thumbnail.jpg`)

  try {
    // Get video URL
    const videoUrl = await getVideoUrl(element.file.asset._ref)
    
    // Download video temporarily
    console.log(`⬇️  Downloading video...`)
    await downloadVideo(videoUrl, videoPath)

    // Check if video file was downloaded successfully
    if (!fs.existsSync(videoPath) || fs.statSync(videoPath).size === 0) {
      throw new Error('Video download failed or file is empty')
    }

    console.log(`🖼️  Extracting thumbnail...`)
    await extractThumbnail(videoPath, thumbnailPath)

    // Check if thumbnail was created successfully
    if (!fs.existsSync(thumbnailPath) || fs.statSync(thumbnailPath).size === 0) {
      throw new Error('Thumbnail extraction failed')
    }

    console.log(`☁️  Uploading to Sanity...`)
    const thumbnailAssetId = await uploadThumbnailToSanity(thumbnailPath, element.fileName)

    console.log(`📝 Updating element...`)
    await updateElementThumbnail(element._id, thumbnailAssetId)

    console.log(`✅ Completed: ${element.fileName}`)
  } catch (error) {
    console.error(`❌ Failed to process ${element.fileName}:`, error)
  } finally {
    // Cleanup temp files
    try {
      if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath)
      if (fs.existsSync(thumbnailPath)) fs.unlinkSync(thumbnailPath)
    } catch (cleanupError) {
      console.warn(`⚠️  Cleanup warning:`, cleanupError)
    }
  }
}

async function main() {
  console.log('🚀 Starting video thumbnail generation...\n')

  try {
    // Check if FFmpeg is available
    await execAsync('ffmpeg -version')
    console.log('✅ FFmpeg is available\n')
  } catch (error) {
    console.error('❌ FFmpeg is not installed or not in PATH')
    console.error('Please install FFmpeg: https://ffmpeg.org/download.html')
    process.exit(1)
  }

  try {
    // Fetch all video elements that don't have thumbnails
    const query = `*[_type == "elements" && fileType in ["mov", "mp4", "avi", "mkv", "webm"] && !defined(thumbnail)] {
      _id,
      fileName,
      fileType,
      file,
      thumbnail
    }`

    const videoElements = await client.fetch<Element[]>(query)
    console.log(`📊 Found ${videoElements.length} videos without thumbnails\n`)

    if (videoElements.length === 0) {
      console.log('🎉 All videos already have thumbnails!')
      return
    }

    let successCount = 0
    let errorCount = 0

    // Process each video
    for (let i = 0; i < videoElements.length; i++) {
      const element = videoElements[i]
      try {
        await processVideoElement(element, i, videoElements.length)
        successCount++
      } catch (error) {
        console.error(`❌ Error processing ${element.fileName}:`, error)
        errorCount++
      }
      
      // Add delay to avoid overwhelming the API
      if (i < videoElements.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    console.log('\n📊 Summary:')
    console.log(`✅ Successfully processed: ${successCount}`)
    console.log(`❌ Errors: ${errorCount}`)
    console.log(`📁 Total videos: ${videoElements.length}`)
    
    if (successCount > 0) {
      console.log('\n🎉 Video thumbnail generation completed!')
    }
    
    // Cleanup temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true })
      console.log('🧹 Temporary files cleaned up')
    }

  } catch (error) {
    console.error('❌ Script failed:', error)
    process.exit(1)
  }
}

// Run script
main()