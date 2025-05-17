const path = require('path')
const { createClient } = require('@sanity/client')

// Debug environment variables
console.log('Current directory:', __dirname)
console.log('Parent directory:', path.resolve(__dirname, '..'))

// Load environment variables from parent directory
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

// Debug environment variables again after loading
console.log('\nEnvironment variables after loading .env:')
console.log('SANITY_STUDIO_PROJECT_ID:', process.env.SANITY_STUDIO_PROJECT_ID)
console.log('SANITY_STUDIO_DATASET:', process.env.SANITY_STUDIO_DATASET)
console.log('SANITY_API_VERSION:', process.env.SANITY_API_VERSION)
console.log('SANITY_API_TOKEN exists:', !!process.env.SANITY_API_TOKEN)

const client = createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID,
  dataset: process.env.SANITY_STUDIO_DATASET,
  apiVersion: process.env.SANITY_API_VERSION,
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
})

async function createSampleData() {
  try {
    // Create categories
    const categories = await Promise.all([
      client.create({
        _type: 'category',
        name: 'UI Design',
        description: 'User interface design elements'
      }),
      client.create({
        _type: 'category',
        name: 'Typography',
        description: 'Typography and font inspirations'
      }),
      client.create({
        _type: 'category',
        name: 'Color Palettes',
        description: 'Color scheme inspirations'
      })
    ])

    console.log('Created categories:', categories.map(c => c.name))

    // Create projects
    const projects = await Promise.all([
      client.create({
        _type: 'project',
        name: 'Portfolio Website',
        description: 'Personal portfolio website redesign'
      }),
      client.create({
        _type: 'project',
        name: 'Mobile App UI',
        description: 'Mobile application interface design'
      })
    ])

    console.log('Created projects:', projects.map(p => p.name))

    // Create elements without file references for now
    const inspirations = await Promise.all([
      client.create({
        _type: 'elements',
        fileName: 'Modern Dashboard UI',
        fileType: 'image/png',
        colors: ['#2D3436', '#0984E3', '#00B894'],
        mainCategory: {
          _type: 'reference',
          _ref: categories[0]._id
        },
        tags: ['dashboard', 'modern', 'clean'],
        comments: ['Great use of white space', 'Love the color scheme'],
        dateAdded: new Date().toISOString()
      }),
      client.create({
        _type: 'elements',
        fileName: 'Bold Typography Example',
        fileType: 'image/jpeg',
        colors: ['#000000', '#FFFFFF', '#FF0000'],
        mainCategory: {
          _type: 'reference',
          _ref: categories[1]._id
        },
        tags: ['bold', 'typography', 'contrast'],
        comments: ['Strong visual hierarchy', 'Perfect for headlines'],
        dateAdded: new Date().toISOString()
      })
    ])

    console.log('Created inspirations:', inspirations.map(i => i.fileName))

    // Update projects with references to inspirations
    await Promise.all([
      client
        .patch(projects[0]._id)
        .set({
          inspirations: [
            {
              _type: 'reference',
              _ref: inspirations[0]._id
            }
          ]
        })
        .commit(),
      client
        .patch(projects[1]._id)
        .set({
          inspirations: [
            {
              _type: 'reference',
              _ref: inspirations[1]._id
            }
          ]
        })
        .commit()
    ])

    console.log('Updated projects with inspiration references')
    console.log('Sample data created successfully!')
  } catch (error) {
    console.error('Error creating sample data:', error)
  }
}

createSampleData() 