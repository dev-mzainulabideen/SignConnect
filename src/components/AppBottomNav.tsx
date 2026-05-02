import React, {useEffect, useMemo, useRef, useState, useCallback} from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  Animated,
  Platform,
  LayoutChangeEvent,
  Easing,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {BlurView} from '@react-native-community/blur';
import Svg, {Path, Defs, LinearGradient, Stop} from 'react-native-svg';
import { useTheme } from '../theme/ThemeContext';

export type AppTab = 'translate' | 'history' | 'profile';

const tabs: {key: AppTab; label: string; icon: string; activeIcon?: string}[] = [
  {key: 'translate', label: 'Translation', icon: 'translate', activeIcon: 'translate'},
  {key: 'history', label: 'History', icon: 'history', activeIcon: 'history'},
  {key: 'profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person'},
];

interface Props {
  selectedTab: AppTab;
  onSelect: (t: AppTab) => void;
  safeBottom?: number;
  activeColor?: string;
  inactiveColor?: string;
  highlightColor?: string;
  barColor?: string;
  rippleColor?: string;
  enableHaptic?: boolean;
  showLabels?: boolean;
  compactMode?: boolean;
  enableBlur?: boolean;
}

const AppBottomNav: React.FC<Props> = ({
  selectedTab,
  onSelect,
  safeBottom = Platform.select({ios: 34, android: 16, default: 16}) as number,
  activeColor = '#4169E1',
  inactiveColor = '#94A3B8',
  highlightColor = '#EC4899',
  barColor = '#FFFFFF',
  rippleColor = '#E5E7EB',
  enableHaptic = true,
  compactMode = false,
  showLabels = true,
  enableBlur = Platform.OS === 'ios',
}) => {
  const { palette } = useTheme();
  // Layout
  const [barWidth, setBarWidth] = useState(0);
  const slotCount = tabs.length;

  // Ensure a valid active index
  const computedIndex = tabs.findIndex(t => t.key === selectedTab);
  const activeIndex = computedIndex >= 0 ? computedIndex : 0;

  // Indicator and bar motion
  const indicatorX = useRef(new Animated.Value(0)).current;
  const indicatorScale = useRef(new Animated.Value(1)).current;
  const barScale = useRef(new Animated.Value(1)).current;

  // Per-tab animations
  const iconScales = useRef(tabs.map(() => new Animated.Value(1))).current;
  const activeIconOpacity = useRef(new Animated.Value(1)).current;
  const labelOpacity = useRef(tabs.map(() => new Animated.Value(0))).current;

  // Floating circle vertical bob
  const floatingAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // New animations
  const glowAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  // Added: breathing pulse and press ring
  const circleBreathAnim = useRef(new Animated.Value(0)).current;
  const pressRingAnim = useRef(new Animated.Value(0)).current;

  const onBarLayout = useCallback((e: LayoutChangeEvent) => {
    setBarWidth(e.nativeEvent.layout.width);
  }, []);

  // Entry and floating animations
  useEffect(() => {
    Animated.parallel([
      Animated.spring(barScale, {
        toValue: 1,
        tension: 120,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.stagger(100, tabs.map((_, i) => 
        Animated.timing(labelOpacity[i], {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        })
      )),
    ]).start();

    const floatingSequence = Animated.loop(
      Animated.sequence([
        Animated.timing(floatingAnim, {
          toValue: 1,
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatingAnim, {
          toValue: 0,
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    floatingSequence.start();

    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 3500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Sparkle animation
    Animated.loop(
      Animated.timing(sparkleAnim, {
        toValue: 1,
        duration: 50000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Circle breathing micro-pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(circleBreathAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(circleBreathAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    return () => {
      floatingSequence.stop();
    };
  }, [barScale, floatingAnim, glowAnim, sparkleAnim, labelOpacity, circleBreathAnim]);

  // Tab change animations
  useEffect(() => {
    if (barWidth === 0) return;

    const slotWidth = barWidth / slotCount;

    // Wave animation on tab change
    waveAnim.setValue(0);
    Animated.timing(waveAnim, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.sin),
      useNativeDriver: true,
    }).start();

    // Move and pop the circle
    Animated.parallel([
      Animated.spring(indicatorX, {
        toValue: activeIndex * slotWidth,
        tension: 220,
        friction: 20,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.spring(indicatorScale, {
          toValue: 1.3,
          tension: 180,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.spring(indicatorScale, {
          toValue: 1,
          tension: 160,
          friction: 10,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Animate active icon opacity
    Animated.spring(activeIconOpacity, {
      toValue: 1,
      tension: 160,
      friction: 10,
      useNativeDriver: true,
    }).start();

    // Icons animate
    iconScales.forEach((v, i) => {
      Animated.spring(v, {
        toValue: i === activeIndex ? 1.1 : 1,
        tension: 160,
        friction: 8,
        useNativeDriver: true,
      }).start();
    });
  }, [activeIndex, barWidth, indicatorX, indicatorScale, iconScales, activeIconOpacity, slotCount, waveAnim]);

  // Press interactions
  const handlePressIn = (idx: number) => {
    if (enableHaptic && Platform.OS === 'ios') {
      // Implement haptic feedback here if desired
    }

    // Restart press ring pulse
    pressRingAnim.stopAnimation(() => {
      pressRingAnim.setValue(0);
      Animated.timing(pressRingAnim, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    });

    Animated.parallel([
      Animated.spring(iconScales[idx], {
        toValue: idx === activeIndex ? 1.06 : 0.9,
        tension: 320,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 0.92,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = (idx: number, isActive: boolean) => {
    Animated.parallel([
      Animated.spring(iconScales[idx], {
        toValue: isActive ? 1.1 : 1,
        tension: 220,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.spring(pulseAnim, {
        toValue: 1,
        tension: 180,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Animation styles
  const iconAnimStyles = useMemo(
    () => tabs.map((_, i) => ({
      transform: [
        {scale: iconScales[i]},
      ],
    })),
    [iconScales],
  );

  const slotWidth = barWidth / slotCount;

  const barBackgroundStyle = {
    backgroundColor: enableBlur ? 'transparent' : (barColor || palette.surface),
  };
  // duplicate removed

  // Container for the floating circle (Animated.View wraps SVG)
  const circleContainerStyle = {
    width: compactMode ? 40 : 48,
    height: compactMode ? 40 : 48,
    borderRadius: (compactMode ? 40 : 48) / 2,
    position: 'absolute' as const,
    top: 0,
    left: 0,
    transform: [
      { translateX: indicatorX },
      { translateX: (slotWidth - (compactMode ? 40 : 48)) / 2 },
      { translateY: 15 },
      { scale: indicatorScale },
      { 
        scale: circleBreathAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.04],
        })
      },
      {
        translateY: floatingAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [-30, -34],
        }),
      },
    ],
  };

  // Active icon style (renders inside the floating circle)
  const activeIconStyle = {
    transform: [
      { translateX: indicatorX },
      { translateX: (slotWidth - 22) / 2 },
      { translateY: 32 },
      {
        translateY: floatingAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [-42, -46],
        }),
      },
      { scale: activeIconOpacity },
    ],
    opacity: activeIconOpacity,
  };

  // Floating transform for the whole bar content
  const barTransform = {
    transform: [
      {scale: barScale},
      {scale: pulseAnim},
    ],
  };

  // Underline active indicator (inside the bar, bottom aligned)
  const underlineStyle = {
    width: Math.min(36, slotWidth * 0.5),
    transform: [
      { translateX: indicatorX },
      { translateX: (slotWidth - Math.min(36, slotWidth * 0.5)) / 2 },
      {
        scaleX: waveAnim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.8, 1.2, 1],
        }),
      },
    ],
  };

  // Glow effect around active tab
  const glowStyle = {
    opacity: glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.7],
    }),
    transform: [
      { translateX: indicatorX },
      { translateX: (slotWidth - (compactMode ? 56 : 64)) / 2 },
      { scale: glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.8, 1.2],
      })},
    ],
  };

  const activeTab = tabs[activeIndex];
  
  // Sparkle particles animation
  const sparkleParticles = useMemo(() => {
    return Array.from({length: 8}).map((_, i) => {
      const angle = (i / 8) * Math.PI * 2;
      const radius = compactMode ? 28 : 32;
      
      const translateX = sparkleAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, Math.cos(angle) * radius],
      });
      
      const translateY = sparkleAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, Math.sin(angle) * radius],
      });
      
      const opacity = sparkleAnim.interpolate({
        inputRange: [0, 0.2, 0.8, 1],
        outputRange: [0, 1, 1, 0],
      });
      
      const scale = sparkleAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 1, 0],
      });
      
      return (
        <Animated.View
          key={i}
          style={[
            styles.sparkle,
            {
              backgroundColor: highlightColor,
              transform: [
                { translateX },
                { translateY },
                { scale },
              ],
              opacity,
            },
          ]}
        />
      );
    });
  }, [sparkleAnim, highlightColor, compactMode]);

  // Calculate dynamic styles (using themed barBackgroundStyle defined above)

  // Press ring style aligned to the circle
  const pressRingStyle = useMemo(() => {
    const ringSize = compactMode ? 40 : 48;
    const scale = pressRingAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.6, 1.6],
    });
    const opacity = pressRingAnim.interpolate({
      inputRange: [0, 0.3, 1],
      outputRange: [0.6, 0.35, 0],
    });
    return [
      styles.pressRing,
      {
        width: ringSize,
        height: ringSize,
        borderRadius: ringSize / 2,
        opacity,
        transform: [
          { translateX: indicatorX },
          { translateX: (slotWidth - ringSize) / 2 },
          { translateY: 15 },
          {
            translateY: floatingAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [-30, -34],
            }),
          },
          { scale },
        ],
        borderColor: highlightColor,
      },
    ];
  }, [compactMode, pressRingAnim, indicatorX, slotWidth, floatingAnim, highlightColor]);

  return (
    <View style={[styles.navContainer, {paddingBottom: safeBottom}]}>
      <Animated.View style={[styles.wrap, barTransform]}>
        
        {/* Background with blur effect */}
        {enableBlur ? (
          <BlurView
            style={[styles.blurView, StyleSheet.absoluteFillObject]}
            blurType="light"
            blurAmount={10}
            reducedTransparencyFallbackColor="white"
          />
        ) : (
          <View style={[StyleSheet.absoluteFillObject, styles.backgroundView, { backgroundColor: palette.surface }]} />
        )}
        
        {/* Floating Layer with animations */}
        {barWidth > 0 && (
          <View style={styles.floatingLayer} pointerEvents="none">
            {/* Glow effect */}
            <Animated.View
              style={[
                styles.glow,
                {backgroundColor: highlightColor},
                glowStyle,
              ]}
            />
            
            {/* Sparkle particles */}
            <Animated.View
              style={[
                styles.sparkleContainer,
                {
                  transform: [
                    { translateX: indicatorX },
                    { translateX: (slotWidth - 4) / 2 },
                    { translateY: 32 },
                  ],
                },
              ]}
            >
              {sparkleParticles}
            </Animated.View>

            {/* Press pulse ring */}
            <Animated.View style={pressRingStyle} pointerEvents="none" />
            
            {/* Circle indicator (Animated container wraps static SVG) */}
            <Animated.View style={circleContainerStyle}>
              <Svg width={compactMode ? 40 : 48} height={compactMode ? 40 : 48} style={styles.circleSvg}>
                <Defs>
                  <LinearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor={highlightColor} stopOpacity="1" />
                    <Stop offset="100%" stopColor={activeColor} stopOpacity="1" />
                  </LinearGradient>
                </Defs>
                <Path
                  d={`M${compactMode ? 20 : 24},2 a${compactMode ? 18 : 22},${compactMode ? 18 : 22} 0 1,0 0,${compactMode ? 36 : 44} a${compactMode ? 18 : 22},${compactMode ? 18 : 22} 0 1,0 0,-${compactMode ? 36 : 44}`}
                  fill="url(#gradient)"
                />
              </Svg>
            </Animated.View>
            
            {/* Active icon inside circle */}
            <Animated.View style={[styles.activeIconContainer, activeIconStyle]}>
              <Icon
                name={activeTab?.activeIcon || activeTab?.icon}
                size={compactMode ? 18 : 24}
                color="#FFFFFF"
              />
            </Animated.View>
          </View>
        )}

        <View 
          onLayout={onBarLayout}
          style={[
            styles.bar,
            compactMode && styles.compactBar,
            barBackgroundStyle,
          ]}
        >
          {/* Tabs with integrated labels */}
          {tabs.map((t, i) => {
            const isActive = selectedTab === t.key;
            return (
              <Pressable
                key={t.key}
                onPressIn={() => handlePressIn(i)}
                onPressOut={() => handlePressOut(i, isActive)}
                onPress={() => onSelect(t.key)}
                android_ripple={{
                  color: rippleColor,
                  radius: 18,
                  borderless: true,
                }}
                style={[styles.tab, compactMode && styles.compactTab]}
                accessibilityRole="tab"
                accessibilityLabel={t.label}
                accessibilityState={{selected: isActive}}
              >
                {/* Icon (hidden when active, visible when inactive) */}
                <Animated.View style={[
                  styles.iconContainer, 
                  iconAnimStyles[i],
                  isActive ? styles.iconHidden : styles.iconVisible,
                ]}>
                  <Icon
                    name={t.icon}
                    size={compactMode ? 18 : 24}
                    color={inactiveColor}
                  />
                </Animated.View>

                {/* Label integrated into navbar */}
                {showLabels && (
                  <Animated.Text
                    style={[
                      styles.integratedLabel,
                      {color: isActive ? activeColor : inactiveColor},
                      isActive && styles.activeIntegratedLabel,
                      {opacity: labelOpacity[i]},
                    ]}
                  >
                    {t.label}
                  </Animated.Text>
                )}
              </Pressable>
            );
          })}

          {/* Underline active indicator */}
          {barWidth > 0 && (
            <Animated.View
              style={[
                styles.underline,
                {backgroundColor: highlightColor},
                underlineStyle,
              ]}
            />
          )}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  navContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 6, // Moved 6 points above
    zIndex: 10,
  },
  wrap: {
    borderRadius: 28,
    overflow: 'visible',
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  blurView: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  backgroundView: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
  },
  floatingLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    overflow: 'visible',
  },
  bar: {
    borderRadius: 24,
    paddingVertical: 12, // Increased padding to accommodate labels
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    minHeight: 30, // Increased height for labels
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  compactBar: {
    paddingVertical: 10,
    minHeight: 64,
    borderRadius: 20,
  },
  circleSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  glow: {
   
  },
  sparkleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 4,
    height: 4,
    zIndex: 15,
  },
  sparkle: {
  
  },
  activeIconContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
    zIndex: 20,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    zIndex: 5,
    minHeight: 60, // Increased height for labels
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
  },
  compactTab: {
    paddingVertical: 6,
    minHeight: 54,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 5,
    width: 36,
    height: 36,
    borderRadius: 18,
    marginBottom: 4, // Space between icon and label
  },
  iconHidden: {
    opacity: 0,
  },
  iconVisible: {
    opacity: 1,
  },
  integratedLabel: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 2,
  },
  activeIntegratedLabel: {
    fontWeight: '700',
  },
  underline: {
    position: 'absolute',
    height: 4,
    borderRadius: 5,
    bottom: 8, // Adjusted for new layout
    left: 0,
  },
  pressRing: {
   
  },
});

export default AppBottomNav;