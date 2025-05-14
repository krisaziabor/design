export default {
  name: 'project',
  title: 'Project',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text'
    },
    {
      name: 'inspirations',
      title: 'Connected Inspirations',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'designInspiration' }] }]
    }
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'description'
    }
  }
}