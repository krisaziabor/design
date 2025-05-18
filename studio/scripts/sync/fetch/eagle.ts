import axios from 'axios';

export async function fetchEagleFolders(EAGLE_API: string) {
  const res = await axios.get(`${EAGLE_API}/folder/list`);
  return res.data.data || [];
}

export async function fetchEagleElements(EAGLE_API: string, folderId: string) {
  const res = await axios.get(`${EAGLE_API}/item/list?folders=${folderId}`);
  return res.data.data || [];
} 