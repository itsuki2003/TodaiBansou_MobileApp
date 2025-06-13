import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, User } from 'lucide-react-native';
import type { Student } from '@/types/database.types';

export default function StudentSelectionScreen() {
  const { students, selectStudent } = useAuth();

  const handleStudentSelect = async (student: Student) => {
    await selectStudent(student);
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.logoWrapper}>
            <BookOpen size={40} color="#3B82F6" />
          </View>
          <Text style={styles.title}>お子様を選択</Text>
          <Text style={styles.subtitle}>
            どちらのお子様としてログインしますか？
          </Text>
        </View>

        <View style={styles.studentsContainer}>
          {students.map((student) => (
            <TouchableOpacity
              key={student.id}
              style={styles.studentCard}
              onPress={() => handleStudentSelect(student)}
            >
              <View style={styles.studentIconWrapper}>
                <User size={32} color="#3B82F6" />
              </View>
              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>{student.full_name}</Text>
                {student.furigana_name && (
                  <Text style={styles.studentFurigana}>
                    {student.furigana_name}
                  </Text>
                )}
                {student.grade && (
                  <Text style={styles.studentGrade}>{student.grade}</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.note}>
          選択後、設定画面からいつでも切り替えることができます。
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  logoWrapper: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },
  studentsContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    marginBottom: 16,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 16,
  },
  studentIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  studentFurigana: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 2,
  },
  studentGrade: {
    fontSize: 14,
    color: '#64748B',
  },
  note: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 18,
  },
});