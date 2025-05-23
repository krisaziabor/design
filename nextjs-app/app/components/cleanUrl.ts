function cleanUrl(url: string) {
  if (!url) return '';
  // Remove protocol and www
  let cleaned = url.replace(/^(https?:\/\/)?(www\.)?/, '');
  // Special case for Instagram: include first slug
  if (cleaned.startsWith('instagram.com/')) {
    // Extract 'instagram.com/<first-slug>'
    const match = cleaned.match(/^(instagram\.com\/[^\/?#]+)/);
    if (match) return match[1];
    return 'instagram.com';
  }
  // Remove trailing slash and query/hash for other domains
  cleaned = cleaned.replace(/[\/?#].*$/, '');
  if (cleaned.endsWith('/')) cleaned = cleaned.slice(0, -1);
  return cleaned;
}

export default cleanUrl; 