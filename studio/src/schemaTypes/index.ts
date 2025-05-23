import {person} from './documents/person'
import {page} from './documents/page'
import {post} from './documents/post'
import {callToAction} from './objects/callToAction'
import {infoSection} from './objects/infoSection'
import {settings} from './singletons/settings'
import {link} from './objects/link'
import {blockContent} from './objects/blockContent'
import elements from './documents/elements'
import category from './documents/category'
import project from './documents/project'
import subcategory from './documents/subcategory'
import comment from './objects/comment'

// Export an array of all the schema types.  This is used in the Sanity Studio configuration. https://www.sanity.io/docs/schema-types

export const schemaTypes = [
  // Singletons
  settings,
  // Documents
  page,
  post,
  person,
  elements,
  category,
  project,
  subcategory,
  // Objects
  blockContent,
  infoSection,
  callToAction,
  link,
  comment,
]
