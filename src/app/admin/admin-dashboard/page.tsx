'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import CustomCard, { CustomCardContent, CustomCardHeader } from '@/app/components/ui/CustomCard'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, LogOut } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '@/app/contexts/AdminAuthContext'
import { supabase } from '@/lib/supabaseClient'
import { CalendarIcon, UserIcon, HashIcon, MailIcon, PhoneIcon, TicketIcon, ShoppingCartIcon, CircleDollarSign, Building2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  affiliateCode: string; // 追加
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

interface Reservation {
  reservationDate: string;
  stayDate: string;
  reservationNumber: string;
  reservationAmount: number;
  rewardAmount: number;
  reservationStatus: string;
}

type SortKey = 'reservationDate' | 'stayDate' | 'reservationStatus' | 'rewardAmount'
type SortOrder = 'asc' | 'desc'

export default function AdminDashboardPage() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [cumulativeData, setCumulativeData] = useState<CumulativeData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'cumulative' | 'affiliates' | 'payments'>('cumulative')
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null)
  const [affiliateReservations, setAffiliateReservations] = useState<Reservation[]>([])
  const [reservationsLoading, setReservationsLoading] = useState<boolean>(false)
  const [reservationsError, setReservationsError] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('reservationDate')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [selectedYear, setSelectedYear] = useState<string>('all')
  const [availableYears, setAvailableYears] = useState<number[]>([])
  const [dialogActiveTab, setDialogActiveTab] = useState<'details' | 'reservations'>('details')

  const { toast } = useToast()
  const { adminUser, adminLoading, logout } = useAdminAuth()
  const router = useRouter()

  // クーポン発行モーダルの状態管理
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false)
  const [newCouponCode, setNewCouponCode] = useState<string>('')

  const [couponGenerating, setCouponGenerating] = useState(false)

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

        // アフィリエイター一覧の取得
        const affiliatesResponse = await fetch('/api/admin/affiliates', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!affiliatesResponse.ok) {
          const errorData = await affiliatesResponse.json()
          throw new Error(errorData.error || 'アフィリエイター一覧の取得に失敗しました')
        }

        let affiliatesData: Affiliate[] = await affiliatesResponse.json()
        console.log('Fetched affiliates:', affiliatesData)

        // 'affiliateCode' が 'ADMIN' のものを除外
        affiliatesData = affiliatesData.filter(affiliate => affiliate.affiliateCode !== 'ADMIN')

        // 今月支払いの取得
        const paymentsResponse = await fetch('/api/admin/payments', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!paymentsResponse.ok) {
          const errorData = await paymentsResponse.json()
          throw new Error(errorData.error || '今月支払いデータの取得に失敗しました')
        }

        let paymentsData: Payment[] = await paymentsResponse.json()
        console.log('Fetched payments:', paymentsData)

        // 'affiliateCode' が 'ADMIN' のものを除外
        paymentsData = paymentsData.filter(payment => payment.affiliateCode !== 'ADMIN')

        // 累計データの取得
        const cumulativeResponse = await fetch('/api/admin/cumulative', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!cumulativeResponse.ok) {
          const errorData = await cumulativeResponse.json()
          throw new Error(errorData.error || '累計データの取得に失敗しました')
        }

        let cumulativeData: CumulativeData = await cumulativeResponse.json()
        console.log('Fetched cumulative data:', cumulativeData)

        // 累計データから 'ADMIN' のデータを除外する処理が必要
        // ここではフロントエンドでの調整が難しいため、バックエンドで対応することを推奨します

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


  const [affiliateSortKey, setAffiliateSortKey] = useState<keyof Affiliate>('affiliateCode')
  const [affiliateSortOrder, setAffiliateSortOrder] = useState<'asc' | 'desc'>('asc')

  const handleAffiliateSort = (key: keyof Affiliate) => {
    if (affiliateSortKey === key) {
      setAffiliateSortOrder(affiliateSortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setAffiliateSortKey(key)
      setAffiliateSortOrder('asc')
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

      if (aValue < bValue) return affiliateSortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return affiliateSortOrder === 'asc' ? 1 : -1
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

  const handleSort = (key: SortKey) => {
    let newSortOrder: SortOrder = 'asc'
    if (sortKey === key) {
      newSortOrder = sortOrder === 'asc' ? 'desc' : 'asc'
    }
    setSortKey(key)
    setSortOrder(newSortOrder)

    const sortedReservations = [...affiliateReservations].sort((a, b) => {
      if (key === 'reservationStatus') {
        const aIndex = statusOrderMap[a.reservationStatus.toLowerCase()] || 5
        const bIndex = statusOrderMap[b.reservationStatus.toLowerCase()] || 5
        if (aIndex < bIndex) return newSortOrder === 'asc' ? -1 : 1
        if (aIndex > bIndex) return newSortOrder === 'asc' ? 1 : -1
        return 0
      } else {
        let aValue = a[key]
        let bValue = b[key]

        if (key === 'reservationDate' || key === 'stayDate') {
          aValue = new Date(aValue).toISOString()
          bValue = new Date(bValue).toISOString()
        }

        if (key === 'rewardAmount') {
          aValue = Number(aValue)
          bValue = Number(bValue)
        }

        if (aValue < bValue) return newSortOrder === 'asc' ? -1 : 1
        if (aValue > bValue) return newSortOrder === 'asc' ? 1 : -1
        return 0
      }
    })

    setAffiliateReservations(sortedReservations)
  }

  const fetchAffiliateReservations = async (affiliateId: number) => {
    try {
      setReservationsLoading(true)
      setReservationsError(null)

      if (!adminUser) {
        throw new Error('認証トークンがありません')
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        throw new Error('セッションの取得に失敗しました')
      }
      const token = session.access_token

      const response = await fetch(`/api/admin/affiliates/${affiliateId}/reservations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '予約データの取得に失敗しました')
      }

      const data: Reservation[] = await response.json()
      setAffiliateReservations(data)

      // 利用可能な年を設定
      const years = Array.from(new Set(data.map(reservation => {
        const stayDate = new Date(reservation.stayDate)
        return stayDate.getFullYear()
      }))).sort((a, b) => b - a) // 新しい年順
      setAvailableYears(years)
    } catch (error: any) {
      setReservationsError(error.message || '予約データの取得に失敗しました')
    } finally {
      setReservationsLoading(false)
    }
  }

  // 5000円引きクーポンの生成関数
  const generate5000YenCoupon = async () => {
    setCouponGenerating(true)
    try {
      // ランダムな英数字を生成（8文字）
      const randomString = Math.random().toString(36).substring(2, 10).toUpperCase()
      const couponCode = `REVIEWCOUPON${randomString}`

      // クーポンをデータベースに保存
      const { data, error } = await supabase.from('coupons').insert([{
        coupon_code: couponCode,
        discount_amount: 5000,
        is_used: false, // 明示的に FALSE を設定
        discount_rate: null, // 固定金額の場合はnullにする
        affiliate_code: 'ADMIN', // 必要に応じて適切な値を設定
      }])

      if (error) {
        console.error('Error generating coupon:', error)
        toast({
          title: "エラー",
          description: "クーポンの生成に失敗しました。",
          variant: "destructive",
        })
      } else {
        setNewCouponCode(couponCode) // 最新のクーポンコードのみを保存
      }
    } catch (error) {
      console.error('Error generating coupon:', error)
    } finally {
      setCouponGenerating(false)
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
          <div className="flex items-center">
            {/* クーポン発行ボタン */}
            <Dialog open={isCouponModalOpen} onOpenChange={setIsCouponModalOpen}>
              <DialogTrigger asChild>
                <Button className="mr-4 bg-green-500 hover:bg-green-600 text-white">
                  クーポン発行
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>クーポン発行</DialogTitle>
                </DialogHeader>
                <div className="p-4">
                  {/* 1000円引きクーポンの表示 */}
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold">1000円引きクーポン</h2>
                    <p className="text-xl font-bold">COUPONNEST</p>
                  </div>

                  {/* 5000円引きクーポンの生成 */}
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold">5000円引きクーポン</h2>
                    <Button onClick={generate5000YenCoupon} disabled={couponGenerating}>
                      {couponGenerating ? '生成中...' : 'クーポンを発行'}
                    </Button>
                    {newCouponCode && (
                      <div className="mt-4">
                        <p className="text-xl font-bold">{newCouponCode}</p>
                      </div>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* ログアウトボタン */}
            <Button
              variant="destructive"
              onClick={logout}
              className="bg-red-500 hover:bg-red-600 text-white flex items-center"
            >
              <LogOut className="w-4 h-4 mr-2" />
              ログアウト
            </Button>
          </div>
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
                        <TableHead className="bg-gray-100 cursor-pointer" onClick={() => handleAffiliateSort('affiliateCode')}>
                          コード <ArrowUpDown className="inline ml-2" />
                        </TableHead>
                        <TableHead className="bg-gray-100 cursor-pointer" onClick={() => handleAffiliateSort('nameKanji')}>
                          名前 <ArrowUpDown className="inline ml-2" />
                        </TableHead>
                        <TableHead className="bg-gray-100 cursor-pointer" onClick={() => handleAffiliateSort('email')}>
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
                            <Dialog onOpenChange={(open) => {
                              if (open) {
                                setSelectedAffiliate(affiliate)
                                fetchAffiliateReservations(affiliate.id)
                              } else {
                                setSelectedAffiliate(null)
                                setAffiliateReservations([])
                                setAvailableYears([])
                                setSelectedYear('all')
                                setSortKey('reservationDate')
                                setSortOrder('asc')
                                setDialogActiveTab('details')
                              }
                            }}>
                              <DialogTrigger asChild>
                                <Button variant="link" className="p-0 h-auto font-normal text-blue-500 hover:text-blue-700">
                                  {affiliate.nameKanji} ({affiliate.nameKana})
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[800px]">
                                <DialogHeader>
                                  <DialogTitle className="text-2xl font-bold mb-4 text-blue-600">アフィリエイター詳細情報</DialogTitle>
                                </DialogHeader>
                                <div className="flex mb-6 bg-white rounded-lg shadow-md overflow-hidden">
                                  {['details', 'reservations'].map((tab) => (
                                    <button
                                      key={tab}
                                      className={`flex-1 px-4 py-3 font-semibold transition-colors duration-200 ${
                                        dialogActiveTab === tab ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                                      }`}
                                      onClick={() => setDialogActiveTab(tab as 'details' | 'reservations')}
                                    >
                                      {tab === 'details' && '詳細情報'}
                                      {tab === 'reservations' && '予約情報'}
                                    </button>
                                  ))}
                                </div>
                                {dialogActiveTab === 'details' && selectedAffiliate && (
                                  <div className="grid gap-6 py-4">
                                    {/* アフィリエイター詳細情報 */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <h3 className="text-lg font-semibold text-gray-700">基本情報</h3>
                                        <div className="space-y-1">
                                          <div className="flex items-center space-x-2">
                                            <CalendarIcon className="w-5 h-5 text-blue-500" />
                                            <span className="text-sm text-gray-600">登録日:</span>
                                            <span className="font-medium">{new Date(selectedAffiliate.registrationDate).toLocaleDateString()}</span>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <UserIcon className="w-5 h-5 text-blue-500" />
                                            <span className="text-sm text-gray-600">名前:</span>
                                            <span className="font-medium">{`${selectedAffiliate.nameKanji} (${selectedAffiliate.nameKana})`}</span>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <HashIcon className="w-5 h-5 text-blue-500" />
                                            <span className="text-sm text-gray-600">アフィリエイトID:</span>
                                            <span className="font-medium">{selectedAffiliate.affiliateCode}</span>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <h3 className="text-lg font-semibold text-gray-700">連絡先情報</h3>
                                        <div className="space-y-1">
                                          <div className="flex items-center space-x-2">
                                            <MailIcon className="w-5 h-5 text-blue-500" />
                                            <span className="text-sm text-gray-600">メール:</span>
                                            <span className="font-medium">{selectedAffiliate.email}</span>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <PhoneIcon className="w-5 h-5 text-blue-500" />
                                            <span className="text-sm text-gray-600">電話番号:</span>
                                            <span className="font-medium">{selectedAffiliate.phoneNumber}</span>
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
                                            {selectedAffiliate.promotionMediums.map((medium, index) => (
                                              <li key={index} className="text-sm">{medium}</li>
                                            ))}
                                          </ul>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                          <span className="text-sm font-semibold text-gray-600">媒体情報:</span>
                                          <ul className="space-y-1 mt-1">
                                            {selectedAffiliate.promotioninfo.map((url, index) => (
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
                                          <span className="font-medium">{selectedAffiliate.couponCode}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <ShoppingCartIcon className="w-5 h-5 text-blue-500" />
                                          <span className="text-sm text-gray-600">総予約件数:</span>
                                          <span className="font-medium">{selectedAffiliate.totalReservations}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <CircleDollarSign className="w-5 h-5 text-blue-500" />
                                          <span className="text-sm text-gray-600">総報酬額:</span>
                                          <span className="font-medium">{selectedAffiliate.totalRewards.toLocaleString()}円</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <h3 className="text-lg font-semibold text-gray-700">銀行情報</h3>
                                      <div className="flex items-center space-x-2">
                                        <Building2 className="w-5 h-5 text-blue-500" />
                                        <span className="text-sm text-gray-600">銀行詳細:</span>
                                        <span className="font-medium">{selectedAffiliate.bankInfo}</span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {dialogActiveTab === 'reservations' && (
                                  <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                      <Select value={selectedYear} onValueChange={setSelectedYear}>
                                        <SelectTrigger className="w-36">
                                          <SelectValue placeholder="年を選択" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="all">全期間</SelectItem>
                                          {availableYears.map((year) => (
                                            <SelectItem key={year} value={String(year)}>{`${year}年`}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <Button variant="outline" onClick={() => handleSort('reservationDate')}>
                                        並び替え <ArrowUpDown className="inline ml-2" />
                                      </Button>
                                    </div>
                                    <div className="overflow-x-auto">
                                      {reservationsLoading ? (
                                        <p className="text-center text-gray-500">予約データを読み込み中...</p>
                                      ) : reservationsError ? (
                                        <p className="text-center text-red-500">{reservationsError}</p>
                                      ) : affiliateReservations.length === 0 ? (
                                        <p className="text-center text-gray-500">予約がありません。</p>
                                      ) : (
                                        <Table>
                                          <TableHeader>
                                            <TableRow>
                                              <TableHead className="cursor-pointer" onClick={() => handleSort('reservationDate')}>
                                                予約日 <ArrowUpDown className="inline ml-2" />
                                              </TableHead>
                                              <TableHead className="cursor-pointer" onClick={() => handleSort('stayDate')}>
                                                宿泊日 <ArrowUpDown className="inline ml-2" />
                                              </TableHead>
                                              <TableHead>予約番号</TableHead>
                                              <TableHead>予約金額</TableHead>
                                              <TableHead className="cursor-pointer" onClick={() => handleSort('rewardAmount')}>
                                                報酬額 <ArrowUpDown className="inline ml-2" />
                                              </TableHead>
                                              <TableHead className="cursor-pointer" onClick={() => handleSort('reservationStatus')}>
                                                ステータス <ArrowUpDown className="inline ml-2" />
                                              </TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {affiliateReservations
                                              .filter(reservation => {
                                                const reservationYear = new Date(reservation.stayDate).getFullYear()
                                                return selectedYear === 'all' || reservationYear === parseInt(selectedYear)
                                              })
                                              .map((reservation) => (
                                                <TableRow key={reservation.reservationNumber}>
                                                  <TableCell>{new Date(reservation.reservationDate).toLocaleDateString('ja-JP')}</TableCell>
                                                  <TableCell>{new Date(reservation.stayDate).toLocaleDateString('ja-JP')}</TableCell>
                                                  <TableCell>{reservation.reservationNumber}</TableCell>
                                                  <TableCell>{reservation.reservationAmount.toLocaleString()}円</TableCell>
                                                  <TableCell>{reservation.rewardAmount.toLocaleString()}円</TableCell>
                                                  <TableCell>
                                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                                      reservationStatusMap[reservation.reservationStatus.toLowerCase()]?.color || 'bg-secondary text-secondary-foreground'
                                                    }`}>
                                                      {reservationStatusMap[reservation.reservationStatus.toLowerCase()]?.label || '不明'}
                                                    </span>
                                                  </TableCell>
                                                </TableRow>
                                            ))}
                                          </TableBody>
                                        </Table>
                                      )}
                                    </div>
                                  </div>
                                )}
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

// reservation_status のマッピングとソート順
const reservationStatusMap: { [key: string]: { label: string, color: string } } = {
  'pending': { label: 'チェックイン待ち', color: 'bg-yellow-100 text-yellow-800' },
  'confirmed': { label: 'チェックイン待ち', color: 'bg-yellow-100 text-yellow-800' },
  'cancelled': { label: 'キャンセル', color: 'bg-red-100 text-red-800' },
  'customer_cancelled': { label: 'キャンセル', color: 'bg-red-100 text-red-800' },
  'paid': { label: '報酬支払済み', color: 'bg-green-100 text-green-800' },
  'processing': { label: '報酬支払い待ち', color: 'bg-blue-100 text-blue-800' },
}

const statusOrderMap: { [key: string]: number } = {
  'paid': 1,
  'processing': 2,
  'pending': 3,
  'confirmed': 3,
  'cancelled': 4,
  'customer_cancelled': 4,
}
