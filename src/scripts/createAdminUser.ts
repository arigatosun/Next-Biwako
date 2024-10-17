// scripts/createAdminUser.ts
require('dotenv').config();

import { supabaseAdmin } from '@/lib/supabaseAdmin';

const createAdminUser = async () => {
  const email = 'info.nest.biwako@gmail.com';
  const password = 'yasashiku1';

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // メール確認をスキップ
    app_metadata: { role: 'admin' }, // 管理者ロールを設定
    user_metadata: {},
  });

  if (error) {
    console.error('管理者ユーザーの作成に失敗しました:', error.message);
  } else {
    console.log('管理者ユーザーが正常に作成されました:', data);
  }
};

createAdminUser();
