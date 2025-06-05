import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { router } from 'expo-router';

// ダミーデータ（後でSupabaseから取得するように変更）
const MOCK_DATA = {
  student: {
    name: '山田 太郎',
    grade: '小学6年生',
    school: '東京都立小学校',
  },
  teachers: {
    interview: '佐藤 先生',
    class: '鈴木 先生',
  },
  schedule: [
    { day: '月曜日', time: '17:00～18:00' },
    { day: '水曜日', time: '17:00～18:00' },
    { day: '金曜日', time: '17:00～18:00' },
  ],
};

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.title}>プロフィール</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* 生徒情報 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>生徒情報</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>氏名</Text>
              <Text style={styles.value}>{MOCK_DATA.student.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>学年</Text>
              <Text style={styles.value}>{MOCK_DATA.student.grade}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>通塾先</Text>
              <Text style={styles.value}>{MOCK_DATA.student.school}</Text>
            </View>
          </View>
        </View>

        {/* 担当講師情報 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>担当講師情報</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>面談担当</Text>
              <Text style={styles.value}>{MOCK_DATA.teachers.interview}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>授業担当</Text>
              <Text style={styles.value}>{MOCK_DATA.teachers.class}</Text>
            </View>
          </View>
        </View>

        {/* 基本の授業スケジュール */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>基本の授業スケジュール</Text>
          <View style={styles.card}>
            {MOCK_DATA.schedule.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.infoRow,
                  index !== MOCK_DATA.schedule.length - 1 && styles.borderBottom,
                ]}
              >
                <Text style={styles.label}>{item.day}</Text>
                <Text style={styles.value}>{item.time}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  label: {
    fontSize: 16,
    color: '#64748B',
  },
  value: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '500',
  },
}); 