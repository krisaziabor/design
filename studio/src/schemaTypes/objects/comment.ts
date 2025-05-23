export default {
  name: 'comment',
  title: 'Comment',
  type: 'object',
  fields: [
    {
      name: 'text',
      title: 'Text',
      type: 'text',
      validation: Rule => Rule.required()
    },
    {
      name: 'dateAdded',
      title: 'Date Added',
      type: 'datetime',
      validation: Rule => Rule.required()
    },
    {
      name: 'dateEdited',
      title: 'Date Edited',
      type: 'datetime'
    },
    {
      name: 'parentElement',
      title: 'Parent Element',
      type: 'reference',
      to: [{ type: 'elements' }],
      validation: Rule => Rule.required()
    }
  ]
} 