import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { 
  CheckCircle, 
  Clock, 
  Target, 
  ThumbsUp, 
  Zap, 
  ClipboardList,
  MessageCircle 
} from 'lucide-react-native';

interface ProgressIndicatorProps {
  current: number;
  total: number;
  percentage: number;
  color?: 'green' | 'yellow' | 'red' | 'gray';
  size?: 'small' | 'medium' | 'large';
  hasComments?: boolean;
}

export default function ProgressIndicator({
  current,
  total,
  percentage,
  color = 'gray',
  size = 'medium',
  hasComments = false,
}: ProgressIndicatorProps) {
  
  const getColorStyles = (colorType: string) => {
    switch (colorType) {
      case 'green':
        return {
          background: '#DCFCE7',
          text: '#166534',
          border: '#BBF7D0',
        };
      case 'yellow':
        return {
          background: '#FEF3C7',
          text: '#92400E',
          border: '#FDE68A',
        };
      case 'red':
        return {
          background: '#FEE2E2',
          text: '#991B1B',
          border: '#FECACA',
        };
      default:
        return {
          background: '#F3F4F6',
          text: '#4B5563',
          border: '#E5E7EB',
        };
    }
  };

  const getSizeStyles = (sizeType: string) => {
    switch (sizeType) {
      case 'small':
        return {
          container: { paddingHorizontal: 8, paddingVertical: 4 },
          text: { fontSize: 12 },
        };
      case 'large':
        return {
          container: { paddingHorizontal: 16, paddingVertical: 12 },
          text: { fontSize: 18 },
        };
      default:
        return {
          container: { paddingHorizontal: 12, paddingVertical: 8 },
          text: { fontSize: 14 },
        };
    }
  };

  const colorStyles = getColorStyles(color);
  const sizeStyles = getSizeStyles(size);

  const getProgressMessage = () => {
    if (total === 0) {
      return 'タスクなし';
    }
    
    if (percentage === 100) {
      return '完了！';
    } else if (percentage >= 80) {
      return 'もう少し！';
    } else if (percentage >= 50) {
      return '順調です';
    } else if (percentage > 0) {
      return 'がんばろう';
    } else {
      return '未着手';
    }
  };

  const getProgressIcon = () => {
    const iconSize = size === 'small' ? 12 : size === 'large' ? 18 : 14;
    const iconColor = colorStyles.text;
    
    if (total === 0) return <ClipboardList size={iconSize} color={iconColor} />;
    if (percentage === 100) return <CheckCircle size={iconSize} color={iconColor} />;
    if (percentage >= 80) return <Zap size={iconSize} color={iconColor} />;
    if (percentage >= 50) return <ThumbsUp size={iconSize} color={iconColor} />;
    if (percentage > 0) return <Target size={iconSize} color={iconColor} />;
    return <Clock size={iconSize} color={iconColor} />;
  };

  return (
    <View style={styles.container}>
      {/* メイン進捗表示 */}
      <View style={[
        styles.progressContainer,
        sizeStyles.container,
        {
          backgroundColor: colorStyles.background,
          borderColor: colorStyles.border,
        }
      ]}>
        <View style={styles.progressContent}>
          {getProgressIcon()}
          <Text style={[
            styles.progressText,
            sizeStyles.text,
            { color: colorStyles.text }
          ]}>
            {current}/{total}
          </Text>
          
          {size !== 'small' && (
            <Text style={[
              styles.percentageText,
              sizeStyles.text,
              { color: colorStyles.text }
            ]}>
              {percentage}%
            </Text>
          )}
        </View>

        {/* 進捗メッセージ */}
        {size === 'large' && (
          <Text style={[
            styles.messageText,
            { color: colorStyles.text }
          ]}>
            {getProgressMessage()}
          </Text>
        )}
      </View>

      {/* 講師コメントインジケーター */}
      {hasComments && size !== 'small' && (
        <View style={styles.commentIndicator}>
          <MessageCircle size={10} color="#1E40AF" />
          <Text style={styles.commentText}>コメントあり</Text>
        </View>
      )}

      {/* 詳細進捗バー（largeサイズのみ） */}
      {size === 'large' && total > 0 && (
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${percentage}%`,
                  backgroundColor: 
                    color === 'green' ? '#10B981' :
                    color === 'yellow' ? '#F59E0B' :
                    color === 'red' ? '#EF4444' :
                    '#9CA3AF',
                },
              ]}
            />
          </View>
          
          {/* 進捗セグメント */}
          <View style={styles.segmentContainer}>
            {Array.from({ length: total }, (_, index) => (
              <View
                key={index}
                style={[
                  styles.segment,
                  {
                    backgroundColor: index < current 
                      ? (color === 'green' ? '#10B981' :
                         color === 'yellow' ? '#F59E0B' :
                         color === 'red' ? '#EF4444' : '#9CA3AF')
                      : '#E5E7EB',
                  }
                ]}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  progressContainer: {
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 60,
  },
  progressContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressText: {
    fontWeight: '600',
  },
  percentageText: {
    fontWeight: 'bold',
  },
  messageText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  commentIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#F0F9FF',
    borderRadius: 4,
    gap: 4,
  },
  commentText: {
    fontSize: 10,
    color: '#1E40AF',
    fontWeight: '500',
  },
  progressBarContainer: {
    width: '100%',
    marginTop: 12,
    gap: 8,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  segmentContainer: {
    flexDirection: 'row',
    gap: 2,
    justifyContent: 'center',
  },
  segment: {
    width: 12,
    height: 4,
    borderRadius: 2,
  },
});