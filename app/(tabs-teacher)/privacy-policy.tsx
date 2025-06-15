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

export default function PrivacyPolicyScreen() {
  const router = useRouter();


  return (
    <SafeAreaView style={styles.container}>
      <AppHeader 
        title="プライバシーポリシー" 
        showBackButton={true}
        onBackPress={() => router.back()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>個人情報保護方針</Text>
          <Text style={styles.sectionText}>
            東大伴走（以下「当社」）は、本ウェブサイト上で提供するサービス（以下「本サービス」）における、ユーザーの個人情報の取扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」）を定めます。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第1条（個人情報）</Text>
          <Text style={styles.sectionText}>
            「個人情報」とは、個人情報保護法にいう「個人情報」を指すものとし、生存する個人に関する情報であって、当該情報に含まれる氏名、生年月日、住所、電話番号、連絡先その他の記述等により特定の個人を識別できる情報及び容貌、指紋、声紋にかかるデータ、及び健康保険証の保険者番号などの当該情報単体から特定の個人を識別できる情報（個人識別情報）を指します。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第2条（個人情報の収集方法）</Text>
          <Text style={styles.sectionText}>
            当社は、ユーザーが利用登録をする際に氏名、生年月日、住所、電話番号、メールアドレス、銀行口座番号、クレジットカード番号、運転免許証番号などの個人情報をお尋ねすることがあります。また、ユーザーと提携先などとの間でなされたユーザーの個人情報を含む取引記録や決済に関する情報を、当社の提携先（情報提供元、広告主、広告配信先などを含みます。以下「提携先」といいます。）などから収集することがあります。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第3条（個人情報を収集・利用する目的）</Text>
          <Text style={styles.sectionText}>
            当社が個人情報を収集・利用する目的は、以下のとおりです。
          </Text>
          <View style={styles.subSection}>
            <Text style={styles.listItem}>• 当社サービスの提供・運営のため</Text>
            <Text style={styles.listItem}>• ユーザーからのお問い合わせに回答するため（本人確認を行うことを含む）</Text>
            <Text style={styles.listItem}>• ユーザーが利用中のサービスの新機能、更新情報、キャンペーン等及び当社が提供する他のサービスの案内のメールを送付するため</Text>
            <Text style={styles.listItem}>• メンテナンス、重要なお知らせなど必要に応じたご連絡のため</Text>
            <Text style={styles.listItem}>• 利用規約に違反したユーザーや、不正・不当な目的でサービスを利用しようとするユーザーの特定をし、ご利用をお断りするため</Text>
            <Text style={styles.listItem}>• ユーザーにご自身の登録情報の閲覧や変更、削除、ご利用状況の閲覧を行っていただくため</Text>
            <Text style={styles.listItem}>• 有料サービスにおいて、ユーザーに利用料金を請求するため</Text>
            <Text style={styles.listItem}>• 上記の利用目的に付随する目的</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第4条（利用目的の変更）</Text>
          <Text style={styles.sectionText}>
            当社は、利用目的が変更前と関連性を有すると合理的に認められる場合に限り、個人情報の利用目的を変更するものとします。利用目的の変更を行った場合には、変更後の目的について、当社所定の方法により、ユーザーに通知し、または本ウェブサイト上に公表するものとします。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第5条（個人情報の第三者提供）</Text>
          <Text style={styles.sectionText}>
            当社は、次に掲げる場合を除いて、あらかじめユーザーの同意を得ることなく、第三者に個人情報を提供することはありません。ただし、個人情報保護法その他の法令で認められる場合を除きます。
          </Text>
          <View style={styles.subSection}>
            <Text style={styles.listItem}>• 人の生命、身体または財産の保護のために必要がある場合であって、本人の同意を得ることが困難であるとき</Text>
            <Text style={styles.listItem}>• 公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合であって、本人の同意を得ることが困難であるとき</Text>
            <Text style={styles.listItem}>• 国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合であって、本人の同意を得ることにより当該事務の遂行に支障を及ぼすおそれがあるとき</Text>
            <Text style={styles.listItem}>• 予め次の事項を告知あるいは公表し、かつ当社が個人情報保護委員会に届出をしたとき</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第6条（個人情報の開示）</Text>
          <Text style={styles.sectionText}>
            当社は、本人から個人情報の開示を求められたときは、本人に対し、遅滞なくこれを開示します。ただし、開示することにより次のいずれかに該当する場合は、その全部または一部を開示しないこともあり、開示しない決定をした場合には、その旨を遅滞なく通知します。
          </Text>
          <View style={styles.subSection}>
            <Text style={styles.listItem}>• 本人または第三者の生命、身体、財産その他の権利利益を害するおそれがある場合</Text>
            <Text style={styles.listItem}>• 当社の業務の適正な実施に著しい支障を及ぼすおそれがある場合</Text>
            <Text style={styles.listItem}>• その他法令に違反することとなる場合</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第7条（個人情報の訂正および削除）</Text>
          <Text style={styles.sectionText}>
            ユーザーは、当社の保有する自己の個人情報が誤った情報である場合には、当社が定める手続きにより、当社に対して個人情報の訂正、追加または削除（以下「訂正等」といいます。）を請求することができます。当社は、ユーザーから前項の請求を受けてその請求に応じる必要があると判断した場合には、遅滞なく、当該個人情報の訂正等を行うものとします。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第8条（個人情報の利用停止等）</Text>
          <Text style={styles.sectionText}>
            当社は、本人から、個人情報が、利用目的の範囲を超えて取り扱われているという理由、または不正の手段により取得されたものであるという理由により、その利用の停止または消去（以下「利用停止等」といいます。）を求められた場合には、遅滞なく必要な調査を行います。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第9条（プライバシーポリシーの変更）</Text>
          <Text style={styles.sectionText}>
            本ポリシーの内容は、法令その他本ポリシーに別段の定めのある事項を除いて、ユーザーに通知することなく、変更することができるものとします。当社が別途定める場合を除いて、変更後のプライバシーポリシーは、本ウェブサイトに掲載したときから効力を生じるものとします。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第10条（お問い合わせ窓口）</Text>
          <Text style={styles.sectionText}>
            本ポリシーに関するお問い合わせは、以下の窓口までお願いいたします。
          </Text>
          <View style={styles.subSection}>
            <Text style={styles.listItem}>会社名：東大伴走</Text>
            <Text style={styles.listItem}>担当部署：個人情報保護担当</Text>
            <Text style={styles.listItem}>連絡先：info@todaibanso.com</Text>
          </View>
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