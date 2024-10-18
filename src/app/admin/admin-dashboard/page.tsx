'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import CustomCard, { CustomCardContent, CustomCardHeader } from '@/app/components/ui/CustomCard'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, LogOut, ChevronDown } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '@/app/contexts/AdminAuthContext'
import { supabase } from '@/lib/supabaseClient'
import { CalendarIcon, UserIcon, HashIcon, MailIcon, PhoneIcon, TicketIcon, ShoppingCartIcon, CircleDollarSign, Building2 } from 'lucide-react'

interface Affiliate {
  id: number;
  affiliateCode: string;
  nameKanji: string;
  nameKana: string;
  email: string;
  couponCode: string;
  totalRewards: number;
  monthlyRewards: { [key: string]: number };
  registrationDate: string;
  phoneNumber: string;
  promotionMediums: string[];
  promotioninfo: string[];
  totalReservations: number;
  bankInfo: string;
}

interface Payment {
  id: number;
  name: string;
  bankInfo: string;
  amount: number;
  status: 'unpaid' | 'paid';
  paymentDate?: string;
}

interface CumulativeData {
  totalReservations: number;
  totalSales: number;
  totalPayments: number;
  yearlyReservations: number;
  yearlySales: number;
  yearlyPayments: number;
  monthlyReservations: number;
  monthlySales: number;
  monthlyPayments: number;
}

