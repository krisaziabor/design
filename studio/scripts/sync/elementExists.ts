export async function elementExists(eagleId: string, sanity: any): Promise<boolean> {
  const result = await sanity.fetch('*[_type == "elements" && eagleId == $eagleId][0]{_id}', { eagleId });
  return !!result;
} 