import AsyncStorage from '@react-native-async-storage/async-storage';
import * as HistoryService from '../src/services/HistoryService';

jest.mock('@react-native-async-storage/async-storage', () => {
  const store: Record<string, string> = {};
  return {
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
      return Promise.resolve();
    }),
    getItem: jest.fn((key: string) => Promise.resolve(store[key] ?? null)),
    removeItem: jest.fn((key: string) => {
      delete store[key];
      return Promise.resolve();
    }),
    __store: store,
  };
});

const mockStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage> & {
  __store: Record<string, string>;
};

const baseEntry = {
  mode: 'sign_to_text' as const,
  language: 'ASL' as const,
  input: { type: 'text' as const, value: 'hello' },
  output: { type: 'text' as const, value: 'hello' },
};

beforeEach(() => {
  Object.keys(mockStorage.__store).forEach(k => delete mockStorage.__store[k]);
  jest.clearAllMocks();
});

describe('HistoryService', () => {
  it('returns empty array when no history exists', async () => {
    const result = await HistoryService.getAll('user1');
    expect(result).toEqual([]);
  });

  it('adds a new entry with generated metadata', async () => {
    const [first] = await HistoryService.add('user1', baseEntry);

    expect(first).toMatchObject({
      ...baseEntry,
      userId: 'user1',
      favorite: false,
    });
    expect(first.id).toBeDefined();
    expect(first.timestamp).toBeGreaterThan(0);

    expect(mockStorage.setItem).toHaveBeenCalledWith(
      'history:user1',
      expect.any(String),
    );
  });

  it('toggles favorite for a stored entry', async () => {
    const [created] = await HistoryService.add('user1', baseEntry);

    const updated = await HistoryService.toggleFavorite('user1', created.id);
    expect(updated[0].favorite).toBe(true);

    const toggledBack = await HistoryService.toggleFavorite('user1', created.id);
    expect(toggledBack[0].favorite).toBe(false);
  });

  it('deletes an entry by id', async () => {
    const [created] = await HistoryService.add('user1', baseEntry);

    const afterDelete = await HistoryService.deleteOne('user1', created.id);
    expect(afterDelete).toEqual([]);
  });

  it('clears all history for a user', async () => {
    await HistoryService.add('user1', baseEntry);
    await HistoryService.clearAll('user1');

    const stored = await HistoryService.getAll('user1');
    expect(stored).toEqual([]);
    expect(mockStorage.removeItem).toHaveBeenCalledWith('history:user1');
  });

  it('computes stats per mode and favorites', async () => {
    const entryA = { ...baseEntry, mode: 'sign_to_text' as const };
    const entryB = { ...baseEntry, mode: 'voice_to_sign' as const };

    const [first] = await HistoryService.add('user1', entryA);
    await HistoryService.add('user1', entryB);
    await HistoryService.toggleFavorite('user1', first.id);

    const stats = await HistoryService.getStats('user1');
    expect(stats.total).toBe(2);
    expect(stats.favorites).toBe(1);
    expect(stats.byMode.sign_to_text).toBe(1);
    expect(stats.byMode.voice_to_sign).toBe(1);
  });
});

