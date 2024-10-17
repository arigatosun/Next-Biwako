// src/app/affiliate/login/page.tsx

'use client'
import { useState } from 'react'
import CustomButton from "@/app/components/ui/CustomButton"
import Input from "@/app/components/ui/Input"
import CustomCard from "@/app/components/ui/CustomCard"
import { ChevronRight } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export default function LoginPage() {
  const [affiliateCode, setAffiliateCode] = useState('') // reservationNumber -> affiliateCode
  const [email, setEmail] = useState('')
  const { affiliateLogin, isLoading, error } = useAuth() // login -> affiliateLogin

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await affiliateLogin(affiliateCode, email) // login -> affiliateLogin
  }

  return (
    <div className="min-h-screen bg-[#f4f2ed] flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">
        アフィリエイトログイン
      </h1>
      <CustomCard className="w-full max-w-md border-2 border-green-400 rounded-lg shadow-lg">
        <div className="p-6">
          <p className="text-center mb-6">
            アフィリエイトコードと登録時のメールアドレスでログインできます。
          </p>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-1/3 bg-gray-100 p-3 rounded">
                <label className="block text-sm text-gray-700">アフィリエイトコード</label>
              </div>
              <Input
                type="text"
                placeholder="AFF123456"
                value={affiliateCode}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAffiliateCode(e.target.value)}
                className="w-2/3"
                required
              />
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-1/3 bg-gray-100 p-3 rounded">
                <label className="block text-sm text-gray-700">メールアドレス</label>
              </div>
              <Input
                type="email"
                placeholder="abcdef@gmail.com"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                className="w-2/3"
                required
              />
            </div>
            {error && <p className="text-red-500 text-center">{error}</p>}
            <div className="flex justify-center">
              <CustomButton type="submit" className="bg-green-500 hover:bg-green-600 text-white px-10" disabled={isLoading}>
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
        onClick={() => window.history.back()} // 前に戻る機能
      >
        前に戻る
      </CustomButton>
    </div>
  )
}
