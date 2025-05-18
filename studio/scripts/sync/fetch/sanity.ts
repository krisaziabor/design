export async function fetchSanityCategories(sanity: any) {
  return sanity.fetch(`*[_type == "category"]{_id, name, eagleId}`);
} 