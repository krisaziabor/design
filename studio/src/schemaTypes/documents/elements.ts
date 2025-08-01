export default {
  name: 'elements',
  title: 'Elements',
  type: 'document',
  fields: [
    {
      name: 'fileName',
      title: 'File Name',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'fileType',
      title: 'File Type',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'eagleId',
      title: 'Eagle ID',
      type: 'string',
      description: 'ID of the element in Eagle',
      validation: Rule => Rule.required()
    },
    {
      name: 'thumbnail',
      title: 'Thumbnail',
      type: 'image',
      description: 'Thumbnail preview of the element'
    },
    {
      name: 'file',
      title: 'File (PDF or other)',
      type: 'file',
      options: {
        accept: 'application/pdf'
      },
      description: 'Upload a PDF or other file type here.'
    },
    {
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {
        hotspot: true
      },
      description: 'Upload an image here (JPG, PNG, etc.)'
    },
    {
      name: 'fileUploaded',
      title: 'File Uploaded',
      type: 'boolean',
      description: 'Indicates if the file has been uploaded to Sanity',
      initialValue: false
    },
    {
      name: 'colors',
      title: 'Colors',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Extracted colors from the design'
    },
    {
      name: 'url',
      title: 'URL',
      type: 'string',
      description: 'URL of the element in Eagle'
    },
    {
      name: 'mainCategory',
      title: 'Main Category',
      type: 'reference',
      to: [{ type: 'category' }],
      validation: Rule => Rule.required()
    },
    {
      name: 'caption',
      title: 'Caption',
      type: 'string',
      description: 'Caption of the element'
    },
    {
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags'
      }
    },
    {
      name: 'subCategories',
      title: 'Subcategories',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'subcategory' }] }]
    },
    {
      name: 'connectedProjects',
      title: 'Connected Projects',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'project' }] }]
    },
    {
      name: 'comments',
      title: 'Comments',
      type: 'array',
      of: [{ type: 'comment' }]
    },
    {
      name: 'dateAdded',
      title: 'Date Added',
      type: 'datetime',
      validation: Rule => Rule.required()
    },
    {
      name: 'dateUpdated',
      title: 'Date Updated',
      type: 'datetime',
      validation: Rule => Rule.required()
    }
  ],
  preview: {
    select: {
      title: 'fileName',
      subtitle: 'fileType',
      media: 'file'
    }
  }
}