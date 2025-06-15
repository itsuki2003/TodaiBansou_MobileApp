import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabaseClient';
import AppHeader from '@/components/ui/AppHeader';
import Markdown from 'react-native-markdown-display';

interface NotificationCategory {
  id: string;
  name: string;
}

interface NotificationDetail {
  id: string;
  title: string;
  content: string;
  publish_timestamp: string;
  category_id: string;
  status: string;
  target_audience: string;
  category?: NotificationCategory;
}

export default function NotificationDetailScreen() {
  const { notificationId } = useLocalSearchParams();
  const [notification, setNotification] = useState<NotificationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotificationDetail = useCallback(async () => {
    if (!notificationId || typeof notificationId !== 'string') {
      setError('無効なお知らせIDです');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      
      // Fetch notification detail with category information
      const { data: notificationData, error: notificationError } = await supabase
        .from('notifications')
        .select(`
          id,
          title,
          content,
          publish_timestamp,
          category_id,
          status,
          notification_categories!category_id (
            id,
            name
          )
        `)
        .eq('id', notificationId)
        .single();

      if (notificationError) {
        throw notificationError;
      }

      if (!notificationData) {
        throw new Error('お知らせが見つかりません');
      }

      const notificationWithCategory = {
        ...notificationData,
        category: notificationData.notification_categories,
      };

      setNotification(notificationWithCategory);

      
    } catch (err) {
      setError('お知らせの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [notificationId]);


  useEffect(() => {
    fetchNotificationDetail();
  }, [fetchNotificationDetail]);


  const markdownStyles = {
    body: {
      fontSize: 16,
      color: '#334155',
      lineHeight: 24,
    },
    heading1: {
      fontSize: 20,
      fontWeight: '700',
      color: '#1E293B',
      lineHeight: 28,
      marginBottom: 16,
      marginTop: 24,
    },
    heading2: {
      fontSize: 18,
      fontWeight: '600',
      color: '#1E293B',
      lineHeight: 26,
      marginBottom: 12,
      marginTop: 20,
    },
    paragraph: {
      marginBottom: 12,
    },
    strong: {
      fontWeight: '600' as const,
      color: '#1E293B',
    },
    link: {
      color: '#3B82F6',
      textDecorationLine: 'underline',
    },
    list_item: {
      marginBottom: 8,
      marginLeft: 16,
    },
  };

  const handleLinkPress = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('エラー', 'このURLを開くことができません');
      }
    } catch (err) {
      Alert.alert('エラー', 'URLを開く際にエラーが発生しました');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader 
          title="お知らせ" 
          showBackButton={true}
          onBackPress={() => router.back()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !notification) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader 
          title="お知らせ" 
          showBackButton={true}
          onBackPress={() => router.back()}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error || 'お知らせが見つかりません'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchNotificationDetail}>
            <Text style={styles.retryButtonText}>再試行</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader 
        title="お知らせ" 
        showBackButton={true}
        onBackPress={() => router.back()}
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.notificationHeader}>
          <View style={[
            styles.categoryBadge,
            { backgroundColor: notification.category?.color || '#EFF6FF' }
          ]}>
            <Text style={[
              styles.categoryText,
              { color: notification.category?.color ? '#FFFFFF' : '#3B82F6' }
            ]}>
              {notification.category?.name || 'お知らせ'}
            </Text>
          </View>
          <Text style={styles.publishDate}>
            {new Date(notification.publish_timestamp).toLocaleDateString('ja-JP')}
          </Text>
        </View>
        
        <Text style={styles.notificationTitle}>
          {notification.title}
        </Text>
        
        <View style={styles.contentContainer}>
          <Markdown
            style={markdownStyles}
            onLinkPress={(url) => {
              handleLinkPress(url);
              return true;
            }}
          >
            {notification.content}
          </Markdown>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  publishDate: {
    fontSize: 14,
    color: '#64748B',
  },
  notificationTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    lineHeight: 32,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});