'use client'

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from '@supabase/supabase-js'
import Image from "next/image"
import { useAdminAuth } from '@/app/contexts/AdminAuthContext'
import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { Button } from "@/components/ui/button"
import Input from "@/app/components/ui/Input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const LoginPage = () => {
  const [email, setEmail] = useState("info.nest.biwako@gmail.com")
  const [password, setPassword] = useState("yasashiku1")
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { adminUser, adminLoading } = useAdminAuth()

  useEffect(() => {
    if (adminUser && !adminLoading) {
      router.push("/admin/admin-dashboard")
    }
  }, [adminUser, adminLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      console.log("ログイン成功:", data)
      router.push("/admin/admin-dashboard")
    } catch (error: unknown) {
      console.error("ログインエラー:", error)
      if (error instanceof Error) {
        setError("ログインに失敗しました: " + error.message)
      } else {
        setError(
          "ログインに失敗しました。メールアドレスとパスワードを確認してください。"
        )
      }
    }
  }

  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        読み込み中...
      </div>
    )
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
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-center text-gray-800">NEST琵琶湖管理者ログイン</h1>
            <p className="text-sm text-gray-600 mb-8 text-center">
              管理者アカウントでログインしてください。
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-xl sm:text-2xl">ログイン情報を入力</CardTitle>
                <CardDescription>メールアドレスとパスワードを入力してください。</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      メールアドレス
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full h-10 sm:h-12 text-base sm:text-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      パスワード
                    </label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full h-10 sm:h-12 text-base sm:text-lg"
                    />
                  </div>
                  {error && <p className="text-red-500 text-center">{error}</p>}
                  <Button 
                    type="submit" 
                    className="w-full h-10 sm:h-12 text-base sm:text-lg"
                  >
                    ログイン
                    <ChevronRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </form>
                <div className="mt-6 text-center">
                  <Link href="/" className="text-sm text-blue-600 hover:text-blue-800">
                    ホームに戻る
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
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
                <Link href="#" className="hover:text-blue-300">
                  520-1836 <br /> 滋賀県高島市マキノ町新保浜田146-1
                </Link>
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
              <p className="text-sm">
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

export default LoginPage