export default function AdminDashboardPage() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [cumulativeData, setCumulativeData] = useState<CumulativeData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'cumulative' | 'affiliates' | 'payments'>('cumulative')
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null)

  const { toast } = useToast()
  const { adminUser, adminLoading, logout } = useAdminAuth()
  const router = useRouter()

  useEffect(() => {
    if (!adminLoading) {
      if (!adminUser) {
        router.push("/auth/login")
      } else {
        const role = adminUser.app_metadata?.role
        if (role !== 'admin') {
          router.push("/auth/login")
        }
      }
    }
  }, [adminUser, adminLoading, router])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        if (!adminUser) {
          throw new Error('認証トークンがありません')
        }

        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError || !session) {
          throw new Error('セッションの取得に失敗しました')
        }
        const token = session.access_token

        const affiliatesResponse = await fetch('/api/admin/affiliates', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!affiliatesResponse.ok) {
          const errorData = await affiliatesResponse.json()
          throw new Error(errorData.error || 'アフィリエイター一覧の取得に失敗しました')
        }

        const affiliatesData: Affiliate[] = await affiliatesResponse.json()
        console.log('Fetched affiliates:', affiliatesData)

        const paymentsResponse = await fetch('/api/admin/payments', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!paymentsResponse.ok) {
          const errorData = await paymentsResponse.json()
          throw new Error(errorData.error || '今月支払いデータの取得に失敗しました')
        }

        const paymentsData: Payment[] = await paymentsResponse.json()
        console.log('Fetched payments:', paymentsData)

        const cumulativeResponse = await fetch('/api/admin/cumulative', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!cumulativeResponse.ok) {
          const errorData = await cumulativeResponse.json()
          throw new Error(errorData.error || '累計データの取得に失敗しました')
        }

        const cumulativeData: CumulativeData = await cumulativeResponse.json()
        console.log('Fetched cumulative data:', cumulativeData)

        setAffiliates(affiliatesData)
        setPayments(paymentsData)
        setCumulativeData(cumulativeData)
        setLoading(false)
      } catch (err: any) {
        console.error('Error fetching data:', err)
        setError(err.message || 'データの取得に失敗しました')
        setLoading(false)
      }
    }

    if (adminUser && !adminLoading) {
      fetchData()
    }
  }, [adminUser, adminLoading])

  const [sortKey, setSortKey] = useState<keyof Affiliate>('affiliateCode')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const handleSort = (key: keyof Affiliate) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortOrder('asc')
    }

    const sortedAffiliates = [...affiliates].sort((a, b) => {
      let aValue = a[key]
      let bValue = b[key]

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
      }
      if (typeof bValue === 'string') {
        bValue = bValue.toLowerCase()
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    setAffiliates(sortedAffiliates)
  }

  const handlePaymentStatusChange = async (affiliateId: number) => {
    try {
      if (!adminUser) {
        throw new Error('認証トークンがありません')
      }
  
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        throw new Error('セッションの取得に失敗しました')
      }
      const token = session.access_token
  
      const response = await fetch(`/api/admin/payments/${affiliateId}/toggle`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
  
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '支払いステータスの更新に失敗しました')
      }
  
      const paymentsResponse = await fetch('/api/admin/payments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
  
      if (!paymentsResponse.ok) {
        const errorData = await paymentsResponse.json()
        throw new Error(errorData.error || '支払いデータの再取得に失敗しました')
      }
  
      const paymentsData: Payment[] = await paymentsResponse.json()
  
      setPayments(paymentsData)
  
      toast({
        title: "ステータス更新成功",
        description: "支払いステータスを更新しました。",
      })
    } catch (error: any) {
      toast({
        title: "エラー",
        description: error.message || '支払いステータスの更新に失敗しました。',
        variant: "destructive",
      })
      console.error('Error updating payment status:', error)
    }
  }

  if (loading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-2xl font-semibold text-gray-700"
        >
          読み込み中...
        </motion.div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-2xl font-semibold text-red-600"
        >
          {error}
        </motion.div>
      </div>
    )
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <motion.h1 
            className="text-3xl font-bold text-gray-800"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            NEST琵琶湖アフィリエイター管理画面
          </motion.h1>
          <Button
            variant="destructive"
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 text-white flex items-center"
          >
            <LogOut className="w-4 h-4 mr-2" />
            ログアウト
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <motion.div 
          className="flex mb-6 bg-white rounded-lg shadow-md overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {['affiliates', 'payments', 'cumulative'].map((tab) => (
            <button
              key={tab}
              className={`flex-1 px-4 py-3 font-semibold transition-colors duration-200 ${
                activeTab === tab ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => setActiveTab(tab as 'affiliates' | 'payments' | 'cumulative')}
            >
              {tab === 'affiliates' && 'アフィリエイター一覧'}
              {tab === 'payments' && '今月支払い'}
              {tab === 'cumulative' && '累計'}
            </button>
          ))}
        </motion.div>

        {activeTab === 'affiliates' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <CustomCard className="bg-white shadow-lg rounded-lg overflow-hidden">
              <CustomCardHeader className="bg-blue-500 text-white p-4">
                <h2 className="text-xl font-bold">アフィリエイター一覧</h2>
              </CustomCardHeader>
              <CustomCardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="bg-gray-100 cursor-pointer" onClick={() => handleSort('affiliateCode')}>
                          コード <ArrowUpDown className="inline ml-2" />
                        </TableHead>
                        <TableHead className="bg-gray-100 cursor-pointer" onClick={() => handleSort('nameKanji')}>
                          名前 <ArrowUpDown className="inline ml-2" />
                        </TableHead>
                        <TableHead className="bg-gray-100 cursor-pointer" onClick={() => handleSort('email')}>
                          メール <ArrowUpDown className="inline ml-2" />
                        </TableHead>
                        <TableHead className="bg-gray-100">クーポンコード</TableHead>
                        <TableHead className="bg-gray-100">累計報酬額</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {affiliates.map((affiliate) => (
                        <TableRow key={affiliate.id} className="hover:bg-gray-50 transition-colors duration-200">
                          <TableCell>{affiliate.affiliateCode}</TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="link" className="p-0 h-auto font-normal text-blue-500 hover:text-blue-700">
                                  {affiliate.nameKanji} ({affiliate.nameKana})
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[600px]">
                                <DialogHeader>
                                  <DialogTitle className="text-2xl font-bold mb-4 text-blue-600">アフィリエイター詳細情報</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-6 py-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <h3 className="text-lg font-semibold text-gray-700">基本情報</h3>
                                      <div className="space-y-1">
                                        <div className="flex items-center space-x-2">
                                          <CalendarIcon className="w-5 h-5 text-blue-500" />
                                          <span className="text-sm text-gray-600">登録日:</span>
                                          <span className="font-medium">{new Date(affiliate.registrationDate).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <UserIcon className="w-5 h-5 text-blue-500" />
                                          <span className="text-sm text-gray-600">名前:</span>
                                          <span className="font-medium">{`${affiliate.nameKanji} (${affiliate.nameKana})`}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <HashIcon className="w-5 h-5 text-blue-500" />
                                          <span className="text-sm text-gray-600">アフィリエイトID:</span>
                                          <span className="font-medium">{affiliate.affiliateCode}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <h3 className="text-lg font-semibold text-gray-700">連絡先情報</h3>
                                      <div className="space-y-1">
                                        <div className="flex items-center space-x-2">
                                          <MailIcon className="w-5 h-5 text-blue-500" />
                                          <span className="text-sm text-gray-600">:</span>
                                          <span className="font-medium">{affiliate.email}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <PhoneIcon className="w-5 h-5 text-blue-500" />
                                          <span className="text-sm text-gray-600">:</span>
                                          <span className="font-medium">{affiliate.phoneNumber}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <h3 className="text-lg font-semibold text-gray-700">プロモーション情報</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="bg-gray-50 p-3 rounded-lg">
                                        <span className="text-sm font-semibold text-gray-600">媒体:</span>
                                        <ul className="space-y-1 mt-1">
                                          {affiliate.promotionMediums.map((medium, index) => (
                                            <li key={index} className="text-sm">{medium}</li>
                                          ))}
                                        </ul>
                                      </div>
                                      <div className="bg-gray-50 p-3 rounded-lg">
                                        <span className="text-sm font-semibold text-gray-600">媒体情報:</span>
                                        <ul className="space-y-1 mt-1">
                                          {affiliate.promotioninfo.map((url, index) => (
                                            <li key={index}>
                                              <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:text-blue-700 underline">
                                                {url}
                                              </a>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <h3 className="text-lg font-semibold text-gray-700">報酬情報</h3>
                                    <div className="grid grid-cols-1 gap-4">
                                      <div className="flex items-center space-x-2">
                                        <TicketIcon className="w-5 h-5 text-blue-500" />
                                        <span className="text-sm text-gray-600">クーポンコード:</span>
                                        <span className="font-medium">{affiliate.couponCode}</span>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <ShoppingCartIcon className="w-5 h-5 text-blue-500" />
                                        <span className="text-sm text-gray-600">総予約件数:</span>
                                        <span className="font-medium">{affiliate.totalReservations}</span>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <CircleDollarSign className="w-5 h-5 text-blue-500" />
                                        <span className="text-sm text-gray-600">総報酬額:</span>
                                        <span className="font-medium">{affiliate.totalRewards.toLocaleString()}円</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <h3 className="text-lg font-semibold text-gray-700">銀行情報</h3>
                                    <div className="flex items-center space-x-2">
                                      <Building2 className="w-5 h-5 text-blue-500" />
                                      <span className="text-sm text-gray-600">銀行詳細:</span>
                                      <span className="font-medium">{affiliate.bankInfo}</span>
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                          <TableCell>{affiliate.email}</TableCell>
                          <TableCell>{affiliate.couponCode}</TableCell>
                          <TableCell>{affiliate.totalRewards.toLocaleString()}円</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CustomCardContent>
            </CustomCard>
          </motion.div>
        )}

        {activeTab === 'payments' && (
          <motion.div 
            className="space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <CustomCard className="bg-white shadow-lg rounded-lg overflow-hidden">
              <CustomCardHeader className="bg-blue-500 text-white p-4">
                <h2 className="text-xl font-bold">今月支払い</h2>
              </CustomCardHeader>
              <CustomCardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="bg-gray-100">名前</TableHead>
                        <TableHead className="bg-gray-100">口座情報</TableHead>
                        <TableHead className="bg-gray-100">支払金額</TableHead>
                        <TableHead className="bg-gray-100">ステータス</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.filter(payment => payment.status === 'unpaid').map((payment) => (
                        <TableRow key={payment.id} className="hover:bg-gray-50 transition-colors duration-200">
                          <TableCell>{payment.name}</TableCell>
                          <TableCell>{payment.bankInfo}</TableCell>
                          <TableCell>{payment.amount.toLocaleString()}円</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={payment.status === 'paid'}
                                onCheckedChange={() => handlePaymentStatusChange(payment.id)}
                              />
                              <span className={payment.status === 'paid' ? 'text-green-600' : 'text-red-600'}>
                                {payment.status === 'paid' ? '支払済' : '未払い'}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CustomCardContent>
            </CustomCard>

            <CustomCard className="bg-white shadow-lg rounded-lg overflow-hidden">
              <CustomCardHeader className="bg-blue-500 text-white p-4">
                <h2 className="text-xl font-bold">支払済</h2>
              </CustomCardHeader>
              <CustomCardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="bg-gray-100">名前</TableHead>
                        <TableHead className="bg-gray-100">口座情報</TableHead>
                        <TableHead className="bg-gray-100">支払金額</TableHead>
                        <TableHead className="bg-gray-100">ステータス</TableHead>
                        <TableHead className="bg-gray-100">支払日</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.filter(payment => payment.status === 'paid').map((payment) => (
                        <TableRow key={payment.id} className="hover:bg-gray-50 transition-colors duration-200">
                          <TableCell>{payment.name}</TableCell>
                          <TableCell>{payment.bankInfo}</TableCell>
                          <TableCell>{payment.amount.toLocaleString()}円</TableCell>
                          <TableCell>
                            <span className="text-green-600">支払済</span>
                          </TableCell>
                          <TableCell>{payment.paymentDate}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CustomCardContent>
            </CustomCard>
          </motion.div>
        )}

        {activeTab === 'cumulative' && cumulativeData && (
          <motion.div 
            className="grid gap-6 md:grid-cols-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {[
              { title: '累計アフィリエイター予約件数', value: cumulativeData.totalReservations },
              { title: '累計アフィリエイター売上', value: cumulativeData.totalSales, isCurrency: true },
              { title: '累計アフィリエイター報酬額', value: cumulativeData.totalPayments, isCurrency: true },
              { title: '年間アフィリエイター予約件数', value: cumulativeData.yearlyReservations },
              { title: '年間アフィリエイター売上', value: cumulativeData.yearlySales, isCurrency: true },
              { title: '年間アフィリエイター報酬額', value: cumulativeData.yearlyPayments, isCurrency: true },
              { title: '月間アフィリエイター予約件数', value: cumulativeData.monthlyReservations },
              { title: '月間アフィリエイター売上', value: cumulativeData.monthlySales, isCurrency: true },
              { title: '月間アフィリエイター報酬額', value: cumulativeData.monthlyPayments, isCurrency: true },
            ].map((item, index) => (
              <CustomCard key={index} className="bg-white shadow-lg rounded-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
                <CustomCardHeader className="bg-blue-500 text-white p-4">
                  <h2 className="text-lg font-semibold">{item.title}</h2>
                </CustomCardHeader>
                <CustomCardContent className="p-6">
                  <div className="text-3xl font-bold text-gray-800">
                    {item.isCurrency ? `${item.value.toLocaleString()}円` : item.value.toLocaleString()}
                  </div>
                </CustomCardContent>
              </CustomCard>
            ))}
          </motion.div>
        )}
      </main>
    </div>
  )
}