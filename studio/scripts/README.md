# Studio Scripts

This directory contains utility scripts for managing your Sanity Studio.

## Video Thumbnail Generation

The `generateVideoThumbnails.ts` script automatically extracts the first frame from videos in your Sanity CMS and sets them as thumbnails.

### Prerequisites

1. **FFmpeg**: Must be installed and available in your PATH
   - macOS: `brew install ffmpeg`
   - Ubuntu/Debian: `sudo apt install ffmpeg`
   - Windows: Download from https://ffmpeg.org/download.html

2. **Environment Variables**: Make sure these are set in your `.env` file:
   ```
   NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
   NEXT_PUBLIC_SANITY_DATASET=production
   SANITY_API_WRITE_TOKEN=your_write_token
   ```

### Usage

Run the script from the studio directory:

```bash
npm run generate-thumbnails
```

Or directly with ts-node:

```bash
npx ts-node --esm scripts/generateVideoThumbnails.ts
```

### What it does

1. Fetches all video elements (mp4, mov, avi, mkv, webm) that don't have thumbnails
2. Downloads each video temporarily
3. Extracts the first frame using FFmpeg
4. Uploads the thumbnail to Sanity
5. Updates the element with the thumbnail reference
6. Cleans up temporary files

### Features

- ✅ Progress tracking with success/error counts
- ✅ Better error handling and file validation
- ✅ Automatic cleanup of temporary files
- ✅ Rate limiting to avoid API overload
- ✅ Support for multiple video formats
- ✅ High-quality thumbnail extraction (1280x720, maintaining aspect ratio)

### Troubleshooting

- **FFmpeg not found**: Install FFmpeg and ensure it's in your PATH
- **Permission errors**: Make sure you have write permissions in the scripts directory
- **API errors**: Check your Sanity API token and project configuration
- **Download failures**: Verify video URLs are accessible and files exist in Sanity

### Output

The script will show:
- Number of videos found without thumbnails
- Progress for each video being processed
- Success/error counts
- Summary of results 