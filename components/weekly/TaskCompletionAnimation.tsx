import React, { useEffect, useRef } from 'react';
import {
  Animated,
  View,
} from 'react-native';

interface TaskCompletionAnimationProps {
  children: React.ReactNode;
  isAnimating: boolean;
  type: 'complete' | 'incomplete' | 'added' | 'removed';
  duration?: number;
}

export default function TaskCompletionAnimation({
  children,
  isAnimating,
  type,
  duration = 300,
}: TaskCompletionAnimationProps) {
  
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isAnimating) return;

    switch (type) {
      case 'complete':
        // 完了時のアニメーション：少し大きくなってから元に戻る
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: duration / 3,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: (duration * 2) / 3,
            useNativeDriver: true,
          }),
        ]).start();

        // バウンス効果
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: duration,
          useNativeDriver: true,
        }).start(() => {
          bounceAnim.setValue(0);
        });
        break;

      case 'incomplete':
        // 未完了時のアニメーション：軽く震える
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 0.95,
            duration: duration / 4,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1.05,
            duration: duration / 4,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: duration / 2,
            useNativeDriver: true,
          }),
        ]).start();
        break;

      case 'added':
        // 追加時のアニメーション：フェードイン
        opacityAnim.setValue(0);
        scaleAnim.setValue(0.8);
        
        Animated.parallel([
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: duration,
            useNativeDriver: true,
          }),
        ]).start();
        break;

      case 'removed':
        // 削除時のアニメーション：フェードアウト
        Animated.parallel([
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.8,
            duration: duration,
            useNativeDriver: true,
          }),
        ]).start();
        break;

      default:
        break;
    }
  }, [isAnimating, type, duration, scaleAnim, opacityAnim, bounceAnim]);

  // バウンス効果の変換
  const bounceTransform = bounceAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -5, 0],
  });

  return (
    <Animated.View
      style={{
        transform: [
          { scale: scaleAnim },
          { translateY: bounceTransform },
        ],
        opacity: opacityAnim,
      }}
    >
      {children}
    </Animated.View>
  );
}