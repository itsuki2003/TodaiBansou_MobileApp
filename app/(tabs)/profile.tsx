import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { User, BookOpen, Users, Calendar, GraduationCap, School } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import AppHeader from '@/components/ui/AppHeader';

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
    <SafeAreaView style={styles.container}>
      <AppHeader 
        title="プロフィール" 
        showBackButton={true}
        onBackPress={() => router.push('/(tabs)/settings')}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* プロフィールヘッダー */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <User size={32} color="#3B82F6" />
          </View>
          <Text style={styles.studentName}>{profileData.student.full_name}</Text>
          <Text style={styles.studentGrade}>{profileData.student.grade}</Text>
        </View>

        {/* 生徒情報 */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderContainer}>
            <GraduationCap size={20} color="#3B82F6" />
            <Text style={styles.sectionTitle}>生徒情報</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <View style={styles.labelContainer}>
                <User size={16} color="#64748B" />
                <Text style={styles.label}>氏名</Text>
              </View>
              <Text style={styles.value}>{profileData.student.full_name}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <View style={styles.labelContainer}>
                <BookOpen size={16} color="#64748B" />
                <Text style={styles.label}>学年</Text>
              </View>
              <Text style={styles.value}>{profileData.student.grade}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <View style={styles.labelContainer}>
                <School size={16} color="#64748B" />
                <Text style={styles.label}>通塾先</Text>
              </View>
              <Text style={styles.value}>{profileData.student.school_attended}</Text>
            </View>
          </View>
        </View>

        {/* 担当講師情報 */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderContainer}>
            <Users size={20} color="#10B981" />
            <Text style={styles.sectionTitle}>担当講師</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.teacherRow}>
              <View style={styles.teacherInfo}>
                <View style={styles.teacherIconContainer}>
                  <User size={16} color="#10B981" />
                </View>
                <View style={styles.teacherDetails}>
                  <Text style={styles.teacherRole}>面談担当</Text>
                  <Text style={styles.teacherName}>{profileData.teachers.interview}</Text>
                </View>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.teacherRow}>
              <View style={styles.teacherInfo}>
                <View style={styles.teacherIconContainer}>
                  <BookOpen size={16} color="#8B5CF6" />
                </View>
                <View style={styles.teacherDetails}>
                  <Text style={styles.teacherRole}>授業担当</Text>
                  <Text style={styles.teacherName}>{profileData.teachers.class}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* 基本の授業スケジュール */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderContainer}>
            <Calendar size={20} color="#F59E0B" />
            <Text style={styles.sectionTitle}>基本スケジュール</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.scheduleNote}>
              <Text style={styles.scheduleNoteText}>
                詳細なスケジュールはカレンダー画面でご確認ください
              </Text>
            </View>
          </View>
        </View>

        {/* 底部余白 */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: 8,
  },
  card: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  profileHeader: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 24,
    margin: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#3B82F6',
  },
  studentName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  studentGrade: {
    fontSize: 16,
    color: '#64748B',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    color: '#64748B',
    marginLeft: 8,
  },
  value: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  teacherRow: {
    paddingVertical: 12,
  },
  teacherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teacherIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  teacherDetails: {
    flex: 1,
  },
  teacherRole: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 2,
  },
  teacherName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  scheduleNote: {
    padding: 16,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  scheduleNoteText: {
    fontSize: 14,
    color: '#92400E',
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 32,
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