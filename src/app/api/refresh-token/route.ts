import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decodedToken = jwt.verify(token, JWT_SECRET) as { reservationNumber: string, email: string };
    
    // 新しいトークンを生成 (有効期限を1時間に設定)
    const newToken = jwt.sign(
      { reservationNumber: decodedToken.reservationNumber, email: decodedToken.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    return NextResponse.json({ token: newToken });
  } catch (error) {
    console.error('Token refresh failed:', error);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}