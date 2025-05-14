export default {
  name: 'category',
  title: 'Category',
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
      name: 'parent',
      title: 'Parent Category',
      type: 'reference',
      to: [{ type: 'category' }]
    }
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'description'
    }
  }
}