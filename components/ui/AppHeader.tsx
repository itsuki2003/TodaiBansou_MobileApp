import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightElement?: React.ReactNode;
}

export default function AppHeader({ 
  title, 
  subtitle, 
  showBackButton = false, 
  onBackPress,
  rightElement 
}: AppHeaderProps) {
  return (
    <View style={styles.header}>
      {/* Left Section - Logo or Back Button */}
      <View style={styles.leftSection}>
        {showBackButton ? (
          <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
            <ChevronLeft size={24} color="#1E293B" />
          </TouchableOpacity>
        ) : (
          <Image source={require('../../logo.png')} style={styles.logo} />
        )}
      </View>

      {/* Center Section - Title and Subtitle */}
      <View style={styles.centerSection}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && (
          <Text style={styles.subtitle}>{subtitle}</Text>
        )}
      </View>

      {/* Right Section - Custom Element or Spacer */}
      <View style={styles.rightSection}>
        {rightElement || <View style={styles.spacer} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 60,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  leftSection: {
    width: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  rightSection: {
    width: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  logo: {
    width: 80,
    height: 20,
    resizeMode: 'contain',
  },
  backButton: {
    padding: 8,
    marginLeft: -8, // Align with content
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
    flexShrink: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2,
  },
  spacer: {
    width: 1, // Minimal spacer for balance
  },
});