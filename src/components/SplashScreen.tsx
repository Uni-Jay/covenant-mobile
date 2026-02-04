import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish?: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Show button after 2 seconds
    setTimeout(() => {
      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 2000);
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#ffffff', '#f0f9ff', '#dbeafe']}
        style={styles.gradient}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Church Logo Image */}
          <Image
            source={require('../../assets/images/Word of Covenant Logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />

          {/* Continue Button */}
          {onFinish && (
            <Animated.View style={[styles.buttonContainer, { opacity: buttonAnim }]}>
              <TouchableOpacity style={styles.continueButton} onPress={onFinish}>
                <Text style={styles.continueButtonText}>TAP TO CONTINUE</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: width * 0.85,
    height: height * 0.6,
    marginBottom: 40,
  },
  buttonContainer: {
    marginTop: 40,
  },
  continueButton: {
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 2,
  },
});
