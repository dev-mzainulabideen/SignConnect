/**
 * Firebase Configuration
 * Handles Firebase initialization and authentication methods
 * 
 * @author Zain
 * @version 1.0.0
 */

import auth, {FirebaseAuthTypes} from '@react-native-firebase/auth';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {User, LoginData, SignUpCredentials} from '../types/auth';

class FirebaseService {
  private googleConfigured = false;
  private googleSignInInProgress = false;
  
  // Web Client ID from google-services.json (client_type: 3)
  // This is required for Google Sign-In to work properly
  private readonly WEB_CLIENT_ID = '349652946238-ibohdpops1hjuohgja42dvurgbqal92u.apps.googleusercontent.com';

  /**
   * Configure Google Sign-In
   * Call once (e.g., App startup). Pass your Web Client ID for Android.
   * If no webClientId is provided, uses the default from google-services.json
   */
  configureGoogle(webClientId?: string) {
    if (this.googleConfigured) {
      console.log('Google Sign-In already configured');
      return;
    }
    
    try {
      const clientId = webClientId || this.WEB_CLIENT_ID;
      
      if (!clientId) {
        console.warn('Google Sign-In: No Web Client ID provided. Please configure it in Firebase Console.');
        throw new Error('Web Client ID is required for Google Sign-In');
      }
      
      GoogleSignin.configure({
        webClientId: clientId,
        offlineAccess: true,
        forceCodeForRefreshToken: false,
        // Additional configuration for better compatibility
        iosClientId: undefined, // Set this if you have iOS app
      });
      
      this.googleConfigured = true;
      console.log('Google Sign-In configured successfully with Web Client ID:', clientId.substring(0, 20) + '...');
    } catch (e: any) {
      console.error('Google Sign-In configure failed:', e);
      this.googleConfigured = false;
      throw new Error(`Failed to configure Google Sign-In: ${e.message || 'Unknown error'}`);
    }
  }

