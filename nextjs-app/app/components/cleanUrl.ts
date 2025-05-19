function cleanUrl(url: string) {
  if (!url) return '';
  // Remove protocol, www, trailing slash, and query/hash
  let cleaned = url.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/[\/?#].*$/, '');
  if (cleaned.endsWith('/')) cleaned = cleaned.slice(0, -1);
  return cleaned;
}

export default cleanUrl; 