// login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from "@/components/ui/button"
import Input from "@/app/components/ui/Input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Image from 'next/image'
import Link from 'next/link'

export default function LoginPage() {
  const [affiliateCode, setAffiliateCode] = useState('')
  const [email, setEmail] = useState('')
  const { affiliateLogin, isLoading, error } = useAuth()
  const router = useRouter()

  // 追加：パスワードリセットフォームの表示状態を管理
  const [showForgotIDForm, setShowForgotIDForm] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetMessage, setResetMessage] = useState('')
  const [resetError, setResetError] = useState('')
  const [isResetting, setIsResetting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await affiliateLogin(affiliateCode, email)
  }

  // 追加：アフィリエイトIDリセットの処理
  const handleResetSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsResetting(true)
    setResetMessage('')
    setResetError('')

    try {
      const response = await fetch('/api/sendAffiliateID', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      })

      const data = await response.json()

      if (response.ok) {
        setResetMessage('アフィリエイトIDをメールで送信しました。ご確認ください。')
      } else {
        setResetMessage('アフィリエイトIDをメールで送信しました。ご確認ください。')
      }
    } catch (error) {
      console.error('Error sending affiliate ID:', error)
      setResetError('エラーが発生しました。もう一度お試しください。')
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-center text-gray-800">NEST琵琶湖</h1>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-center text-gray-800">アフィリエイトログイン</h1>
            <p className="text-sm text-gray-600 mb-8 text-center">
              アフィリエイトIDと登録時のメールアドレスでログインできます。
            </p>
          </motion.div>

          {!showForgotIDForm ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="w-full">
                <CardHeader>
                  <CardTitle className="text-xl sm:text-2xl">ログイン情報を入力</CardTitle>
                  <CardDescription>アフィリエイトIDとメールアドレスを入力してください。</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <label htmlFor="affiliateCode" className="block text-sm font-medium text-gray-700">
                        アフィリエイトID
                      </label>
                      <Input
                        id="affiliateCode"
                        type="text"
                        placeholder="例：AFF123456"
                        value={affiliateCode}
                        onChange={(e) => setAffiliateCode(e.target.value)}
                        required
                        className="w-full h-10 sm:h-12 text-base sm:text-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        メールアドレス
                      </label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="例：example@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full h-10 sm:h-12 text-base sm:text-lg"
                      />
                    </div>
                    {error && <p className="text-red-500 text-center">{error}</p>}
                    <Button 
                      type="submit" 
                      className="w-full h-10 sm:h-12 text-base sm:text-lg"
                      disabled={isLoading}
                    >
                      {isLoading ? 'ログイン中...' : 'ログイン'}
                      <ChevronRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  </form>
                  <div className="mt-6 space-y-2">
                    <Button
                      variant="link"
                      className="text-sm text-blue-600 hover:text-blue-800 w-full justify-start p-0"
                      onClick={() => setShowForgotIDForm(true)}
                    >
                      アフィリエイトIDを忘れた方はこちら
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            // 追加：アフィリエイトIDリセットフォーム
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="w-full">
                <CardHeader>
                  <CardTitle className="text-xl sm:text-2xl">アフィリエイトIDの送信</CardTitle>
                  <CardDescription>登録済みのメールアドレスを入力してください。</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleResetSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <label htmlFor="resetEmail" className="block text-sm font-medium text-gray-700">
                        メールアドレス
                      </label>
                      <Input
                        id="resetEmail"
                        type="email"
                        placeholder="例：example@email.com"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        required
                        className="w-full h-10 sm:h-12 text-base sm:text-lg"
                      />
                    </div>
                    {resetMessage && <p className="text-green-500 text-center">{resetMessage}</p>}
                    {resetError && <p className="text-red-500 text-center">{resetError}</p>}
                    <Button 
                      type="submit" 
                      className="w-full h-10 sm:h-12 text-base sm:text-lg"
                      disabled={isResetting}
                    >
                      {isResetting ? '送信中...' : '送信'}
                      <ChevronRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  </form>
                  <div className="mt-6 space-y-2">
                    <Button
                      variant="link"
                      className="text-sm text-blue-600 hover:text-blue-800 w-full justify-start p-0"
                      onClick={() => setShowForgotIDForm(false)}
                    >
                      ログイン画面に戻る
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </main>

      <footer className="bg-gray-800 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex flex-wrap justify-between">
            <div className="w-full md:w-1/3 mb-8 md:mb-0">
              <Link href="/">
                <Image
                  src="/images/footer/logo.webp"
                  alt="NEST BIWAKO"
                  width={250}
                  height={100}
                  className="mb-6"
                />
              </Link>
              <p className="mb-4 text-base sm:text-lg">
                520-1836 <br /> 滋賀県高島市マキノ町新保浜田146-1
              </p>
              <div className="flex items-center mb-4">
                <Image
                  src="/images/footer/mail.webp"
                  alt="Email"
                  width={24}
                  height={24}
                  className="mr-4"
                />
                <a href="mailto:info.nest.biwako@gmail.com" className="hover:text-blue-300 text-base sm:text-lg">
                  info.nest.biwako@gmail.com
                </a>
              </div>
              <div className="flex space-x-9 items-center">
                <a href="https://lin.ee/AXwu9xm" target="_blank" rel="noopener noreferrer" aria-label="LINE公式アカウント">
                  <Image src="/images/footer/LINE.webp" alt="LINE" width={90} height={90} />
                </a>
                <a href="https://www.instagram.com/nest.biwako/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                  <Image src="/images/footer/Instagram_icon.webp" alt="Instagram" width={40} height={40} />
                </a>
              </div>
              <p className="text-sm mt-4">
                お問い合わせはこちらまでお願いします。
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-600 py-4">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-sm">&copy; 2024 NEST琵琶湖. All Rights Reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