  /**
   * Sign up with email and password
   */
  async signUp(userData: SignUpCredentials): Promise<User> {
    try {
      const {email, password, name} = userData;
      
      console.log('Creating user account for:', email);
      
      // Create user with email and password
      const userCredential = await auth().createUserWithEmailAndPassword(
        email,
        password
      );
      
      console.log('User account created successfully');
      
      // Update user profile with display name
      if (userCredential.user) {
        await userCredential.user.updateProfile({
          displayName: name,
        });
        console.log('User profile updated with display name');
      }
      
      // Convert Firebase user to our User type
      const user: User = {
        id: userCredential.user.uid,
        email: userCredential.user.email || email,
        name: name,
        avatar: userCredential.user.photoURL || undefined,
        createdAt: new Date(),
      };
      
      console.log('User object created:', user);
      return user;
    } catch (error: any) {
      console.error('Sign up error:', error);
      let errorMessage = 'An error occurred during sign up';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'This email is already registered. Please use a different email or try signing in.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak. Please choose a stronger password.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Email/password accounts are not enabled. Please contact support.';
          break;
        default:
          errorMessage = error.message || errorMessage;
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(credentials: LoginData): Promise<User> {
    try {
      const {email, password} = credentials;
      
      console.log('Signing in user:', email);
      
      // Sign in with email and password
      const userCredential = await auth().signInWithEmailAndPassword(
        email,
        password
      );
      
      console.log('User signed in successfully');
      
      // Convert Firebase user to our User type
      const user: User = {
        id: userCredential.user.uid,
        email: userCredential.user.email || email,
        name: userCredential.user.displayName || email.split('@')[0],
        avatar: userCredential.user.photoURL || undefined,
        createdAt: new Date(userCredential.user.metadata.creationTime || Date.now()),
      };
      
      console.log('User object created for sign in:', user);
      return user;
    } catch (error: any) {
      console.error('Sign in error:', error);
      let errorMessage = 'An error occurred during sign in';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email. Please check your email or sign up.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password. Please try again.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled. Please contact support.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later.';
          break;
        default:
          errorMessage = error.message || errorMessage;
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Sign in with Google (Android/iOS)
   */
  async signInWithGoogle(): Promise<User> {
    try {
      if (this.googleSignInInProgress) {
        throw new Error('Google sign-in already in progress');
      }
      
      this.googleSignInInProgress = true;
      
      // Ensure Google Sign-In is configured
      if (!this.googleConfigured) {
        try {
          this.configureGoogle();
        } catch (configError: any) {
          throw new Error(`Google Sign-In configuration failed: ${configError.message}`);
        }
      }

      // Check if Google Play Services are available
      try {
        await GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog: true});
      } catch (playServicesError: any) {
        throw new Error('Google Play Services are not available. Please install Google Play Services.');
      }
      
      // Try to get current user tokens first (if user is already signed in)
      try {
        const tokens = await GoogleSignin.getTokens();
        if (tokens && tokens.idToken) {
          // User is already signed in with valid token, try to use it
          try {
            const googleCredential = auth.GoogleAuthProvider.credential(tokens.idToken);
            const userCredential = await auth().signInWithCredential(googleCredential);
            const firebaseUser = userCredential.user;
            
            const user: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              avatar: firebaseUser.photoURL || undefined,
              createdAt: new Date(firebaseUser.metadata.creationTime || Date.now()),
            };
            
            console.log('Google sign-in success (existing session) for:', user.email);
            return user;
          } catch (credentialError) {
            // Token might be expired, continue with fresh sign-in
            console.log('Existing token invalid or expired, proceeding with fresh sign-in');
            await GoogleSignin.signOut().catch(() => {
              // Ignore sign-out errors
            });
          }
        }
      } catch (tokenError) {
        // No existing session or tokens unavailable, continue with fresh sign-in
        console.log('No existing Google sign-in session, proceeding with fresh sign-in');
      }
      
      // Sign in with Google
      let signInResult;
      try {
        signInResult = await GoogleSignin.signIn();
      } catch (signInError: any) {
        // Handle specific Google Sign-In errors
        if (signInError.code === 'DEVELOPER_ERROR') {
          throw new Error(
            'Google Sign-In configuration error. Please ensure:\n' +
            '1. SHA-1 fingerprint is registered in Firebase Console\n' +
            '2. Web Client ID is correctly configured\n' +
            '3. Package name matches Firebase project\n' +
            '4. google-services.json is up to date'
          );
        }
        if (signInError.code === 'SIGN_IN_CANCELLED') {
          throw new Error('Sign-in was cancelled');
        }
        throw signInError;
      }
      
      if (!signInResult || !signInResult.data) {
        throw new Error('Google sign-in failed: No sign-in data received');
      }
      
      const {idToken} = signInResult.data;
      if (!idToken) {
        throw new Error('Google sign-in failed: No idToken received');
      }

      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      
      // Sign-in the user with the credential
      let userCredential;
      try {
        userCredential = await auth().signInWithCredential(googleCredential);
      } catch (credentialError: any) {
        console.error('Firebase credential error:', credentialError);
        throw new Error(`Firebase authentication failed: ${credentialError.message || 'Invalid credential'}`);
      }

      const firebaseUser = userCredential.user;
      const userInfo = signInResult.data.user;
      
      const user: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || userInfo?.email || '',
        name: firebaseUser.displayName || userInfo?.name || (firebaseUser.email?.split('@')[0] || 'User'),
        avatar: firebaseUser.photoURL || userInfo?.photo || undefined,
        createdAt: new Date(firebaseUser.metadata.creationTime || Date.now()),
      };

      console.log('Google sign-in success for:', user.email);
      return user;
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      
      // Provide user-friendly error messages
      let errorMessage = 'Failed to sign in with Google';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.code) {
        switch (error.code) {
          case 'DEVELOPER_ERROR':
            errorMessage = 'Google Sign-In configuration error. Please contact support.';
            break;
          case 'SIGN_IN_CANCELLED':
            errorMessage = 'Sign-in was cancelled';
            break;
          case 'SIGN_IN_REQUIRED':
            errorMessage = 'Please sign in again';
            break;
          case 'INVALID_ACCOUNT':
            errorMessage = 'Invalid Google account';
            break;
          default:
            errorMessage = `Google Sign-In error: ${error.code}`;
        }
      }
      
      throw new Error(errorMessage);
    } finally {
      this.googleSignInInProgress = false;
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    try {
      console.log('Signing out user');
      await auth().signOut();
      console.log('User signed out successfully');
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw new Error('Failed to sign out: ' + error.message);
    }
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser(): User | null {
    const firebaseUser = auth().currentUser;
    if (!firebaseUser) {
      console.log('No current user found');
      return null;
    }
    
    const user: User = {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
      avatar: firebaseUser.photoURL || undefined,
      createdAt: new Date(firebaseUser.metadata.creationTime || Date.now()),
    };
    
    console.log('Current user found:', user);
    return user;
  }

  /**
   * Listen to authentication state changes
   */
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    console.log('Setting up auth state listener');
    
    const authInstance = auth();
    
    // Use the onAuthStateChanged method from React Native Firebase
    const unsubscribe = authInstance.onAuthStateChanged(
      (firebaseUser: FirebaseAuthTypes.User | null) => {
        console.log('Auth state changed, firebase user:', firebaseUser ? firebaseUser.uid : 'null');
        
        if (!firebaseUser) {
          console.log('No user authenticated, calling callback with null');
          callback(null);
          return;
        }
        
        const user: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          avatar: firebaseUser.photoURL || undefined,
          createdAt: new Date(firebaseUser.metadata.creationTime || Date.now()),
        };
        
        console.log('User authenticated, calling callback with user:', user);
        callback(user);
      }
    );
    
