import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';

import { WeekNavigation } from '../../types/weeklyTasks';

interface WeekNavigatorProps {
  navigation: WeekNavigation;
  onWeekChange: (newWeek: string, direction: 'left' | 'right') => void;
  currentWeek: string;
}

export default function WeekNavigator({ 
  navigation, 
  onWeekChange, 
  currentWeek 
}: WeekNavigatorProps) {
  
  const formatWeekDisplay = (weekStartDate: string) => {
    const date = parseISO(weekStartDate);
    return format(date, 'M月d日〜', { locale: ja });
  };

  const handlePreviousWeek = () => {
    onWeekChange(navigation.previousWeek, 'right');
  };

  const handleNextWeek = () => {
    if (navigation.canGoNext) {
      onWeekChange(navigation.nextWeek, 'left');
    }
  };

  return (
    <View style={styles.container}>
      {/* 前の週ボタン */}
      <TouchableOpacity
        style={styles.navButton}
        onPress={handlePreviousWeek}
        activeOpacity={0.7}
      >
        <View style={styles.arrowContainer}>
          <Text style={styles.arrow}>‹</Text>
        </View>
        <Text style={styles.navButtonText}>前の週</Text>
      </TouchableOpacity>

      {/* 現在の週表示 */}
      <View style={styles.currentWeekContainer}>
        <Text style={styles.currentWeekText}>
          {formatWeekDisplay(currentWeek)}
        </Text>
        <View style={styles.weekIndicator}>
          <View style={styles.weekDot} />
        </View>
      </View>

      {/* 次の週ボタン */}
      <TouchableOpacity
        style={[
          styles.navButton,
          !navigation.canGoNext && styles.navButtonDisabled
        ]}
        onPress={handleNextWeek}
        activeOpacity={navigation.canGoNext ? 0.7 : 1}
        disabled={!navigation.canGoNext}
      >
        <Text style={[
          styles.navButtonText,
          !navigation.canGoNext && styles.navButtonTextDisabled
        ]}>
          次の週
        </Text>
        <View style={[
          styles.arrowContainer,
          !navigation.canGoNext && styles.arrowContainerDisabled
        ]}>
          <Text style={[
            styles.arrow,
            !navigation.canGoNext && styles.arrowDisabled
          ]}>
            ›
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    minWidth: 80,
  },
  navButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  navButtonTextDisabled: {
    color: '#9CA3AF',
  },
  arrowContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
  },
  arrowContainerDisabled: {
    backgroundColor: '#F3F4F6',
  },
  arrow: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
  },
  arrowDisabled: {
    color: '#D1D5DB',
  },
  currentWeekContainer: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 16,
  },
  currentWeekText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  weekIndicator: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  weekDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3B82F6',
  },
});