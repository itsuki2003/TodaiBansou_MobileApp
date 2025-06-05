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
import { ArrowLeft } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import Markdown from 'react-native-markdown-display';

type NotificationCategory = {
  id: string;
  name: string;
  color: string;
  description?: string;
};

type Notification = {
  id: string;
  title: string;
  content: string;
  publish_timestamp: string;
  category_id: string;
  status: string;
  target_audience: string;
  created_at: string;
  updated_at: string;
  category?: NotificationCategory;
};

type ReadStatus = {
  id: string;
  user_id: string;
  notification_id: string;
  read_at: string;
};

export default function NotificationDetailScreen() {
  const { notificationId } = useLocalSearchParams<{ notificationId: string }>();
  const [notification, setNotification] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAsRead, setMarkingAsRead] = useState(false);
  const { user } = useAuth();

  const fetchNotification = useCallback(async () => {
    if (!notificationId) {
      setError('お知らせが見つかりません。');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          id,
          title,
          content,
          publish_timestamp,
          category_id,
          status,
          target_audience,
          created_at,
          updated_at,
          notification_categories (
            id,
            name,
            color,
            description
          )
        `)
        .eq('id', notificationId)
        .eq('status', 'published')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setError('指定されたお知らせが見つかりません。');
        } else {
          throw error;
        }
        return;
      }

      const notificationWithCategory = {
        ...data,
        category: data.notification_categories
      };

      setNotification(notificationWithCategory);
    } catch (err) {
      console.error('Error fetching notification:', err);
      setError('お知らせの取得に失敗しました。');
    }
  }, [notificationId]);

  const markAsRead = useCallback(async () => {
    if (!user || !notificationId || markingAsRead) return;

    try {
      setMarkingAsRead(true);

      const { error: checkError, data: existingRead } = await supabase
        .from('notification_reads')
        .select('id')
        .eq('user_id', user.id)
        .eq('notification_id', notificationId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (!existingRead) {
        const { error: insertError } = await supabase
          .from('notification_reads')
          .insert({
            user_id: user.id,
            notification_id: notificationId,
            read_at: new Date().toISOString()
          });

        if (insertError) throw insertError;
      }
    } catch (err) {
      console.error('Error marking as read:', err);
    } finally {
      setMarkingAsRead(false);
    }
  }, [user, notificationId, markingAsRead]);

  useEffect(() => {
    fetchNotification().finally(() => setLoading(false));
  }, [fetchNotification]);

  useEffect(() => {
    if (notification && user) {
      markAsRead();
    }
  }, [notification, user, markAsRead]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleLinkPress = useCallback((url: string) => {
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert('エラー', 'このリンクを開くことができません。');
        }
      })
      .catch((err) => {
        console.error('Error opening URL:', err);
        Alert.alert('エラー', 'リンクを開く際にエラーが発生しました。');
      });
  }, []);

  const markdownStyles = StyleSheet.create({
    body: {
      fontSize: 16,
      lineHeight: 24,
      color: '#334155',
    },
    heading1: {
      fontSize: 24,
      fontWeight: '700',
      color: '#1E293B',
      marginBottom: 16,
      marginTop: 24,
    },
    heading2: {
      fontSize: 20,
      fontWeight: '600',
      color: '#1E293B',
      marginBottom: 12,
      marginTop: 20,
    },
    heading3: {
      fontSize: 18,
      fontWeight: '600',
      color: '#1E293B',
      marginBottom: 8,
      marginTop: 16,
    },
    paragraph: {
      marginBottom: 12,
      fontSize: 16,
      lineHeight: 24,
      color: '#334155',
    },
    strong: {
      fontWeight: '700',
      color: '#1E293B',
    },
    em: {
      fontStyle: 'italic',
    },
    link: {
      color: '#3B82F6',
      textDecorationLine: 'underline',
    },
    list_item: {
      marginBottom: 8,
    },
    bullet_list: {
      marginBottom: 12,
    },
    ordered_list: {
      marginBottom: 12,
    },
    blockquote: {
      backgroundColor: '#F8FAFC',
      borderLeftWidth: 4,
      borderLeftColor: '#3B82F6',
      paddingLeft: 12,
      paddingVertical: 8,
      marginBottom: 12,
    },
    code_inline: {
      backgroundColor: '#F1F5F9',
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 4,
      fontSize: 14,
      fontFamily: 'monospace',
    },
    fence: {
      backgroundColor: '#F1F5F9',
      padding: 12,
      borderRadius: 8,
      marginBottom: 12,
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.title}>お知らせ</Text>
        </View>
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
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.title}>お知らせ</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error || 'お知らせが見つかりません。'}
          </Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => {
              setLoading(true);
              fetchNotification().finally(() => setLoading(false));
            }}
          >
            <Text style={styles.retryText}>再試行</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.title}>お知らせ</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.notificationContainer}>
          <View style={styles.notificationHeader}>
            <View style={styles.categoryContainer}>
              <Text style={[
                styles.categoryText,
                { backgroundColor: notification.category?.color || '#EFF6FF' }
              ]}>
                {notification.category?.name || 'お知らせ'}
              </Text>
            </View>
            <Text style={styles.dateText}>
              {formatDate(notification.publish_timestamp)}
            </Text>
          </View>

          <Text style={styles.notificationTitle}>
            {notification.title}
          </Text>

          <View style={styles.contentContainer}>
            <Markdown
              style={markdownStyles}
              onLinkPress={handleLinkPress}
            >
              {notification.content}
            </Markdown>
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
  },
  content: {
    flex: 1,
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
    padding: 32,
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
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  notificationContainer: {
    padding: 16,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryContainer: {
    flex: 1,
  },
  categoryText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  dateText: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 16,
  },
  notificationTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    lineHeight: 32,
    marginBottom: 24,
  },
  contentContainer: {
    minHeight: 200,
  },
});