    return unsubscribe;
  }

  /**
   * Reset password for email
   */
  async resetPassword(email: string): Promise<void> {
    try {
      // Validate email format before sending
      if (!email || !email.trim()) {
        throw new Error('Please enter your email address.');
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        throw new Error('Please enter a valid email address.');
      }

      console.log('Sending password reset email to:', email);
      await auth().sendPasswordResetEmail(email.trim());
      console.log('Password reset email sent successfully');
    } catch (error: any) {
      console.error('Password reset error:', error);
      let errorMessage = 'Failed to send password reset email. Please try again.';
      
      // Handle Firebase Auth errors
      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
            errorMessage = 'No account found with this email address. Please check your email and try again.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Please enter a valid email address.';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Too many password reset requests. Please wait a few minutes before trying again.';
            break;
          case 'auth/network-request-failed':
            errorMessage = 'Network error. Please check your internet connection and try again.';
            break;
          case 'auth/user-disabled':
            errorMessage = 'This account has been disabled. Please contact support.';
            break;
          default:
            errorMessage = error.message || errorMessage;
        }
      } else if (error.message) {
        // Handle custom validation errors
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: {displayName?: string; photoURL?: string}): Promise<void> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('No user is currently signed in');
      }
      
      console.log('Updating user profile:', updates);
      await currentUser.updateProfile(updates);
      console.log('User profile updated successfully');
    } catch (error: any) {
      console.error('Profile update error:', error);
      throw new Error('Failed to update profile: ' + error.message);
    }
  }

  /**
   * Update user email
   */
  async updateEmail(newEmail: string): Promise<void> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('No user is currently signed in');
      }
      await currentUser.updateEmail(newEmail);
    } catch (error: any) {
      // Commonly requires recent re-authentication
      throw new Error(error?.message || 'Failed to update email');
    }
  }

  /**
   * Change user password
   * Requires current password for re-authentication
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('No user is currently signed in');
      }

      if (!currentUser.email) {
        throw new Error('User email not found. Cannot change password.');
      }

      // Validate new password strength
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
      if (!passwordRegex.test(newPassword)) {
        throw new Error('Password must be 8+ characters with uppercase, lowercase, number, and symbol.');
      }

      // Re-authenticate user with current password
      const emailCredential = auth.EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
      );

      try {
        await currentUser.reauthenticateWithCredential(emailCredential);
      } catch (reauthError: any) {
        console.error('Re-authentication error:', reauthError);
        if (reauthError.code === 'auth/wrong-password') {
          throw new Error('Current password is incorrect.');
        }
        if (reauthError.code === 'auth/invalid-credential') {
          throw new Error('Current password is incorrect.');
        }
        if (reauthError.code === 'auth/too-many-requests') {
          throw new Error('Too many attempts. Please try again later.');
        }
        throw new Error(reauthError.message || 'Re-authentication failed. Please check your current password.');
      }

      // Update password after successful re-authentication
      await currentUser.updatePassword(newPassword);
      console.log('Password updated successfully');
    } catch (error: any) {
      console.error('Change password error:', error);
      
      // Provide user-friendly error messages
      if (error.message) {
        throw error; // Re-throw if it's already a user-friendly message
      }
      
      let errorMessage = 'Failed to change password. Please try again.';
      
      if (error.code) {
        switch (error.code) {
          case 'auth/weak-password':
            errorMessage = 'New password is too weak. Please choose a stronger password.';
            break;
          case 'auth/requires-recent-login':
            errorMessage = 'For security, please sign out and sign in again before changing your password.';
            break;
          default:
            errorMessage = error.message || errorMessage;
        }
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Force clear authentication state (for testing)
   */
  async forceSignOut(): Promise<void> {
    try {
      console.log('Force signing out user');
      await auth().signOut();
      console.log('User force signed out successfully');
    } catch (error: any) {
      console.error('Force sign out error:', error);
      // Continue even if there's an error
    }
  }
}

// Create and export a single instance
const firebaseService = new FirebaseService();
export default firebaseService;
