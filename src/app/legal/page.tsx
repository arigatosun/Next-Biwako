'use client';

import React from 'react';
import { Container, Typography, Paper, Box, Grid, Divider, useTheme } from '@mui/material';
import {
  Business,
  Person,
  LocationOn,
  Email,
  Phone,
  Description,
  AttachMoney,
  Payment as PaymentIcon,
  Schedule,
  AssignmentReturn,
  ShoppingCart,
  Security,
  AddCircleOutline,
  AccessTime,
} from '@mui/icons-material';

const LegalPage = () => {
  const theme = useTheme();

  const LegalItem = ({
    icon,
    title,
    content,
  }: {
    icon: React.ReactNode;
    title: string;
    content: React.ReactNode;
  }) => (
    <Box sx={{ mb: 2 }}>
      <Grid container spacing={2} alignItems="flex-start">
        <Grid item xs={1}>
          {icon}
        </Grid>
        <Grid item xs={3}>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 'bold', color: theme.palette.text.secondary }}
          >
            {title}
          </Typography>
        </Grid>
        <Grid item xs={8}>
          {content}
        </Grid>
      </Grid>
      <Divider sx={{ mt: 2 }} />
    </Box>
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
            特定商取引法に基づく表記
          </Typography>

          <Box>
            <LegalItem
              icon={<Business color="primary" />}
              title="販売業者"
              content={<>NEST琵琶湖</>}
            />

            <LegalItem
              icon={<Person color="primary" />}
              title="代表者"
              content={<>大河内信広</>}
            />

            <LegalItem
              icon={<LocationOn color="primary" />}
              title="所在地"
              content={
                <>
                  〒520-1836
                  <br />
                  滋賀県高島市マキノ町新保浜田146-1
                </>
              }
            />

            <LegalItem
              icon={<Phone color="primary" />}
              title="電話番号"
              content={<>000-0000-0000</>}
            />

            <LegalItem
              icon={<Email color="primary" />}
              title="メールアドレス"
              content={<>info.nest.biwako@gmail.com</>}
            />

            <LegalItem
              icon={<Description color="primary" />}
              title="サービスの内容"
              content={
                <>
                  NEST琵琶湖は、滋賀県高島市マキノ町に位置する、室内温水プール・天然温泉付きのリゾートヴィラです。完全プライベートな空間を提供し、最大5名までご宿泊いただける1棟貸切のヴィラで、屋内プール、温泉、サウナなどの充実した設備を完備しています。琵琶湖のほとりで四季折々の自然を楽しみながら、心身ともにリフレッシュできる極上の滞在をお約束します。
                </>
              }
            />

            <LegalItem
              icon={<AttachMoney color="primary" />}
              title="料金"
              content={
                <>
                  宿泊料金は、ご予約のプランや宿泊日程、人数により異なります。詳細な料金は、予約ページまたはお問い合わせフォームをご確認ください。
                </>
              }
            />

            <LegalItem
              icon={<AddCircleOutline color="primary" />}
              title="追加の手数料などの追加料金"
              content={<>なし</>}
            />

            <LegalItem
              icon={<AccessTime color="primary" />}
              title="引き渡し時期"
              content={
                <>事前決済もしくは現地支払い後、チェックイン時間からご利用いただけます。</>
              }
            />

            <LegalItem
              icon={<PaymentIcon color="primary" />}
              title="支払方法"
              content={<>クレジットカード決済、銀行振込、現地支払い（現金）</>}
            />

            {/* 決済方法の更新 */}
            <LegalItem
              icon={<PaymentIcon color="primary" />}
              title="決済方法"
              content={
                <>
                
                  <Box component="ul" sx={{ pl: 2 }}>
                    <Box component="li" sx={{ mb: 2 }}>
                      <Typography variant="body2" component="div">
                        <strong>クレジットカード決済：</strong>
                      </Typography>
                      <Box component="ul" sx={{ pl: 2 }}>
                        <Box component="li">
                          - Visa、MasterCard、JCB、AMEXなど主要なクレジットカードに対応しております。予約時にオンラインでの決済が可能です。
                        </Box>
                      </Box>
                    </Box>
                    <Box component="li" sx={{ mb: 2 }}>
                      <Typography variant="body2" component="div">
                        <strong>銀行振込：</strong>
                      </Typography>
                      <Box component="ul" sx={{ pl: 2 }}>
                        <Box component="li">
                          - ご予約確定後、指定の銀行口座にお振込みください。振込手数料はお客様負担となります。
                        </Box>
                      </Box>
                    </Box>
                    <Box component="li">
                      <Typography variant="body2" component="div">
                        <strong>現地支払い：</strong>
                      </Typography>
                      <Box component="ul" sx={{ pl: 2 }}>
                        <Box component="li">
                          - チェックイン時に現金にてお支払いください。
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </>
              }
            />

            <LegalItem
              icon={<Schedule color="primary" />}
              title="サービス提供時期"
              content={<>ユーザー登録完了後、即時にサービスをご利用いただけます。</>}
            />

            {/* キャンセル・返金ポリシーの更新 */}
            <LegalItem
              icon={<AssignmentReturn color="primary" />}
              title="キャンセル・返金ポリシー"
              content={
                <>
                 
                  <Box component="ul" sx={{ pl: 2 }}>
                    <Box component="li" sx={{ mb: 2 }}>
                      <Typography variant="body2" component="div">
                        <strong>チェックイン31日前まで：</strong>
                      </Typography>
                      <Box component="ul" sx={{ pl: 2 }}>
                        <Box component="li">- 現地決済の場合：無料</Box>
                        <Box component="li">
                          - クレジットカード決済の場合：予約総額の3.6%（クレジットカード決済手数料）
                        </Box>
                      </Box>
                    </Box>
                    <Box component="li" sx={{ mb: 2 }}>
                      <Typography variant="body2" component="div">
                        <strong>チェックイン30日前〜8日前まで：</strong>
                        宿泊料金（食事・オプション含む）の50％
                      </Typography>
                    </Box>
                    <Box component="li">
                      <Typography variant="body2" component="div">
                        <strong>チェックイン7日前以降：</strong>
                        宿泊料金（食事・オプション含む）の100％
                      </Typography>
                    </Box>
                  </Box>
                  {/* 注意書き */}
                  <Box
                    sx={{
                      mt: 4,
                      p: 2,
                      backgroundColor: '#fff9c4', // 薄い黄色の背景色
                      border: '1px solid #fdd835', // 黄色のボーダー
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="body2" component="div" color="textSecondary">
                      <strong>ご注意：</strong>
                      クレジットカード決済を選択された場合、チェックイン31日前までのキャンセルであっても、クレジットカード決済手数料として予約総額の3.6%のキャンセル料が発生いたします。
                    </Typography>
                  </Box>
                </>
              }
            />

            <LegalItem
              icon={<ShoppingCart color="primary" />}
              title="決済期間"
              content={
                <>
                  クレジットカード決済の場合はただちに処理されます。銀行振込の場合は、請求書発行後7日以内にお支払いいただく必要があります。
                </>
              }
            />

            <LegalItem
              icon={<Security color="primary" />}
              title="個人情報保護方針"
              content={
                <>
                  当社は、ユーザーの個人情報を適切に管理し、法令を遵守して取り扱います。
                  <br />
                  詳細は「プライバシーポリシー」をご確認ください。
                </>
              }
            />
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default LegalPage;
