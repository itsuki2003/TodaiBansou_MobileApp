import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

// 型定義
type Student = {
  id: string;
  full_name: string;
  grade: string;
  school_attended: string;
};

type Teacher = {
  id: string;
  full_name: string;
};

type Assignment = {
  id: string;
  student_id: string;
  teacher_id: string;
  role: '面談担当（リスト編集可）' | '授業担当（コメントのみ）';
  teachers: Teacher;
};

type ProfileData = {
  student: Student | null;
  teachers: {
    interview: string;
    class: string;
  };
  loading: boolean;
  error: string | null;
};

export default function ProfileScreen() {
  const { selectedStudent } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData>({
    student: null,
    teachers: {
      interview: '',
      class: '',
    },
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (selectedStudent) {
      fetchProfileData();
    }
  }, [selectedStudent]);

  const fetchProfileData = async () => {
    try {
      if (!selectedStudent) {
        throw new Error('生徒が選択されていません');
      }

      // 生徒の詳細情報を取得
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id, full_name, grade, school_attended')
        .eq('id', selectedStudent.id)
        .single();

      if (studentError) throw studentError;

      const studentInfo = {
        id: studentData.id,
        full_name: studentData.full_name,
        grade: studentData.grade || '',
        school_attended: studentData.school_attended || '未設定',
      };

      // 担当講師情報を取得
      const { data: assignments, error: assignmentsError } = await supabase
        .from('assignments')
        .select('*, teachers:teacher_id(*)')
        .eq('student_id', selectedStudent.id);

      if (assignmentsError) throw assignmentsError;

      // 面談担当と授業担当を分離
      const interviewTeacher = assignments?.find((a: Assignment) => a.role === '面談担当（リスト編集可）')?.teachers;
      const classTeacher = assignments?.find((a: Assignment) => a.role === '授業担当（コメントのみ）')?.teachers;

      setProfileData({
        student: studentInfo,
        teachers: {
          interview: interviewTeacher?.full_name || '未設定',
          class: classTeacher?.full_name || '未設定',
        },
        loading: false,
        error: null,
      });
    } catch (error) {
      setProfileData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '予期せぬエラーが発生しました',
      }));
    }
  };

  if (profileData.loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#1E293B" />
      </View>
    );
  }

  if (profileData.error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{profileData.error}</Text>
      </View>
    );
  }

  if (!profileData.student) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>生徒情報が見つかりません</Text>
      </View>
    );
  }

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
              <Text style={styles.value}>{profileData.student.full_name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>学年</Text>
              <Text style={styles.value}>{profileData.student.grade}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>通塾先</Text>
              <Text style={styles.value}>{profileData.student.school_attended}</Text>
            </View>
          </View>
        </View>

        {/* 担当講師情報 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>担当講師情報</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>面談担当</Text>
              <Text style={styles.value}>{profileData.teachers.interview}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>授業担当</Text>
              <Text style={styles.value}>{profileData.teachers.class}</Text>
            </View>
          </View>
        </View>

        {/* 基本の授業スケジュール */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>基本の授業スケジュール</Text>
          <View style={styles.card}>
            {/* スケジュールデータがないため、仮のダミーデータを表示 */}
            <View style={styles.infoRow}>
              <Text style={styles.label}>月曜日</Text>
              <Text style={styles.value}>17:00～18:00</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>水曜日</Text>
              <Text style={styles.value}>17:00～18:00</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>金曜日</Text>
              <Text style={styles.value}>17:00～18:00</Text>
            </View>
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    fontWeight: '500',
  },
}); 