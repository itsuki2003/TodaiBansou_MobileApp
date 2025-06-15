import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import {
  Bell,
  Info,
  CheckCircle2,
  AlertTriangle,
  X,
  MessageCircle,
  Calendar,
  User,
  BookOpen,
} from 'lucide-react-native';

export type NotificationType = 
  | 'info' 
  | 'success' 
  | 'warning' 
  | 'error'
  | 'message'
  | 'lesson'
  | 'assignment'
  | 'task';

export interface NotificationData {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  category?: string;
  timestamp: string;
  actionUrl?: string;
  autoHide?: boolean;
  duration?: number; // milliseconds
}

interface NotificationBannerProps {
  notification: NotificationData;
  onPress?: (notification: NotificationData) => void;
  onDismiss?: (notificationId: string) => void;
  position?: 'top' | 'bottom';
  showAvatar?: boolean;
}

export default function NotificationBanner({
  notification,
  onPress,
  onDismiss,
  position = 'top',
  showAvatar = true,
}: NotificationBannerProps) {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  
  const { width } = Dimensions.get('window');

  useEffect(() => {
    // 入場アニメーション
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // 自動非表示
    if (notification.autoHide !== false) {
      const duration = notification.duration || 5000;
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [notification.autoHide, notification.duration]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: position === 'top' ? -100 : 100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss?.(notification.id);
    });
  };

  const handlePress = () => {
    onPress?.(notification);
  };

  const getIcon = () => {
    const iconSize = 20;
    switch (notification.type) {
      case 'success':
        return <CheckCircle2 size={iconSize} color="#10B981" />;
      case 'warning':
        return <AlertTriangle size={iconSize} color="#F59E0B" />;
      case 'error':
        return <AlertTriangle size={iconSize} color="#EF4444" />;
      case 'message':
        return <MessageCircle size={iconSize} color="#3B82F6" />;
      case 'lesson':
        return <Calendar size={iconSize} color="#8B5CF6" />;
      case 'assignment':
        return <User size={iconSize} color="#06B6D4" />;
      case 'task':
        return <BookOpen size={iconSize} color="#10B981" />;
      default:
        return <Info size={iconSize} color="#3B82F6" />;
    }
  };

  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'success':
        return '#ECFDF5';
      case 'warning':
        return '#FFFBEB';
      case 'error':
        return '#FEF2F2';
      case 'message':
        return '#EBF8FF';
      case 'lesson':
        return '#F3E8FF';
      case 'assignment':
        return '#ECFEFF';
      case 'task':
        return '#ECFDF5';
      default:
        return '#EBF8FF';
    }
  };

  const getBorderColor = () => {
    switch (notification.type) {
      case 'success':
        return '#10B981';
      case 'warning':
        return '#F59E0B';
      case 'error':
        return '#EF4444';
      case 'message':
        return '#3B82F6';
      case 'lesson':
        return '#8B5CF6';
      case 'assignment':
        return '#06B6D4';
      case 'task':
        return '#10B981';
      default:
        return '#3B82F6';
    }
  };

  const getTextColor = () => {
    switch (notification.type) {
      case 'success':
        return '#065F46';
      case 'warning':
        return '#92400E';
      case 'error':
        return '#991B1B';
      case 'message':
        return '#1E40AF';
      case 'lesson':
        return '#5B21B6';
      case 'assignment':
        return '#0E7490';
      case 'task':
        return '#065F46';
      default:
        return '#1E40AF';
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
          top: position === 'top' ? 0 : undefined,
          bottom: position === 'bottom' ? 0 : undefined,
          backgroundColor: getBackgroundColor(),
          borderLeftColor: getBorderColor(),
        },
      ]}
    >
      <SafeAreaView style={styles.safeArea}>
        <TouchableOpacity
          style={styles.content}
          onPress={handlePress}
          activeOpacity={0.8}
        >
          <View style={styles.mainContent}>
            {showAvatar && (
              <View style={[styles.iconContainer, { backgroundColor: getBackgroundColor() }]}>
                {getIcon()}
              </View>
            )}
            
            <View style={styles.textContainer}>
              <Text style={[styles.title, { color: getTextColor() }]} numberOfLines={1}>
                {notification.title}
              </Text>
              <Text style={[styles.message, { color: getTextColor() }]} numberOfLines={2}>
                {notification.message}
              </Text>
              {notification.category && (
                <Text style={[styles.category, { color: getTextColor() }]}>
                  {notification.category}
                </Text>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleDismiss}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={16} color={getTextColor()} />
          </TouchableOpacity>
        </TouchableOpacity>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1000,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  safeArea: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 2,
  },
  category: {
    fontSize: 12,
    opacity: 0.8,
    fontWeight: '500',
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
});