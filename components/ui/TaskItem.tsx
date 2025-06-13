import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Check, PartyPopper } from 'lucide-react-native';

export interface TaskItemProps {
  title: string;
  isCompleted: boolean;
  onToggle: (isCompleted: boolean) => void;
  onCelebration?: (message: string) => void; // 親コンポーネントに通知
}

// お祝いメッセージの配列
const CELEBRATION_MESSAGES = [
  'クリア！',
  'よくできました！',
  'すごい！',
  'がんばりました！',
  'えらいね！',
  'やったね！',
  'パーフェクト！',
  'すばらしい！',
];

const { width: screenWidth } = Dimensions.get('window');

export default function TaskItem({ title, isCompleted, onToggle, onCelebration }: TaskItemProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState('');
  
  // アニメーション用の値
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const celebrationOpacity = useRef(new Animated.Value(0)).current;
  const celebrationScale = useRef(new Animated.Value(0.5)).current;

  const handleToggle = async () => {
    const newCompletedState = !isCompleted;
    
    // タスクの状態を切り替え
    onToggle(newCompletedState);
    
    // 完了時のお祝いアニメーション
    if (newCompletedState) {
      const randomMessage = CELEBRATION_MESSAGES[Math.floor(Math.random() * CELEBRATION_MESSAGES.length)];
      setCelebrationMessage(randomMessage);
      setShowCelebration(true);
      
      // 親コンポーネントに通知（画面全体のアニメーション用）
      onCelebration?.(randomMessage);
      
      // タスクアイテムのバウンスアニメーション
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      // バウンス効果
      Animated.timing(bounceAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        bounceAnim.setValue(0);
      });

      // お祝いメッセージのアニメーション
      Animated.parallel([
        Animated.timing(celebrationOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(celebrationScale, {
          toValue: 1,
          tension: 200,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // メッセージを2秒後に自動で消す
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(celebrationOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(celebrationScale, {
            toValue: 0.5,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setShowCelebration(false);
          celebrationOpacity.setValue(0);
          celebrationScale.setValue(0.5);
        });
      }, 2000);
    }
  };

  const bounceTransform = bounceAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -10, 0],
  });

  return (
    <View style={styles.wrapper}>
      <Animated.View
        style={[
          styles.container,
          isCompleted && styles.completedContainer,
          {
            transform: [
              { scale: scaleAnim },
              { translateY: bounceTransform },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.touchableArea}
          onPress={handleToggle}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, isCompleted && styles.completedCheckbox]}>
            {isCompleted && <Check size={16} color="#fff" />}
          </View>
          <Text style={[styles.title, isCompleted && styles.completedTitle]}>
            {title}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* お祝いメッセージ */}
      {showCelebration && (
        <Animated.View
          style={[
            styles.celebrationContainer,
            {
              opacity: celebrationOpacity,
              transform: [{ scale: celebrationScale }],
            },
          ]}
          pointerEvents="none"
        >
          <Text style={styles.celebrationText}>{celebrationMessage}</Text>
          <View style={styles.celebrationIconContainer}>
            <PartyPopper size={16} color="#92400E" />
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    marginBottom: 8,
  },
  container: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  completedContainer: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
    shadowColor: '#10B981',
    shadowOpacity: 0.1,
  },
  touchableArea: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3B82F6',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedCheckbox: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  title: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
    lineHeight: 22,
  },
  completedTitle: {
    color: '#059669',
    textDecorationLine: 'line-through',
  },
  celebrationContainer: {
    position: 'absolute',
    top: -20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  celebrationText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#92400E',
    marginRight: 4,
  },
  celebrationIconContainer: {
    marginLeft: 4,
  },
});