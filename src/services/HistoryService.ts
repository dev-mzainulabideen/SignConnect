import AsyncStorage from '@react-native-async-storage/async-storage';

export type HistoryMode = 'sign_to_text' | 'text_to_sign' | 'voice_to_sign' | 'sign_to_voice';

export interface HistoryEntry {
  id: string;
  userId: string;
  timestamp: number;
  mode: HistoryMode;
  language: 'ASL' | 'PSL';
  input: { type: 'text' | 'voice' | 'video' | 'image'; value: string; uri?: string };
  output: { type: 'text' | 'video'; value: string; uri?: any };
  confidence?: number; // 0..1
  favorite: boolean;
}

const MAX_ENTRIES = 200;

function keyForUser(userId: string): string {
  return `history:${userId}`;
}

export async function getAll(userId: string): Promise<HistoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(keyForUser(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as HistoryEntry[];
  } catch {
    return [];
  }
}

export async function add(userId: string, entry: Omit<HistoryEntry, 'id' | 'userId' | 'timestamp' | 'favorite'>): Promise<HistoryEntry[]> {
  const list = await getAll(userId);
  const next: HistoryEntry = {
    ...entry,
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    userId,
    timestamp: Date.now(),
    favorite: false,
  };
  const newList = [next, ...list].slice(0, MAX_ENTRIES);
  await AsyncStorage.setItem(keyForUser(userId), JSON.stringify(newList));
  return newList;
}

export async function clearAll(userId: string): Promise<void> {
  await AsyncStorage.removeItem(keyForUser(userId));
}

export async function toggleFavorite(userId: string, id: string): Promise<HistoryEntry[]> {
  const list = await getAll(userId);
  const newList = list.map(e => e.id === id ? { ...e, favorite: !e.favorite } : e);
  await AsyncStorage.setItem(keyForUser(userId), JSON.stringify(newList));
  return newList;
}

export async function deleteOne(userId: string, id: string): Promise<HistoryEntry[]> {
  const list = await getAll(userId);
  const newList = list.filter(e => e.id !== id);
  await AsyncStorage.setItem(keyForUser(userId), JSON.stringify(newList));
  return newList;
}

export default {
  getAll,
  add,
  clearAll,
  toggleFavorite,
  deleteOne,
};

export async function getStats(userId: string): Promise<{ total: number; favorites: number; byMode: Record<HistoryMode, number> } > {
  const list = await getAll(userId);
  const byMode: Record<HistoryMode, number> = {
    sign_to_text: 0,
    text_to_sign: 0,
    voice_to_sign: 0,
    sign_to_voice: 0,
  };
  let favorites = 0;
  for (const e of list) {
    byMode[e.mode] = (byMode[e.mode] || 0) + 1;
    if (e.favorite) favorites += 1;
  }
  return { total: list.length, favorites, byMode };
}


