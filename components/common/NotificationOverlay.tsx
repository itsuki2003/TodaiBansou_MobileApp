import React from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useNotification } from '../../contexts/NotificationContext';
import NotificationBanner from './NotificationBanner';
import type { NotificationData } from './NotificationBanner';

export default function NotificationOverlay() {
  const { notifications, dismissNotification } = useNotification();

  const handleNotificationPress = (notification: NotificationData) => {
    // 通知をタップした時の処理
    if (notification.actionUrl) {
      try {
        router.push(notification.actionUrl as any);
      } catch (error) {
        console.warn('Navigation error:', error);
      }
    }
    
    // 通知を自動で閉じる
    dismissNotification(notification.id);
  };

  const handleNotificationDismiss = (notificationId: string) => {
    dismissNotification(notificationId);
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="box-none">
      {notifications.map((notification, index) => (
        <View
          key={notification.id}
          style={[
            styles.notificationWrapper,
            { top: 10 + (index * 80) }, // 複数通知の場合は縦に並べる
          ]}
          pointerEvents="auto"
        >
          <NotificationBanner
            notification={notification}
            onPress={handleNotificationPress}
            onDismiss={handleNotificationDismiss}
            position="top"
            showAvatar={true}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  notificationWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1000,
  },
});