'use client';

import React from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  Divider,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const PrivacyPolicy = () => {
  const theme = useTheme();

  const PolicySection = ({ title, content }: { title: string; content: React.ReactNode }) => (
    <Accordion defaultExpanded>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls={`panel-${title}-content`}
        id={`panel-${title}-header`}
      >
        <Typography variant="h6">{title}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography>{content}</Typography>
      </AccordionDetails>
    </Accordion>
  );

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      <Container maxWidth="md" sx={{ py: 8, flex: 1 }}>
        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 2,
            background: theme.palette.background.paper,
          }}
        >
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{
              textAlign: 'center',
              mb: 4,
              fontWeight: 'bold',
              color: theme.palette.primary.main,
            }}
          >
            プライバシーポリシー
          </Typography>

          <Typography variant="body1" paragraph>
          株式会社ドレメ（以下「当社」といいます）は、本ウェブサイト（以下「本サイト」といいます）を通じて提供するサービスにおいて、利用者の個人情報の保護を最優先に考えています。本プライバシーポリシー（以下「本ポリシー」といいます）は、当社がどのようにして個人情報を収集、使用、保護し、利用者の権利を尊重するかについて定めたものです。
          </Typography>

          <Box sx={{ mt: 4 }}>
            <PolicySection
              title="1. 個人情報保護について"
              content="当社は、個人情報の重要性を認識し、その保護の徹底が社会的責任であると考えています。本ポリシーに基づき、利用者の個人情報を適切に管理し、第三者への提供を行わないことをお約束します。"
            />

            <PolicySection
              title="2. 組織の名称"
              content="株式会社ドレメ"
            />

            <PolicySection
              title="3. 個人情報保護管理者の氏名及び連絡先"
              content="個人情報保護管理者：嵯峨根 和世<br />メールアドレス：info.nest.biwako@gmail.com"
            />

            <PolicySection
              title="4. 個人情報の取得"
              content={
                <>
                  当社は、本サービスの提供に必要な範囲で個人情報を適法かつ公正な手段により取得いたします。また、本サイトではウェブ解析ツールを使用して利用者の利用状況を把握しています。
                  <br /><br />
                  具体的には、Google Analytics を利用してCookieを通じて匿名のデータを収集していますが、個人を特定する情報は取得しておりません。収集されたデータは、Google社のプライバシーポリシーに基づき管理されています。
                </>
              }
            />

            <PolicySection
              title="5. 利用目的"
              content={
                <>
                  当社は、取得した個人情報を以下の目的のために利用いたします。利用者の同意なく、これらの目的以外で個人情報を利用することはありません。
                  <br /><br />
                  ・本サービスの提供および運営<br />
                  ・利用者の登録情報の確認および認証<br />
                  ・利用者間のコミュニケーション支援<br />
                  ・サービスの改善および新サービスの開発<br />
                  ・マーケティング調査およびアンケートの実施<br />
                  ・お問い合わせ対応<br />
                  ・請求および支払い処理<br />
                  ・その他、上記に付帯・関連する業務
                </>
              }
            />

            <PolicySection
              title="6. 個人情報の管理"
              content={
                <>
                  当社は、個人情報の漏洩、滅失、毀損の防止及びその他の個人情報の安全管理のために、適切な技術的および組織的措置を講じます。具体的には、アクセス権限の管理、データの暗号化、セキュリティソフトウェアの導入などを行っています。
                  <br /><br />
                  また、利用者から提供された個人情報は、目的達成に必要な範囲内でのみ従業員にアクセスを許可し、業務遂行のみに使用します。
                </>
              }
            />

            <PolicySection
              title="7. 個人情報の第三者提供"
              content={
                <>
                  当社は、以下の場合を除き、利用者の個人情報を第三者に提供することはありません。
                  <br /><br />
                  ・利用者の同意がある場合<br />
                  ・法令に基づく場合<br />
                  ・人の生命、身体または財産の保護のために必要がある場合であって、本人の同意を得ることが困難である場合<br />
                  ・公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合であって、本人の同意を得ることが困難である場合<br />
                  ・国の機関もしくは地方公共団体等が法令の定める事務を遂行することに対して協力する必要がある場合
                </>
              }
            />

            <PolicySection
              title="8. 個人情報の開示、訂正、削除等"
              content={
                <>
                  利用者は、当社に対してご自身の個人情報の開示、訂正、削除、利用停止を求めることができます。これらの請求があった場合、当社は速やかに対応いたします。
                  <br /><br />
                  <strong>問い合わせ先：</strong><br />
                  株式会社ドレメ<br />
                  〒624-0906 京都府舞鶴市字倉谷９０９番地６
                  <br />
                  メールアドレス：info.nest.biwako@gmail.com<br />
                  電話番号：0773-75-1826<br />
                  (受付時間：平日 9:00～18:00)
                </>
              }
            />

            <PolicySection
              title="9. クッキー（Cookies）の使用"
              content={
                <>
                  当社は、本サイトの利便性向上および利用状況の分析のためにクッキーを使用しています。クッキーは、利用者の端末に保存される小さなテキストファイルであり、個人を特定する情報は含まれていません。
                  <br /><br />
                  利用者は、ブラウザの設定によりクッキーの受け取りを拒否することができますが、その場合、本サイトの一部機能が正しく動作しない可能性があります。
                </>
              }
            />

            <PolicySection
              title="10. 未成年者の個人情報"
              content={
                <>
                  当社は、未成年者（18歳未満）の個人情報を保護するため、未成年者から個人情報を収集する場合は、親権者の同意を得ることを原則としています。未成年者が個人情報を提供する際には、必ず親権者の同意を得てください。
                </>
              }
            />
          </Box>

          <Typography variant="body2" align="right" sx={{ mt: 4 }}>
            制定日：2024年10月25日
          </Typography>
        </Paper>
      </Container>

      <Divider />
    </Box>
  );
};

export default PrivacyPolicy;
