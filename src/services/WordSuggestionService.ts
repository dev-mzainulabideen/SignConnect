import RNFS from 'react-native-fs';
import { 
  WordSuggestion, 
  WordSuggestionResult, 
  WordDatabase, 
  WordSuggestionService 
} from '../types/WordTypes';

export class WordSuggestionServiceImpl implements WordSuggestionService {
  private wordDatabase: WordDatabase | null = null;
  private isLoaded = false;
  private wordFrequency: { [word: string]: number } = {};

  async loadWordDatabase(): Promise<boolean> {
    try {
      console.log('🔄 Loading word suggestions database...');
      
      // Load from bundled assets
      const dbContent = await RNFS.readFileAssets('word_suggestions.json', 'utf8');
      this.wordDatabase = JSON.parse(dbContent);
      
      // Initialize word frequencies
      this.initializeWordFrequencies();
      
      this.isLoaded = true;
      console.log('✅ Word database loaded successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to load word database:', error);
      // Use fallback word database if loading fails
      this.wordDatabase = this.getFallbackWordDatabase();
      this.initializeWordFrequencies();
      this.isLoaded = true;
      console.log('✅ Using fallback word database');
      return true;
    }
  }

  private getFallbackWordDatabase(): WordDatabase {
    return {
        common_words: [
          // A words
          'apple', 'animal', 'air', 'ask', 'answer', 'always', 'around', 'about',
          // B words  
          'book', 'ball', 'big', 'blue', 'beautiful', 'brother', 'baby', 'bread',
          // C words
          'cat', 'car', 'come', 'can', 'call', 'close', 'cold', 'cup',
          // D words
          'dog', 'day', 'door', 'down', 'drink', 'dance', 'dinner', 'dream',
          // E words
          'eat', 'eye', 'ear', 'eight', 'eleven', 'every', 'evening', 'easy',
          // F words
          'food', 'friend', 'family', 'fun', 'fast', 'five', 'four', 'flower',
          // G words
          'good', 'girl', 'go', 'green', 'great', 'game', 'gift', 'garden',
          // H words
          'hello', 'house', 'happy', 'help', 'hand', 'head', 'heart', 'home',
          // I words
          'I', 'ice', 'idea', 'important', 'inside', 'interesting', 'island', 'item',
          // J words
          'jump', 'job', 'joy', 'join', 'just', 'journey', 'joke', 'jacket',
          // K words
          'key', 'kind', 'keep', 'know', 'kiss', 'kitchen', 'king', 'kite',
          // L words
          'love', 'like', 'look', 'learn', 'light', 'long', 'little', 'lunch',
          // M words
          'mother', 'man', 'make', 'many', 'more', 'music', 'money', 'moon',
          // N words
          'name', 'new', 'nice', 'night', 'no', 'now', 'number', 'never',
          // O words
          'open', 'old', 'one', 'orange', 'other', 'our', 'out', 'over',
          // P words
          'please', 'play', 'people', 'place', 'put', 'picture', 'phone', 'paper',
          // Q words
          'question', 'quick', 'quiet', 'queen', 'quality', 'quarter', 'quite', 'quit',
          // R words
          'red', 'run', 'right', 'read', 'room', 'rain', 'river', 'road',
          // S words
          'see', 'say', 'school', 'small', 'some', 'sun', 'sister', 'sweet',
          // T words
          'thank', 'time', 'today', 'take', 'tell', 'think', 'tree', 'table',
          // U words
          'up', 'use', 'under', 'us', 'until', 'understand', 'uncle', 'umbrella',
          // V words
          'very', 'visit', 'voice', 'view', 'village', 'vacation', 'vegetable', 'video',
          // W words
          'water', 'work', 'walk', 'want', 'where', 'when', 'what', 'why',
          // X words
          'box', 'six', 'mix', 'fix', 'tax', 'fox', 'wax', 'max',
          // Y words
          'yes', 'you', 'year', 'yellow', 'young', 'your', 'yesterday', 'yard',
          // Z words
          'zoo', 'zero', 'zone', 'zebra', 'zip', 'zoom', 'zest', 'zinc'
        ],
        categories: {
          'greetings': ['hello', 'hi', 'good morning', 'good afternoon', 'good evening', 'goodbye'],
          'basic_needs': ['water', 'food', 'help', 'bathroom', 'medicine', 'sleep', 'rest'],
          'emotions': ['happy', 'sad', 'angry', 'tired', 'excited', 'worried', 'love', 'like'],
          'family': ['mother', 'father', 'brother', 'sister', 'baby', 'grandmother', 'grandfather', 'uncle'],
          'objects': ['book', 'phone', 'car', 'house', 'computer', 'chair', 'table', 'ball'],
          'colors': ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'black', 'white'],
          'numbers': ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'],
          'actions': ['eat', 'drink', 'sleep', 'walk', 'run', 'jump', 'play', 'work', 'learn', 'help']
        }
      };
  }

  private initializeWordFrequencies(): void {
    if (!this.wordDatabase) return;

    // Initialize frequencies based on category weights
    const categoryWeights: { [key: string]: number } = {
      'common_words': 1000,
      'professional_terms': 500,
      'business_communication': 300,
      'technology_terms': 200,
      'education_terms': 150,
      'medical_terms': 100,
      'sign_language_terms': 200,
      'alphabet': 50,
      'numbers': 30,
      'emotions_and_feelings': 80,
      'actions_and_verbs': 120,
      'places_and_locations': 100,
      'time_and_dates': 60,
      'colors_and_descriptions': 40,
      'food_and_drinks': 70,
      'family_and_relationships': 60,
      'special_characters': 20
    };

    Object.entries(this.wordDatabase).forEach(([category, words]) => {
      const weight = categoryWeights[category] || 50;
      words.forEach((word: string) => {
        this.wordFrequency[word.toLowerCase()] = weight;
      });
    });
  }

  async getSuggestions(
    currentWord: string,
    context: string[] = [],
    maxSuggestions: number = 4
  ): Promise<WordSuggestionResult> {
    if (!this.isLoaded || !this.wordDatabase) {
      throw new Error('Word database not loaded');
    }

    const startTime = Date.now();
    const suggestions: WordSuggestion[] = [];

    try {
      let matchingWords: string[] = [];
      
      // For single letter recognition, provide words starting with that letter
      if (currentWord.length === 1) {
        const letter = currentWord.toUpperCase();
        console.log(`🔤 Getting word suggestions for letter: ${letter}`);
        
        // Get words for this specific letter
        matchingWords = this.getWordsForLetter(letter);
        
        // Also search in all words for additional matches
        const allWords = this.getAllWords();
        const additionalWords = allWords.filter(word => 
          word.toLowerCase().startsWith(letter.toLowerCase())
        );
        
        // Combine and deduplicate
        matchingWords = [...new Set([...matchingWords, ...additionalWords])];
      } else {
        // Multi-letter word - get words that start with current word
      const allWords = this.getAllWords();
        matchingWords = allWords.filter(word => 
          word.toLowerCase().startsWith(currentWord.toLowerCase())
        );
      }
      
      // Calculate similarities and create suggestions
      for (const word of matchingWords) {
        const similarity = this.calculateSimilarity(currentWord.toLowerCase(), word.toLowerCase());
        
        if (similarity > 0.3) { // Minimum similarity threshold
          const category = this.getWordCategory(word);
          const frequency = this.wordFrequency[word.toLowerCase()] || 50;
          
          suggestions.push({
            word,
            confidence: similarity,
            category,
            frequency,
            distance: 1 - similarity
          });
        }
      }

      // Sort by confidence and frequency
      suggestions.sort((a, b) => {
        const scoreA = a.confidence * 0.7 + (a.frequency / 1000) * 0.3;
        const scoreB = b.confidence * 0.7 + (b.frequency / 1000) * 0.3;
        return scoreB - scoreA;
      });

      // Apply context filtering
      const filteredSuggestions = this.applyContextFiltering(suggestions, context);

      // Limit results
      const finalSuggestions = filteredSuggestions.slice(0, maxSuggestions);

      const processingTime = Date.now() - startTime;

      console.log(`✅ Generated ${finalSuggestions.length} word suggestions for "${currentWord}" in ${processingTime}ms`);

      return {
        suggestions: finalSuggestions,
        totalFound: suggestions.length,
        processingTime,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('❌ Failed to get word suggestions:', error);
      throw error;
    }
  }

  async searchByCategory(category: string, query: string): Promise<WordSuggestion[]> {
    if (!this.isLoaded || !this.wordDatabase) {
      throw new Error('Word database not loaded');
    }

    const categoryWords = (this.wordDatabase as any)[category] || [];
    const suggestions: WordSuggestion[] = [];

    for (const word of categoryWords) {
      const similarity = this.calculateSimilarity(query.toLowerCase(), word.toLowerCase());
      
      if (similarity > 0.3) {
        suggestions.push({
          word,
          confidence: similarity,
          category,
          frequency: this.wordFrequency[word.toLowerCase()] || 50,
          distance: 1 - similarity
        });
      }
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  // Get words for a specific letter (A-Z)
  getWordsForLetter(letter: string): string[] {
    const letterWords: { [key: string]: string[] } = {
      'A': ['apple', 'animal', 'air', 'ask', 'answer', 'always', 'around', 'about'],
      'B': ['book', 'ball', 'big', 'blue', 'beautiful', 'brother', 'baby', 'bread'],
      'C': ['cat', 'car', 'come', 'can', 'call', 'close', 'cold', 'cup'],
      'D': ['dog', 'day', 'door', 'down', 'drink', 'dance', 'dinner', 'dream'],
      'E': ['eat', 'eye', 'ear', 'eight', 'eleven', 'every', 'evening', 'easy'],
      'F': ['food', 'friend', 'family', 'fun', 'fast', 'five', 'four', 'flower'],
      'G': ['good', 'girl', 'go', 'green', 'great', 'game', 'gift', 'garden'],
      'H': ['hello', 'house', 'happy', 'help', 'hand', 'head', 'heart', 'home'],
      'I': ['I', 'ice', 'idea', 'important', 'inside', 'interesting', 'island', 'item'],
      'J': ['jump', 'job', 'joy', 'join', 'just', 'journey', 'joke', 'jacket'],
      'K': ['key', 'kind', 'keep', 'know', 'kiss', 'kitchen', 'king', 'kite'],
      'L': ['love', 'like', 'look', 'learn', 'light', 'long', 'little', 'lunch'],
      'M': ['mother', 'man', 'make', 'many', 'more', 'music', 'money', 'moon'],
      'N': ['name', 'new', 'nice', 'night', 'no', 'now', 'number', 'never'],
      'O': ['open', 'old', 'one', 'orange', 'other', 'our', 'out', 'over'],
      'P': ['please', 'play', 'people', 'place', 'put', 'picture', 'phone', 'paper'],
      'Q': ['question', 'quick', 'quiet', 'queen', 'quality', 'quarter', 'quite', 'quit'],
      'R': ['red', 'run', 'right', 'read', 'room', 'rain', 'river', 'road'],
      'S': ['see', 'say', 'school', 'small', 'some', 'sun', 'sister', 'sweet'],
      'T': ['thank', 'time', 'today', 'take', 'tell', 'think', 'tree', 'table'],
      'U': ['up', 'use', 'under', 'us', 'until', 'understand', 'uncle', 'umbrella'],
      'V': ['very', 'visit', 'voice', 'view', 'village', 'vacation', 'vegetable', 'video'],
      'W': ['water', 'work', 'walk', 'want', 'where', 'when', 'what', 'why'],
      'X': ['box', 'six', 'mix', 'fix', 'tax', 'fox', 'wax', 'max'],
      'Y': ['yes', 'you', 'year', 'yellow', 'young', 'your', 'yesterday', 'yard'],
      'Z': ['zoo', 'zero', 'zone', 'zebra', 'zip', 'zoom', 'zest', 'zinc']
    };
    
    return letterWords[letter.toUpperCase()] || [];
  }

  calculateSimilarity(word1: string, word2: string): number {
    // Levenshtein distance-based similarity
    const distance = this.levenshteinDistance(word1, word2);
    const maxLength = Math.max(word1.length, word2.length);
    
    if (maxLength === 0) return 1;
    
    return 1 - (distance / maxLength);
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  private getAllWords(): string[] {
    if (!this.wordDatabase) return [];
    
    const allWords: string[] = [];
    Object.values(this.wordDatabase).forEach(words => {
      allWords.push(...words);
    });
    
    return allWords;
  }

  private getWordCategory(word: string): string {
    if (!this.wordDatabase) return 'unknown';
    
    for (const [category, words] of Object.entries(this.wordDatabase)) {
      if (words.includes(word)) {
        return category;
      }
    }
    
    return 'unknown';
  }

  private applyContextFiltering(suggestions: WordSuggestion[], context: string[]): WordSuggestion[] {
    if (context.length === 0) return suggestions;

    // Simple context filtering based on previous words
    const contextWords = context.map(w => w.toLowerCase());
    
    return suggestions.filter(suggestion => {
      // Boost suggestions that appear in similar contexts
      const word = suggestion.word.toLowerCase();
      
      // Check if word commonly appears with context words
      const contextScore = contextWords.reduce((score, contextWord) => {
        // Simple heuristic: words that start with similar letters
        if (word.startsWith(contextWord.substring(0, 2)) || 
            contextWord.startsWith(word.substring(0, 2))) {
          return score + 0.1;
        }
        return score;
      }, 0);

      // Apply context boost to confidence
      suggestion.confidence = Math.min(1, suggestion.confidence + contextScore);
      
      return suggestion.confidence > 0.3;
    });
  }

  updateWordFrequency(word: string, category: string): void {
    const normalizedWord = word.toLowerCase();
    const currentFreq = this.wordFrequency[normalizedWord] || 50;
    this.wordFrequency[normalizedWord] = currentFreq + 10; // Increase frequency
    
    console.log(`📈 Updated frequency for "${word}" in category "${category}"`);
  }

  isDatabaseLoaded(): boolean {
    return this.isLoaded && this.wordDatabase !== null;
  }

  getDatabaseStats() {
    if (!this.wordDatabase) {
      return {
        totalWords: 0,
        categories: [],
        categoryCounts: {}
      };
    }

    const categories = Object.keys(this.wordDatabase);
    const categoryCounts: { [key: string]: number } = {};
    let totalWords = 0;

    categories.forEach(category => {
      const count = (this.wordDatabase as any)[category].length;
      categoryCounts[category] = count;
      totalWords += count;
    });

    return {
      totalWords,
      categories,
      categoryCounts
    };
  }
}

// Export singleton instance
export const wordSuggestionService: WordSuggestionService = new WordSuggestionServiceImpl();