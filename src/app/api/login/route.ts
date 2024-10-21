// app/api/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient, SupabaseClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/app/types/supabase';

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient<Database>({ cookies });

  const { reservationNumber, email } = await request.json();

  // 予約番号とメールアドレスの検証
  const { data: reservation, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('reservation_number', reservationNumber)
    .eq('email', email)
    .single();

  if (error || !reservation) {
    return NextResponse.json({ error: '予約番号またはメールアドレスが正しくありません' }, { status: 401 });
  }

  // ユーザーをサインアップまたはサインイン
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: email,
    password: reservationNumber, // 予約番号を一時的なパスワードとして使用
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/booking-details`, // 適切なURLに変更してください
    },
  });

  if (authError && authError.status !== 400) {
    // 400はユーザーが既に存在することを意味します
    return NextResponse.json({ error: 'ユーザーの作成に失敗しました' }, { status: 500 });
  }

  // ユーザーが既に存在する場合はサインイン
  if (authError && authError.status === 400) {
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: email,
      password: reservationNumber,
    });

    if (loginError) {
      return NextResponse.json({ error: 'ログインに失敗しました' }, { status: 500 });
    }
  }

  // ログイン成功
  return NextResponse.json({ message: 'ログイン成功' });
}
