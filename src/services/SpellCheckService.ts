import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  WordSuggestion, 
  SpellCheckConfig, 
  SpellCheckService 
} from '../types/WordTypes';
import { wordSuggestionService } from './WordSuggestionService';

export class SpellCheckServiceImpl implements SpellCheckService {
  private config: SpellCheckConfig | null = null;
  private customDictionary: string[] = [];
  private isConfigured = false;
  private readonly CUSTOM_DICT_KEY = 'custom_dictionary';

  async loadSpellCheckConfig(): Promise<boolean> {
    try {
      console.log('🔄 Loading spell check configuration...');
      
      // Load from bundled assets
      const configContent = await RNFS.readFileAssets('spell_check_config.json', 'utf8');
      this.config = JSON.parse(configContent);
      
      // Load custom dictionary
      await this.loadCustomDictionary();
      
      this.isConfigured = true;
      console.log('✅ Spell check configuration loaded');
      return true;
    } catch (error) {
      console.error('❌ Failed to load spell check config:', error);
      // Use default configuration if loading fails
      this.config = {
        rules: [
          {
            pattern: 'double_letter',
            description: 'Double letter correction',
            examples: ['hello -> hello', 'book -> book']
          },
          {
            pattern: 'missing_letter',
            description: 'Missing letter correction',
            examples: ['helo -> hello', 'bok -> book']
          },
          {
            pattern: 'extra_letter',
            description: 'Extra letter correction',
            examples: ['helllo -> hello', 'bookk -> book']
          }
        ],
        common_mistakes: {
          'helo': 'hello',
          'bok': 'book',
          'wold': 'world',
          'gud': 'good',
          'morning': 'morning',
          'afternoon': 'afternoon',
          'evening': 'evening'
        },
        asl_specific: {
          'space_handling': true,
          'gesture_confidence_threshold': 0.7,
          'context_aware_correction': true
        }
      };
      await this.loadCustomDictionary();
      this.isConfigured = true;
      console.log('✅ Using default spell check configuration');
      return true;
    }
  }

