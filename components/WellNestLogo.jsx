import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const WellNestLogo = ({ size = 120, showText = true, style }) => {
  return (
    <View style={[{ alignItems: 'center', backgroundColor: 'transparent' }, style]}>
      {/* WellNest Text */}
      <Text style={[styles.logoText, { fontSize: size * 0.35 }]}>
        WellNest
      </Text>
      
      {/* Tagline */}
      {showText && (
        <Text style={[styles.tagline, { fontSize: size * 0.12 }]}>
          Nurturing Your Well-being
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  logoText: {
    fontWeight: '700',
    color: '#2C3E50',
    textAlign: 'center',
    letterSpacing: 4,
    fontSize: 42,
    fontFamily: 'System',
    textShadowColor: 'transparent',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 0,
    elevation: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  tagline: {
    color: '#5D6D7E',
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '400',
    letterSpacing: 2,
    fontSize: 14,
    fontFamily: 'System',
    textTransform: 'uppercase',
    textShadowColor: 'transparent',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 0,
    elevation: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
});

export default WellNestLogo;
