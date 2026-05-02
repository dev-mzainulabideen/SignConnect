

/**
 * Enhanced SplashScreen Component
 * Modern splash screen with improved animations and 8-second duration
 * 
 * @author Zain
 * @version 2.0.0
 */

import React, {useEffect, useRef} from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Image,
  Easing,
  Text,
  Dimensions,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onSplashComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({onSplashComplete}) => {
  // Main animations
  const screenOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoRotation = useRef(new Animated.Value(0)).current;
  
  // Text animations
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(30)).current;
  
  // Background elements
  const backgroundScale = useRef(new Animated.Value(0.8)).current;
  const backgroundOpacity = useRef(new Animated.Value(0)).current;
  
  // Loading indicator
  const loadingOpacity = useRef(new Animated.Value(0)).current;
  const loadingScale = useRef(new Animated.Value(0)).current;
  const dotAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  
  // Floating elements
  const floatingElements = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    console.log('SplashScreen: Starting enhanced splash animation');
    
    let isMounted = true;

    // Start background animation
    const backgroundAnimation = Animated.parallel([
      Animated.timing(backgroundOpacity, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(backgroundScale, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]);
    
    if (isMounted) {
      backgroundAnimation.start();
    }

    // Screen fade in
    Animated.timing(screenOpacity, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // Logo entrance animation
    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 1500,
          easing: Easing.out(Easing.back(1.3)),
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 80,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotation, {
          toValue: 1,
          duration: 1800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Text animations
    Animated.sequence([
      Animated.delay(1200),
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 1000,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 1000,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Loading indicator
    Animated.sequence([
      Animated.delay(2000),
      Animated.parallel([
        Animated.timing(loadingOpacity, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(loadingScale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Animated loading dots
    dotAnimations.forEach((dot, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 200),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ).start();
    });

    // Floating elements animation
    floatingElements.forEach((element, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(element, {
            toValue: 1,
            duration: 2000 + index * 500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(element, {
            toValue: 0,
            duration: 2000 + index * 500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ).start();
    });

    // Complete splash after 6 seconds
    const timeoutId = setTimeout(() => {
      console.log('SplashScreen: 6s elapsed, calling onSplashComplete');
      
      // Exit animation
      Animated.parallel([
        Animated.timing(screenOpacity, {
          toValue: 0,
          duration: 500,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 0.8,
          duration: 500,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        onSplashComplete();
      });
    }, 8000);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      
      // Stop all animations to prevent memory leaks
      screenOpacity.stopAnimation();
      logoScale.stopAnimation();
      logoOpacity.stopAnimation();
      logoRotation.stopAnimation();
      titleOpacity.stopAnimation();
      titleTranslateY.stopAnimation();
      backgroundScale.stopAnimation();
      backgroundOpacity.stopAnimation();
      loadingOpacity.stopAnimation();
      loadingScale.stopAnimation();
      
      // Stop dot animations
      dotAnimations.forEach(dot => dot.stopAnimation());
      
      // Stop floating elements
      floatingElements.forEach(element => element.stopAnimation());
    };
  }, [screenOpacity, logoOpacity, logoScale, logoRotation, titleOpacity, titleTranslateY, backgroundScale, backgroundOpacity, loadingOpacity, loadingScale, dotAnimations, floatingElements, onSplashComplete]);

  return (
    <Animated.View style={[styles.container, {opacity: screenOpacity}]}>
      {/* Background gradient effect */}
      <Animated.View 
        style={[
          styles.backgroundGradient,
          {
            opacity: backgroundOpacity,
            transform: [{scale: backgroundScale}],
          },
        ]}
      />
      
      {/* Floating decorative elements */}
      {floatingElements.map((element, index) => {
        const positionStyle = index === 0 ? styles.floatingElement1 :
                             index === 1 ? styles.floatingElement2 :
                             index === 2 ? styles.floatingElement3 :
                             styles.floatingElement4;
        
        return (
          <Animated.View
            key={index}
            style={[
              styles.floatingElement,
              positionStyle,
              {
                opacity: element.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 0.8],
                }),
                transform: [
                  {
                    translateY: element.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -20],
                    }),
                  },
                  {
                    scale: element.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1.2],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.floatingEmoji}>
              {['🤟', '👐', '🙌', '✌️'][index]}
            </Text>
          </Animated.View>
        );
      })}
      
      <View style={styles.centerContent}>
        {/* Logo with enhanced animation */}
        <Animated.View 
          style={{
            transform: [
              {scale: logoScale},
              {
                rotate: logoRotation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }),
              },
            ],
            opacity: logoOpacity,
          }}
        >
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/icons/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <View style={styles.logoGlow} />
          </View>
        </Animated.View>

        {/* App title removed per request */}


        {/* Loading indicator */}
        <Animated.View 
          style={{
            opacity: loadingOpacity,
            transform: [{scale: loadingScale}],
          }}
        >
          <View style={styles.loadingContainer}>
            <View style={styles.loadingDots}>
              <Animated.View 
                style={[
                  styles.loadingDot, 
                  styles.loadingDot1,
                  {
                    transform: [
                      {
                        scale: dotAnimations[0].interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1.2],
                        }),
                      },
                    ],
                    opacity: dotAnimations[0].interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1],
                    }),
                  },
                ]} 
              />
              <Animated.View 
                style={[
                  styles.loadingDot, 
                  styles.loadingDot2,
                  {
                    transform: [
                      {
                        scale: dotAnimations[1].interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1.2],
                        }),
                      },
                    ],
                    opacity: dotAnimations[1].interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1],
                    }),
                  },
                ]} 
              />
              <Animated.View 
                style={[
                  styles.loadingDot, 
                  styles.loadingDot3,
                  {
                    transform: [
                      {
                        scale: dotAnimations[2].interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1.2],
                        }),
                      },
                    ],
                    opacity: dotAnimations[2].interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1],
                    }),
                  },
                ]} 
              />
            </View>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </Animated.View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
  },
  
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    zIndex: 2,
  },
  
  logoContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  
  logo: {
    width: 200,
    height: 200,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  
  logoGlow: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    shadowColor: '#FFFFFF',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 4,
  },
  
  // appTitle removed
  
  
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    marginHorizontal: 4,
  },
  
  loadingDot1: {
    backgroundColor: '#FFFFFF',
  },
  
  loadingDot2: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  
  loadingDot3: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    letterSpacing: 1,
  },
  
  floatingElement: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  
  floatingElement1: {
    top: height * 0.15,
    left: width * 0.1,
  },
  
  floatingElement2: {
    top: height * 0.2,
    right: width * 0.1,
  },
  
  floatingElement3: {
    bottom: height * 0.25,
    left: width * 0.15,
  },
  
  floatingElement4: {
    bottom: height * 0.2,
    right: width * 0.15,
  },
  
  floatingEmoji: {
    fontSize: 24,
  },
});


export default SplashScreen;
