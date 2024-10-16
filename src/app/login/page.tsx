'use client'
import { useState } from 'react'
import CustomButton from "@/app/components/ui/CustomButton"
import Input from "@/app/components/ui/Input"
import CustomCard from "@/app/components/ui/CustomCard"
import { ChevronRight } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export default function LoginPage() {
  const [reservationNumber, setReservationNumber] = useState('')
  const [email, setEmail] = useState('')
  const { login, isLoading, error } = useAuth()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await login(reservationNumber, email)
  }

  return (
    <div className="min-h-screen bg-[#f4f2ed] flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold text-center mb-6">予約確認・変更・キャンセル</h1>
      <CustomCard className="w-full max-w-4xl border-2 border-blue-400 rounded-lg shadow-lg">
        <div className="p-6">
          <p className="text-center mb-6">
            予約番号と予約時のメールアドレスでご予約内容がご確認できます。
          </p>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-1/3 bg-gray-100 p-3 rounded">
                <label className="block text-sm text-gray-700">予約番号</label>
              </div>
              <Input
                type="text"
                placeholder="000"
                value={reservationNumber}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReservationNumber(e.target.value)}
                className="w-2/3"
              />
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-1/3 bg-gray-100 p-3 rounded">
                <label className="block text-sm text-gray-700">予約時のメールアドレス</label>
              </div>
              <Input
                type="email"
                placeholder="abcdef@gmail.com"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                className="w-2/3"
              />
            </div>
            {error && <p className="text-red-500 text-center">{error}</p>}
            <div className="flex justify-center">
              <CustomButton type="submit" className="bg-blue-500 hover:bg-blue-600 text-white px-10" disabled={isLoading}>
                {isLoading ? 'ログイン中...' : 'ログイン'}
                <ChevronRight className="ml-2 h-4 w-4" />
              </CustomButton>
            </div>
          </form>
        </div>
      </CustomCard>
      <CustomButton
        variant="outline"
        className="mt-6 bg-gray-800 text-white hover:bg-gray-700"
      >
        前に戻る
      </CustomButton>
    </div>
  )
}