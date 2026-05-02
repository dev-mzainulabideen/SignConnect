// Word Suggestion and Spell Check Types
export interface WordSuggestion {
  word: string;
  confidence: number;
  category: string;
  frequency: number;
  distance: number;
}

export interface WordSuggestionResult {
  suggestions: WordSuggestion[];
  totalFound: number;
  processingTime: number;
  timestamp: number;
}

export interface WordDatabase {
  common_words: string[];
  categories: {
    [categoryName: string]: string[];
  };
}

export interface SpellCheckConfig {
  dictionary_language: string;
  suggestion_algorithm: string;
  max_suggestions: number;
  min_word_length: number;
  max_word_length: number;
  confidence_thresholds: {
    exact_match: number;
    high_confidence: number;
    medium_confidence: number;
    low_confidence: number;
  };
  word_frequency: {
    [category: string]: number;
  };
  context_aware_suggestions: {
    enabled: boolean;
    sentence_context: boolean;
    previous_words: number;
    next_words: number;
    grammar_rules: boolean;
    part_of_speech: boolean;
  };
  learning_features: {
    user_corrections: boolean;
    frequent_words: boolean;
    custom_dictionary: boolean;
    domain_specific: boolean;
    adaptive_suggestions: boolean;
  };
}

export interface WordSuggestionService {
  loadWordDatabase(): Promise<boolean>;
  getSuggestions(
    currentWord: string,
    context: string[],
    maxSuggestions?: number
  ): Promise<WordSuggestionResult>;
  searchByCategory(category: string, query: string): Promise<WordSuggestion[]>;
  calculateSimilarity(word1: string, word2: string): number;
  updateWordFrequency(word: string, category: string): void;
  isDatabaseLoaded(): boolean;
  getDatabaseStats(): {
    totalWords: number;
    categories: string[];
    categoryCounts: { [key: string]: number };
  };
}

export interface SpellCheckService {
  loadSpellCheckConfig(): Promise<boolean>;
  checkSpelling(word: string): boolean;
  getSuggestions(word: string, maxSuggestions?: number): Promise<WordSuggestion[]>;
  addToCustomDictionary(word: string): void;
  removeFromCustomDictionary(word: string): void;
  getCustomDictionary(): string[];
  isConfigured(): boolean;
  getConfig(): SpellCheckConfig | null;
}
