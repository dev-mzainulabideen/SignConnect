/**
 * App Constants
 * Centralized configuration and constants for the application
 * 
 * @author Zain
 * @version 1.0.0
 */

// Color Scheme
export const COLORS = {
  // Primary Colors
  PRIMARY: '#1a1a2e',
  SECONDARY: '#0f3460',
  ACCENT: '#e94560',
  
  // Text Colors
  TEXT_PRIMARY: '#ffffff',
  TEXT_SECONDARY: '#a8a8a8',
  TEXT_MUTED: '#666666',
  
  // Background Colors
  BACKGROUND_PRIMARY: '#1a1a2e',
  BACKGROUND_SECONDARY: '#16213e',
  BACKGROUND_CARD: '#0f3460',
  
  // Status Colors
  SUCCESS: '#4CAF50',
  WARNING: '#FF9800',
  ERROR: '#F44336',
  INFO: '#2196F3',
} as const;

// Dimensions
export const DIMENSIONS = {
  // Screen Dimensions
  SCREEN_WIDTH: 375, // Standard mobile width
  SCREEN_HEIGHT: 812, // Standard mobile height
  
  // Spacing
  SPACING_XS: 4,
  SPACING_SM: 8,
  SPACING_MD: 16,
  SPACING_LG: 24,
  SPACING_XL: 32,
  SPACING_XXL: 40,
  
  // Border Radius
  BORDER_RADIUS_SM: 8,
  BORDER_RADIUS_MD: 12,
  BORDER_RADIUS_LG: 16,
  BORDER_RADIUS_XL: 20,
  BORDER_RADIUS_CIRCLE: 50,
} as const;

// Animation Durations
export const ANIMATION = {
  FAST: 300,
  NORMAL: 600,
  SLOW: 1000,
  SPLASH_DELAY: 3000,
} as const;

// App Configuration
export const APP_CONFIG = {
  NAME: 'MyFirstReactNativeApp',
  VERSION: '1.0.0',
  AUTHOR: 'Zain',
  DESCRIPTION: 'A professional React Native app with splash screen and login functionality',
} as const;


