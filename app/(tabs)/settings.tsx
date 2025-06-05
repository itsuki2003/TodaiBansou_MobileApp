import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Modal,
  Pressable,
  Alert,
} from 'react-native';
import { 
  Bell, 
  User, 
  FileText, 
  Shield, 
  LogOut,
  ChevronRight,
  X
} from 'lucide-react-native';
import { router } from 'expo-router';

// Mock data for notifications
const MOCK_NOTIFICATIONS = [
  {
    id: '1',
    title: '6月のスケジュール更新',
    category: 'お知らせ',
    date: '2023-05-28',
    read: false,
    content: '6月の授業スケジュールが更新されました。カレンダーからご確認ください。',
  },
  {
    id: '2',
    title: '夏期講習のご案内',
    category: 'お知らせ',
    date: '2023-05-25',
    read: true,
    content: '今年の夏期講習についてのご案内です。7月24日から8月20日まで実施します。詳細は添付の資料をご覧ください。',
  },
  {
    id: '3',
    title: 'システムメンテナンスのお知らせ',
    category: 'システム',
    date: '2023-05-20',
    read: true,
    content: '6月3日（土）午前2時から午前5時までシステムメンテナンスを実施します。この間はアプリをご利用いただけません。ご不便をおかけしますが、ご理解のほどよろしくお願いいたします。',
  },
];

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const handleNotificationPress = (notification: any) => {
    setSelectedNotification(notification);
    setShowNotificationModal(true);
    
    // Mark notification as read
    if (!notification.read) {
      setNotifications(currentNotifications =>
        currentNotifications.map(n =>
          n.id === notification.id ? { ...n, read: true } : n
        )
      );
    }
  };
  
  const handleProfile = () => {
    // Navigate to profile screen
    alert('プロフィール画面へ移動します');
  };
  
  const handleTerms = () => {
    // Navigate to terms screen
    alert('利用規約画面へ移動します');
  };
  
  const handlePrivacy = () => {
    // Navigate to privacy policy screen
    alert('プライバシーポリシー画面へ移動します');
  };
  
  const handleLogout = () => {
    Alert.alert(
      'ログアウト',
      'ログアウトしますか？',
      [
        {
          text: 'キャンセル',
          style: 'cancel',
        },
        {
          text: 'ログアウト',
          style: 'destructive',
          onPress: () => {
            // Log out logic would go here
            alert('ログアウトしました');
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>東大伴走</Text>
        <Text style={styles.title}>おしらせ・設定</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/notifications')}
          >
            <View style={styles.menuIconContainer}>
              <Bell size={20} color="#3B82F6" />
            </View>
            <Text style={styles.menuText}>おしらせ一覧</Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={handleProfile}
          >
            <View style={styles.menuIconContainer}>
              <User size={20} color="#3B82F6" />
            </View>
            <Text style={styles.menuText}>プロフィール</Text>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={handleTerms}
          >
            <View style={styles.menuIconContainer}>
              <FileText size={20} color="#3B82F6" />
            </View>
            <Text style={styles.menuText}>利用規約</Text>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={handlePrivacy}
          >
            <View style={styles.menuIconContainer}>
              <Shield size={20} color="#3B82F6" />
            </View>
            <Text style={styles.menuText}>プライバシーポリシー</Text>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.menuItem, styles.logoutItem]}
            onPress={handleLogout}
          >
            <View style={[styles.menuIconContainer, styles.logoutIcon]}>
              <LogOut size={20} color="#EF4444" />
            </View>
            <Text style={styles.logoutText}>ログアウト</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>最近のお知らせ</Text>
          
          {notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={styles.notificationItem}
              onPress={() => handleNotificationPress(notification)}
            >
              <View style={styles.notificationHeader}>
                <Text style={styles.notificationCategory}>
                  {notification.category}
                </Text>
                <Text style={styles.notificationDate}>
                  {new Date(notification.date).toLocaleDateString('ja-JP')}
                </Text>
              </View>
              
              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>
                  {notification.title}
                </Text>
                {!notification.read && (
                  <View style={styles.unreadDot} />
                )}
              </View>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={() => router.push('/notifications')}
          >
            <Text style={styles.viewAllText}>すべて表示する</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* Notification Detail Modal */}
      <Modal
        visible={showNotificationModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowNotificationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>お知らせ</Text>
              <Pressable
                style={styles.closeButton}
                onPress={() => setShowNotificationModal(false)}
              >
                <X size={20} color="#64748B" />
              </Pressable>
            </View>
            
            {selectedNotification && (
              <ScrollView style={styles.modalContent}>
                <View style={styles.notificationDetailHeader}>
                  <Text style={styles.notificationDetailCategory}>
                    {selectedNotification.category}
                  </Text>
                  <Text style={styles.notificationDetailDate}>
                    {new Date(selectedNotification.date).toLocaleDateString('ja-JP')}
                  </Text>
                </View>
                
                <Text style={styles.notificationDetailTitle}>
                  {selectedNotification.title}
                </Text>
                
                <Text style={styles.notificationDetailContent}>
                  {selectedNotification.content}
                </Text>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  logo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3B82F6',
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 8,
    borderBottomColor: '#F1F5F9',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
  },
  badge: {
    backgroundColor: '#EF4444',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  logoutItem: {
    borderBottomWidth: 0,
    marginTop: 8,
  },
  logoutIcon: {
    backgroundColor: '#FEE2E2',
  },
  logoutText: {
    flex: 1,
    fontSize: 16,
    color: '#EF4444',
  },
  notificationItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notificationCategory: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  notificationDate: {
    fontSize: 12,
    color: '#64748B',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationTitle: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    marginLeft: 8,
  },
  viewAllButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 16,
    maxHeight: 400,
  },
  notificationDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  notificationDetailCategory: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  notificationDetailDate: {
    fontSize: 12,
    color: '#64748B',
  },
  notificationDetailTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  notificationDetailContent: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
});