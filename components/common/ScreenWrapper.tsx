import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import { AppError } from '../../hooks/useErrorHandler';

interface ScreenWrapperProps {
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
  loading?: boolean;
  error?: AppError | null;
  onRetry?: () => void;
  headerRight?: React.ReactNode;
  backgroundColor?: string;
  loadingMessage?: string;
  style?: object;
}

export default function ScreenWrapper({
  children,
  title,
  showBackButton = false,
  loading = false,
  error = null,
  onRetry,
  headerRight,
  backgroundColor = '#F9FAFB',
  loadingMessage,
  style,
}: ScreenWrapperProps) {
  const router = useRouter();

  const handleGoBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }, style]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* ヘッダー */}
      {(title || showBackButton || headerRight) && (
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {showBackButton && (
              <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
                <ArrowLeft size={24} color="#374151" />
              </TouchableOpacity>
            )}
            {title && (
              <Text style={[
                styles.title,
                showBackButton && styles.titleWithBackButton,
              ]}>
                {title}
              </Text>
            )}
          </View>
          
          {headerRight && (
            <View style={styles.headerRight}>
              {headerRight}
            </View>
          )}
        </View>
      )}

      {/* コンテンツ */}
      <View style={styles.content}>
        {loading ? (
          <LoadingState message={loadingMessage} />
        ) : error ? (
          <ErrorState
            message={error.message}
            onRetry={error.recoverable ? onRetry : undefined}
          />
        ) : (
          children
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    minHeight: 56,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    flex: 1,
  },
  titleWithBackButton: {
    textAlign: 'left',
    flex: 0,
  },
  headerRight: {
    marginLeft: 12,
  },
  content: {
    flex: 1,
  },
});