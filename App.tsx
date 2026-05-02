/**
 * Main App Component
 * Manages screen navigation between Splash, Login, Signup, and Main App screens
 * 
 * @author Zain
 * @version 1.0.0
 */

import React, {useState, useEffect, useRef} from 'react';
import {View, StyleSheet, StatusBar, Alert, Text, AppState, AppStateStatus} from 'react-native';
import firebaseService from './src/config/firebase';

// Import screen components
import SplashScreen from './src/screens/SplashScreen';
import GetStartedScreen from './src/screens/GetStartedScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import MainAppScreen from './src/screens/MainAppScreen';

// Import types
import {User} from './src/types/auth';
import { ThemeProvider } from './src/theme/ThemeContext';

type ScreenType = 'splash' | 'getStarted' | 'login' | 'signup' | 'main';

function App() {
  // Configure Google Sign-In (Web client ID from Firebase Web app)
  // Ensures idToken is returned on Android
  React.useEffect(() => {
    try {
      firebaseService.configureGoogle('349652946238-ibohdpops1hjuohgja42dvurgbqal92u.apps.googleusercontent.com');
    } catch {}
  }, []);
  
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('splash');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [splashComplete, setSplashComplete] = useState(false);
  const [connectionRetries, setConnectionRetries] = useState(0);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  console.log('App render - currentScreen:', currentScreen, 'splashComplete:', splashComplete, 'isLoading:', isLoading);

  useEffect(() => {
    // Check if user is already authenticated
    const unsubscribe = firebaseService.onAuthStateChanged((user: User | null) => {
      console.log('Auth state changed:', user ? 'User logged in' : 'No user');
      setCurrentUser(user);
      setIsLoading(false);
      
      // Auto-navigate to main if user is authenticated AND splash is complete
      if (user && splashComplete) {
        console.log('User authenticated and splash complete, going to main screen');
        setCurrentScreen('main');
      }
    });
    
    return unsubscribe;
  }, [splashComplete, currentScreen]);

  // Add a timeout to prevent infinite loading
  useEffect(() => {
    const loadingTimeout = setTimeout(() => {
      if (isLoading) {
        console.log('Loading timeout reached, forcing loading to false');
        setIsLoading(false);
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(loadingTimeout);
  }, [isLoading]);

  // Connection stability and app state management
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.log('App state changed from', appStateRef.current, 'to', nextAppState);
      
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App has come to the foreground!');
        // Reset connection retries when app becomes active
        setConnectionRetries(0);
      }
      
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Connection retry logic
  useEffect(() => {
    if (connectionRetries > 0 && connectionRetries < 3) {
      console.log(`Connection retry ${connectionRetries}/3`);
      retryTimeoutRef.current = setTimeout(() => {
        setConnectionRetries(prev => prev + 1);
      }, 2000 * connectionRetries); // Exponential backoff
    } else if (connectionRetries >= 3) {
      console.log('Max connection retries reached');
      Alert.alert(
        'Connection Issue', 
        'Unable to maintain stable connection. Please restart the app.',
        [{ text: 'OK', onPress: () => setConnectionRetries(0) }]
      );
    }
  }, [connectionRetries]);

  const handleSplashComplete = () => {
    console.log('Splash complete');
    setSplashComplete(true);
    // If a user is already authenticated, go straight to main; otherwise go to get started
    if (currentUser) {
      console.log('User already authenticated, going to main screen');
      setCurrentScreen('main');
    } else {
      console.log('No user, going to get started screen');
      setCurrentScreen('getStarted');
    }
  };

  const handleLoginSuccess = (userData: User) => {
    console.log('Login successful:', userData);
    setCurrentUser(userData);
    setCurrentScreen('main');
    Alert.alert('Success', 'Welcome back!');
  };

  const handleSignupSuccess = (userData: User) => {
    console.log('Signup successful:', userData);
    setCurrentUser(userData);
    // After signup, go to login screen to let user sign in
    setCurrentScreen('login');
    Alert.alert('Success', 'Account created successfully! Please sign in.');
  };

  const handleNavigateToSignup = () => {
    console.log('Navigating to signup');
    setCurrentScreen('signup');
  };

  const handleNavigateToSignIn = () => {
    console.log('Navigating to sign in');
    setCurrentScreen('login');
  };

  const handleNavigateToSignUp = () => {
    console.log('Navigating to sign up');
    setCurrentScreen('signup');
  };

  const handleBackToLogin = () => {
    console.log('Going back to login');
    setCurrentScreen('login');
  };

  const handleBackToGetStarted = () => {
    console.log('Going back to get started');
    setCurrentScreen('getStarted');
  };

  const handleLogout = () => {
    console.log('Logging out');
    // If no current user, treat as already signed out
    if (!currentUser) {
      try { (globalThis as any).currentUserId = undefined; } catch {}
      setCurrentUser(null);
      setSplashComplete(false);
      setCurrentScreen('splash');
      return;
    }
    firebaseService.signOut().then(() => {
      try { (globalThis as any).currentUserId = undefined; } catch {}
      setCurrentUser(null);
      // Reset to splash on logout
      setSplashComplete(false);
      setCurrentScreen('splash');
      Alert.alert('Success', 'Logged out successfully');
    }).catch((error: any) => {
      // Swallow "no-current-user" and proceed as success
      const msg: string = error?.message || '';
      const code: string = error?.code || '';
      if (code === 'auth/no-current-user' || /no current user/i.test(msg)) {
        try { (globalThis as any).currentUserId = undefined; } catch {}
        setCurrentUser(null);
        setSplashComplete(false);
        setCurrentScreen('splash');
        return;
      }
      Alert.alert('Error', 'Failed to logout: ' + msg);
    });
  };

  // Show splash screen until it's complete
  if (!splashComplete) {
    console.log('Showing splash screen');
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <SplashScreen onSplashComplete={handleSplashComplete} />
      </View>
    );
  }

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
          <Text style={styles.loadingSubtext}>Checking authentication...</Text>
        </View>
      </View>
    );
  }

  const renderCurrentScreen = () => {
    console.log('Rendering screen:', currentScreen, 'User:', currentUser ? 'logged in' : 'not logged in', 'Loading:', isLoading);
    
    switch (currentScreen) {
      case 'getStarted':
        return (
          <GetStartedScreen
            onNavigateToSignIn={handleNavigateToSignIn}
            onNavigateToSignUp={handleNavigateToSignUp}
          />
        );
      case 'login':
        return (
          <LoginScreen 
            onLoginSuccess={handleLoginSuccess}
            onNavigateToSignup={handleNavigateToSignup}
            onBackToGetStarted={handleBackToGetStarted}
          />
        );
      case 'signup':
        return (
          <SignupScreen 
            onSignupSuccess={handleSignupSuccess}
            onBackToLogin={handleBackToLogin}
            onBackToGetStarted={handleBackToGetStarted}
          />
        );
      case 'main':
        return (
          <MainAppScreen 
            user={currentUser}
            onLogout={handleLogout}
          />
        );
      default:
        console.log('Unknown screen type, defaulting to getStarted');
        return (
          <GetStartedScreen
            onNavigateToSignIn={handleNavigateToSignIn}
            onNavigateToSignUp={handleNavigateToSignUp}
          />
        );
    }
  };

  return (
    <ThemeProvider>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
        {renderCurrentScreen()}
      </View>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  loadingText: {
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#a8a8a8',
  },
});

export default App;
