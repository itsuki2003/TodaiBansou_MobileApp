import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface DateHeaderProps {
  date: Date;
}

export default function DateHeader({ date }: DateHeaderProps) {
  // Format date as "5月30日 (金)" in Japanese
  const formatDate = (date: Date): string => {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = days[date.getDay()];
    
    return `${month}月${day}日 (${dayOfWeek})`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.date}>{formatDate(date)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 16,
  },
  date: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
  },
});