  private async loadCustomDictionary(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.CUSTOM_DICT_KEY);
      if (stored) {
        this.customDictionary = JSON.parse(stored);
        console.log(`✅ Loaded ${this.customDictionary.length} custom dictionary words`);
      }
    } catch (error) {
      console.error('❌ Failed to load custom dictionary:', error);
      this.customDictionary = [];
    }
  }

  private async saveCustomDictionary(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.CUSTOM_DICT_KEY, JSON.stringify(this.customDictionary));
    } catch (error) {
      console.error('❌ Failed to save custom dictionary:', error);
    }
  }

  checkSpelling(word: string): boolean {
    if (!this.isConfigured) {
      console.warn('Spell check not configured');
      return true; // Assume correct if not configured
    }

    const normalizedWord = word.toLowerCase().trim();
    
    // Check if word is in custom dictionary
    if (this.customDictionary.includes(normalizedWord)) {
      return true;
    }

    // Check if word meets minimum length requirement
    if (normalizedWord.length < (this.config?.min_word_length || 2)) {
      return false;
    }

    // Check if word meets maximum length requirement
    if (normalizedWord.length > (this.config?.max_word_length || 50)) {
      return false;
    }

    // For now, we'll use a simple heuristic
    // In a real implementation, you would use a proper dictionary
    return this.isValidWord(normalizedWord);
  }

  private isValidWord(word: string): boolean {
    // Simple validation rules
    const validPattern = /^[a-zA-Z]+$/;
    
    if (!validPattern.test(word)) {
      return false;
    }

    // Check for common invalid patterns
    const invalidPatterns = [
      /(.)\1{3,}/, // More than 3 consecutive identical characters
      /^[aeiou]{4,}$/, // More than 3 consecutive vowels
      /^[bcdfghjklmnpqrstvwxyz]{5,}$/ // More than 4 consecutive consonants
    ];

    return !invalidPatterns.some(pattern => pattern.test(word));
  }

  async getSuggestions(word: string, maxSuggestions: number = 4): Promise<WordSuggestion[]> {
    if (!this.isConfigured) {
      try { await this.loadSpellCheckConfig(); } catch {}
    }
    if (!wordSuggestionService.isDatabaseLoaded?.()) {
      try { await (wordSuggestionService as any).loadWordDatabase?.(); } catch {}
    }

    try {
      // Use the word suggestion service to get suggestions
      const result = await wordSuggestionService.getSuggestions(
        word, 
        [], 
        maxSuggestions
      );

      // Filter suggestions based on confidence thresholds
      const filteredSuggestions = result.suggestions.filter(suggestion => {
        const confidence = suggestion.confidence;
        const thresholds = this.config?.confidence_thresholds;
        
        if (!thresholds) return confidence > 0.4;

        if (confidence >= thresholds.exact_match) return true;
        if (confidence >= thresholds.high_confidence) return true;
        if (confidence >= thresholds.medium_confidence) return true;
        if (confidence >= thresholds.low_confidence) return true;
        
        return false;
      });

      return filteredSuggestions;
    } catch (error) {
      console.error('❌ Failed to get spell check suggestions:', error);
      return [];
    }
  }

  addToCustomDictionary(word: string): void {
    const normalizedWord = word.toLowerCase().trim();
    
    if (!this.customDictionary.includes(normalizedWord)) {
      this.customDictionary.push(normalizedWord);
      this.saveCustomDictionary();
      console.log(`✅ Added "${word}" to custom dictionary`);
    }
  }

  removeFromCustomDictionary(word: string): void {
    const normalizedWord = word.toLowerCase().trim();
    const index = this.customDictionary.indexOf(normalizedWord);
    
    if (index > -1) {
      this.customDictionary.splice(index, 1);
      this.saveCustomDictionary();
      console.log(`✅ Removed "${word}" from custom dictionary`);
    }
  }

  getCustomDictionary(): string[] {
    return [...this.customDictionary];
  }

  isConfigured(): boolean {
    return this.isConfigured && this.config !== null;
  }

  getConfig(): SpellCheckConfig | null {
    return this.config;
  }

  // Additional utility methods
  async learnFromUserCorrection(incorrectWord: string, correctWord: string): Promise<void> {
    if (!this.config?.learning_features.user_corrections) {
      return;
    }

    try {
      // Add correct word to custom dictionary
      this.addToCustomDictionary(correctWord);
      
      // Update word frequency
      wordSuggestionService.updateWordFrequency(correctWord, 'user_corrections');
      
      console.log(`📚 Learned correction: "${incorrectWord}" → "${correctWord}"`);
    } catch (error) {
      console.error('❌ Failed to learn from user correction:', error);
    }
  }

  async getContextualSuggestions(
    word: string, 
    context: string[], 
    maxSuggestions: number = 4
  ): Promise<WordSuggestion[]> {
    if (!this.config?.context_aware_suggestions.enabled) {
      return this.getSuggestions(word, maxSuggestions);
    }

    try {
      const result = await wordSuggestionService.getSuggestions(
        word, 
        context, 
        maxSuggestions
      );

      return result.suggestions;
    } catch (error) {
      console.error('❌ Failed to get contextual suggestions:', error);
      return [];
    }
  }

  async getDomainSpecificSuggestions(
    word: string, 
    domain: string, 
    maxSuggestions: number = 4
  ): Promise<WordSuggestion[]> {
    try {
      const suggestions = await wordSuggestionService.searchByCategory(domain, word);
      return suggestions.slice(0, maxSuggestions);
    } catch (error) {
      console.error('❌ Failed to get domain-specific suggestions:', error);
      return [];
    }
  }
}

// Export singleton instance
export const spellCheckService = new SpellCheckServiceImpl();
