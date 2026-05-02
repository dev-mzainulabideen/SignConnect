import AsyncStorage from '@react-native-async-storage/async-storage';
import { SpellCheckServiceImpl } from '../src/services/SpellCheckService';
import { wordSuggestionService } from '../src/services/WordSuggestionService';

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

jest.mock('react-native-fs', () => ({
  readFileAssets: jest.fn(),
}));

jest.mock('../src/services/WordSuggestionService', () => {
  const getSuggestions = jest.fn(async () => ({
    suggestions: [
      { word: 'hello', confidence: 0.92, category: 'common', frequency: 10, distance: 0.08 },
      { word: 'help', confidence: 0.55, category: 'common', frequency: 8, distance: 0.45 },
      { word: 'halo', confidence: 0.2, category: 'common', frequency: 5, distance: 0.8 },
    ],
    totalFound: 3,
    processingTime: 1,
    timestamp: Date.now(),
  }));

  return {
    wordSuggestionService: {
      isDatabaseLoaded: jest.fn(() => true),
      loadWordDatabase: jest.fn(),
      getSuggestions,
      updateWordFrequency: jest.fn(),
      searchByCategory: jest.fn(async () => []),
    },
  };
});

const mockStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage> & {
  __store: Record<string, string>;
};

const mockWordSuggestion = wordSuggestionService as jest.Mocked<typeof wordSuggestionService>;

const baseConfig = {
  dictionary_language: 'en',
  suggestion_algorithm: 'levenshtein',
  max_suggestions: 5,
  min_word_length: 2,
  max_word_length: 10,
  confidence_thresholds: {
    exact_match: 0.9,
    high_confidence: 0.8,
    medium_confidence: 0.6,
    low_confidence: 0.4,
  },
  word_frequency: {},
  context_aware_suggestions: {
    enabled: false,
    sentence_context: false,
    previous_words: 0,
    next_words: 0,
    grammar_rules: false,
    part_of_speech: false,
  },
  learning_features: {
    user_corrections: true,
    frequent_words: false,
    custom_dictionary: true,
    domain_specific: false,
    adaptive_suggestions: false,
  },
};

describe('SpellCheckServiceImpl', () => {
  let service: SpellCheckServiceImpl;

  beforeEach(() => {
    Object.keys(mockStorage.__store).forEach(k => delete mockStorage.__store[k]);
    jest.clearAllMocks();

    service = new SpellCheckServiceImpl();
    (service as any).config = baseConfig;
    (service as any).customDictionary = [];
    (service as any).isConfigured = true;
  });

  it('validates spelling based on length and patterns', () => {
    expect(service.checkSpelling('hello')).toBe(true);
    expect(service.checkSpelling('h')).toBe(false); // too short
    expect(service.checkSpelling('thiswordiswaytoolong')).toBe(false); // too long
    expect(service.checkSpelling('hi!!')).toBe(false); // invalid characters
  });

  it('uses custom dictionary entries', () => {
    service.addToCustomDictionary('newword');
    expect(service.checkSpelling('newword')).toBe(true);
    expect(mockStorage.setItem).toHaveBeenCalledWith(
      'custom_dictionary',
      JSON.stringify(['newword']),
    );
  });

  it('removes words from custom dictionary', () => {
    service.addToCustomDictionary('tempword');
    service.removeFromCustomDictionary('tempword');
    expect(service.getCustomDictionary()).toEqual([]);
  });

  it('filters suggestions using confidence thresholds', async () => {
    const suggestions = await service.getSuggestions('hel', 4);

    expect(mockWordSuggestion.getSuggestions).toHaveBeenCalledWith('hel', [], 4);
    expect(suggestions.map(s => s.word)).toEqual(['hello', 'help']);
  });
});

