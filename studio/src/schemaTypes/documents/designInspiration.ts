export default {
  name: 'designInspiration',
  title: 'Design Inspiration',
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
      name: 'file',
      title: 'File',
      type: 'file',
      validation: Rule => Rule.required()
    },
    {
      name: 'colors',
      title: 'Colors',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Extracted colors from the design'
    },
    {
      name: 'mainCategory',
      title: 'Main Category',
      type: 'reference',
      to: [{ type: 'category' }],
      validation: Rule => Rule.required()
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
      name: 'connectedProjects',
      title: 'Connected Projects',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'project' }] }]
    },
    {
      name: 'comments',
      title: 'Comments',
      type: 'array',
      of: [{ type: 'text' }]
    },
    {
      name: 'dateAdded',
      title: 'Date Added',
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