import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import AppHeader from '@/components/ui/AppHeader';

export default function TermsOfServiceScreen() {
  const router = useRouter();


  return (
    <SafeAreaView style={styles.container}>
      <AppHeader 
        title="利用規約" 
        showBackButton={true}
        onBackPress={() => router.back()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第1条（本規約の適用）</Text>
          <Text style={styles.sectionText}>
            本規約は、東大伴走（以下「当社」）が提供するオンライン個別指導サービス「東大伴走」（以下「本サービス」）の利用条件を定めるものです。登録ユーザーの皆様（以下「ユーザー」）には、本規約に従って、本サービスをご利用いただきます。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第2条（利用登録）</Text>
          <Text style={styles.sectionText}>
            本サービスにおいては、登録希望者が本規約に同意の上、当社の定める方法によって利用登録を申請し、当社がこれを承認することによって、利用登録が完了するものとします。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第3条（ユーザーID及びパスワードの管理）</Text>
          <Text style={styles.sectionText}>
            ユーザーは、自己の責任において、本サービスのユーザーID及びパスワードを適切に管理するものとします。ユーザーは、いかなる場合にも、ユーザーID及びパスワードを第三者に譲渡または貸与し、もしくは第三者と共用することはできません。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第4条（料金及び支払方法）</Text>
          <Text style={styles.sectionText}>
            ユーザーは、本サービスの有料部分の対価として、当社が別途定め、本ウェブサイトに表示する料金を、当社が指定する方法により支払うものとします。ユーザーが料金の支払を遅滞した場合には、ユーザーは年14.6％の割合による遅延損害金を支払うものとします。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第5条（禁止事項）</Text>
          <Text style={styles.sectionText}>
            ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。
          </Text>
          <View style={styles.subSection}>
            <Text style={styles.listItem}>• 法令または公序良俗に違反する行為</Text>
            <Text style={styles.listItem}>• 犯罪行為に関連する行為</Text>
            <Text style={styles.listItem}>• 当社、本サービスの他の利用者、または第三者のサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</Text>
            <Text style={styles.listItem}>• 当社のサービスの運営を妨害するおそれのある行為</Text>
            <Text style={styles.listItem}>• 他の利用者に関する個人情報等を収集または蓄積する行為</Text>
            <Text style={styles.listItem}>• 不正アクセスをし、またはこれを試みる行為</Text>
            <Text style={styles.listItem}>• 他の利用者に成りすます行為</Text>
            <Text style={styles.listItem}>• 当社が許諾しない本サービス上での宣伝、広告、勧誘、または営業行為</Text>
            <Text style={styles.listItem}>• 面識のない異性との出会いを目的とした行為</Text>
            <Text style={styles.listItem}>• 当社、本サービスの他の利用者、または第三者に不利益、損害、不快感を与える行為</Text>
            <Text style={styles.listItem}>• その他当社が不適切と判断する行為</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第6条（本サービスの提供の停止等）</Text>
          <Text style={styles.sectionText}>
            当社は、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。
          </Text>
          <View style={styles.subSection}>
            <Text style={styles.listItem}>• 本サービスにかかるコンピュータシステムの保守点検または更新を行う場合</Text>
            <Text style={styles.listItem}>• 地震、落雷、火災、停電または天災などの不可抗力により、本サービスの提供が困難となった場合</Text>
            <Text style={styles.listItem}>• コンピュータまたは通信回線等が事故により停止した場合</Text>
            <Text style={styles.listItem}>• その他、当社が本サービスの提供が困難と判断した場合</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第7条（保証の否認及び免責事項）</Text>
          <Text style={styles.sectionText}>
            当社は、本サービスに事実上または法律上の瑕疵（安全性、信頼性、正確性、完全性、有効性、特定の目的への適合性、セキュリティなどに関する欠陥、エラーやバグ、権利侵害などを含みます。）がないことを明示的にも黙示的にも保証しておりません。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第8条（サービス内容の変更等）</Text>
          <Text style={styles.sectionText}>
            当社は、ユーザーに通知することなく、本サービスの内容を変更しまたは本サービスの提供を中止することができるものとし、これによってユーザーに生じた損害について一切の責任を負いません。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第9条（利用規約の変更）</Text>
          <Text style={styles.sectionText}>
            当社は、必要と判断した場合には、ユーザーに通知することなくいつでも本規約を変更することができるものとします。なお、本規約の変更後、本サービスの利用を開始した場合には、当該ユーザーは変更後の規約に同意したものとみなします。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第10条（個人情報の取扱い）</Text>
          <Text style={styles.sectionText}>
            当社は、本サービスの利用によって取得する個人情報については、当社「プライバシーポリシー」に従い適切に取り扱うものとします。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第11条（通知または連絡）</Text>
          <Text style={styles.sectionText}>
            ユーザーと当社との間の通知または連絡は、当社の定める方法によって行うものとします。当社は、ユーザーから、当社が別途定める方式に従った変更届け出がない限り、現在登録されている連絡先が有効なものとみなして当該連絡先へ通知または連絡を行い、これらは、発信時にユーザーへ到達したものとみなします。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第12条（権利義務の譲渡の禁止）</Text>
          <Text style={styles.sectionText}>
            ユーザーは、当社の書面による事前の承諾なく、利用契約上の地位または本規約に基づく権利もしくは義務を第三者に譲渡し、または担保に供することはできません。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第13条（準拠法・裁判管轄）</Text>
          <Text style={styles.sectionText}>
            本規約の解釈にあたっては、日本法を準拠法とします。本サービスに関して紛争が生じた場合には、当社の本店所在地を管轄する裁判所を専属的合意管轄とします。
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            制定日：2024年1月1日{'\n'}
            最終改定日：2024年1月1日{'\n'}
            東大伴走
          </Text>
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
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 24,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 8,
  },
  subSection: {
    marginTop: 12,
    marginLeft: 8,
  },
  listItem: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 8,
  },
  footer: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  footerText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 32,
  },
});