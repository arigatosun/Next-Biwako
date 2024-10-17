// src/app/api/admin/create-admin/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin'; // Supabase クライアントのインポート

// インターフェースの定義

interface AdminUserPayload {
    email: string;
    password: string;
    role: string;
  }
  
  export async function POST(request: NextRequest) {
    try {
      const { email, password, role } = (await request.json()) as AdminUserPayload;
  
      // ユーザーの作成
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // メール確認をスキップ
        app_metadata: { role: role }, // カスタム属性として role を追加
        user_metadata: {},
      });
  
      if (error) {
        console.error('Error creating admin user:', error.message);
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
  
      console.log('Admin user created:', data);
      return NextResponse.json({ message: 'Admin user created successfully' }, { status: 201 });
    } catch (error: any) {
      console.error('Error:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }
