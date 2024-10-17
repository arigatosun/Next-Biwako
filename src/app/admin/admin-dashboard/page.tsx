// src/app/admin/admin-dashboard/page.tsx

'use client'

import { useState, useEffect } from 'react'
import CustomCard, { CustomCardContent, CustomCardHeader } from '@/app/components/ui/CustomCard'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '@/app/contexts/AdminAuthContext'
import { supabase } from '@/lib/supabaseClient'

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
  promotionUrls: string[];
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
  const { adminUser, adminLoading, logout } = useAdminAuth() // logout を追加
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
  
      // 支払い情報を再取得
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
      <div className="min-h-screen flex items-center justify-center">
        読み込み中...
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="bg-background text-foreground">
      <main className="container mx-auto px-3 py-8 sm:px-4 sm:py-12 max-w-6xl">
        {/* ヘッダー部分にログアウトボタンを追加 */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">管理画面</h1>
          <Button
            variant="secondary"
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            ログアウト
          </Button>
        </div>

        <div className="flex mb-6">
          <button
            className={`px-4 py-2 font-semibold rounded-tl-lg rounded-tr-lg ${
              activeTab === 'affiliates' ? 'bg-[#00A2EF] text-white' : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => setActiveTab('affiliates')}
          >
            アフィリエイター一覧
          </button>
          <button
            className={`px-4 py-2 font-semibold rounded-tl-lg rounded-tr-lg ${
              activeTab === 'payments' ? 'bg-[#00A2EF] text-white' : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => setActiveTab('payments')}
          >
            今月支払い
          </button>
          <button
            className={`px-4 py-2 font-semibold rounded-tl-lg rounded-tr-lg ${
              activeTab === 'cumulative' ? 'bg-[#00A2EF] text-white' : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => setActiveTab('cumulative')}
          >
            累計
          </button>
        </div>

        {activeTab === 'affiliates' && (
          <CustomCard className="transition-all duration-300 hover:shadow-lg bg-card text-card-foreground">
            <CustomCardHeader className="bg-[#00A2EF] text-white h-16 flex items-center justify-between">
              <h2 className="text-xl font-bold">アフィリエイター一覧</h2>
            </CustomCardHeader>
            <CustomCardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="bg-muted cursor-pointer" onClick={() => handleSort('affiliateCode')}>
                        コード <ArrowUpDown className="inline ml-2" />
                      </TableHead>
                      <TableHead className="bg-muted cursor-pointer" onClick={() => handleSort('nameKanji')}>
                        名前 <ArrowUpDown className="inline ml-2" />
                      </TableHead>
                      <TableHead className="bg-muted cursor-pointer" onClick={() => handleSort('email')}>
                        メール <ArrowUpDown className="inline ml-2" />
                      </TableHead>
                      <TableHead className="bg-muted">クーポンコード</TableHead>
                      <TableHead className="bg-muted">累計報酬額</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {affiliates.map((affiliate) => (
                      <TableRow key={affiliate.id} className="hover:bg-muted/50 transition-colors duration-200">
                        <TableCell>{affiliate.affiliateCode}</TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="link" className="p-0 h-auto font-normal">
                                {affiliate.nameKanji} ({affiliate.nameKana})
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                              <DialogHeader>
                                <DialogTitle>アフィリエイター詳細情報</DialogTitle>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <span className="font-bold">アフィリエイト登録日:</span>
                                  <span className="col-span-3">{affiliate.registrationDate}</span>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <span className="font-bold">名前+ID:</span>
                                  <span className="col-span-3">{`${affiliate.nameKanji} (${affiliate.affiliateCode})`}</span>
                                </div>
                                <div className="grid grid-cols-4 items-start gap-4">
                                  <span className="font-bold">媒体:</span>
                                  <span className="col-span-3">
                                    <ul className="list-disc list-inside">
                                      {affiliate.promotionMediums.map((medium, index) => (
                                        <li key={index}>{medium}</li>
                                      ))}
                                    </ul>
                                  </span>
                                </div>
                                <div className="grid grid-cols-4 items-start gap-4">
                                  <span className="font-bold">媒体情報:</span>
                                  <span className="col-span-3">
                                    <ul className="list-disc list-inside">
                                      {affiliate.promotionUrls.map((url, index) => (
                                        <li key={index}>
                                          <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                                            {url}
                                          </a>
                                        </li>
                                      ))}
                                    </ul>
                                  </span>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <span className="font-bold">クーポンコード:</span>
                                  <span className="col-span-3">{affiliate.couponCode}</span>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <span className="font-bold">電話番号:</span>
                                  <span className="col-span-3">{affiliate.phoneNumber}</span>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <span className="font-bold">メールアドレス:</span>
                                  <span className="col-span-3">{affiliate.email}</span>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <span className="font-bold">総予約件数:</span>
                                  <span className="col-span-3">{affiliate.totalReservations}</span>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <span className="font-bold">総報酬額:</span>
                                  <span className="col-span-3">{affiliate.totalRewards.toLocaleString()}円</span>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <span className="font-bold">銀行情報:</span>
                                  <span className="col-span-3">{affiliate.bankInfo}</span>
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
        )}

        {activeTab === 'payments' && (
          <div className="space-y-8">
            <CustomCard className="transition-all duration-300 hover:shadow-lg bg-card text-card-foreground">
              <CustomCardHeader className="bg-[#00A2EF] text-white h-16 flex items-center justify-between">
                <h2 className="text-lg font-semibold">今月支払い</h2>
              </CustomCardHeader>
              <CustomCardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="bg-muted">名前</TableHead>
                        <TableHead className="bg-muted">口座情報</TableHead>
                        <TableHead className="bg-muted">支払金額</TableHead>
                        <TableHead className="bg-muted">ステータス</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.filter(payment => payment.status === 'unpaid').map((payment) => (
                        <TableRow key={payment.id} className="hover:bg-muted/50 transition-colors duration-200">
                          <TableCell>{payment.name}</TableCell>
                          <TableCell>{payment.bankInfo}</TableCell>
                          <TableCell>{payment.amount.toLocaleString()}円</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={payment.status === 'paid'}
                                onCheckedChange={() => handlePaymentStatusChange(payment.id)}
                              />
                              <span>{payment.status === 'paid' ? '支払済' : '未払い'}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CustomCardContent>
            </CustomCard>

            <CustomCard className="transition-all duration-300 hover:shadow-lg bg-card text-card-foreground">
              <CustomCardHeader className="bg-[#00A2EF] text-white h-16 flex items-center justify-between">
                <h2 className="text-lg font-semibold">支払済</h2>
              </CustomCardHeader>
              <CustomCardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="bg-muted">名前</TableHead>
                        <TableHead className="bg-muted">口座情報</TableHead>
                        <TableHead className="bg-muted">支払金額</TableHead>
                        <TableHead className="bg-muted">ステータス</TableHead>
                        <TableHead className="bg-muted">支払日</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.filter(payment => payment.status === 'paid').map((payment) => (
                        <TableRow key={payment.id} className="hover:bg-muted/50 transition-colors duration-200">
                          <TableCell>{payment.name}</TableCell>
                          <TableCell>{payment.bankInfo}</TableCell>
                          <TableCell>{payment.amount.toLocaleString()}円</TableCell>
                          <TableCell>
                            <span>支払済</span>
                          </TableCell>
                          <TableCell>{payment.paymentDate}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CustomCardContent>
            </CustomCard>
          </div>
        )}

        {activeTab === 'cumulative' && cumulativeData && (
          <div className="grid gap-6 md:grid-cols-3">
            <CustomCard className="transition-all duration-300 hover:shadow-lg bg-card text-card-foreground">
              <CustomCardHeader className="bg-[#00A2EF] text-white h-16 flex items-center justify-between">
                <h2 className="text-lg font-semibold">累計アフィリエイター予約件数</h2>
              </CustomCardHeader>
              <CustomCardContent>
                <div className="text-2xl font-bold">{cumulativeData.totalReservations.toLocaleString()}</div>
              </CustomCardContent>
            </CustomCard>
            <CustomCard className="transition-all duration-300 hover:shadow-lg bg-card text-card-foreground">
              <CustomCardHeader className="bg-[#00A2EF] text-white h-16 flex items-center justify-between">
                <h2 className="text-lg font-semibold">累計アフィリエイター売上</h2>
              </CustomCardHeader>
              <CustomCardContent>
                <div className="text-2xl font-bold">{cumulativeData.totalSales.toLocaleString()}円</div>
              </CustomCardContent>
            </CustomCard>
            <CustomCard className="transition-all duration-300 hover:shadow-lg bg-card text-card-foreground">
              <CustomCardHeader className="bg-[#00A2EF] text-white h-16 flex items-center justify-between">
                <h2 className="text-lg font-semibold">累計アフィリエイター報酬額</h2>
              </CustomCardHeader>
              <CustomCardContent>
                <div className="text-2xl font-bold">{cumulativeData.totalPayments.toLocaleString()}円</div>
              </CustomCardContent>
            </CustomCard>
            <CustomCard className="transition-all duration-300 hover:shadow-lg bg-card text-card-foreground">
              <CustomCardHeader className="bg-[#00A2EF] text-white h-16 flex items-center justify-between">
                <h2 className="text-lg font-semibold">年間アフィリエイター予約件数</h2>
              </CustomCardHeader>
              <CustomCardContent>
                <div className="text-2xl font-bold">{cumulativeData.yearlyReservations.toLocaleString()}</div>
              </CustomCardContent>
            </CustomCard>
            <CustomCard className="transition-all duration-300 hover:shadow-lg bg-card text-card-foreground">
              <CustomCardHeader className="bg-[#00A2EF] text-white h-16 flex items-center justify-between">
                <h2 className="text-lg font-semibold">年間アフィリエイター売上</h2>
              </CustomCardHeader>
              <CustomCardContent>
                <div className="text-2xl font-bold">{cumulativeData.yearlySales.toLocaleString()}円</div>
              </CustomCardContent>
            </CustomCard>
            <CustomCard className="transition-all duration-300 hover:shadow-lg bg-card text-card-foreground">
              <CustomCardHeader className="bg-[#00A2EF] text-white h-16 flex items-center justify-between">
                <h2 className="text-lg font-semibold">年間アフィリエイター報酬額</h2>
              </CustomCardHeader>
              <CustomCardContent>
                <div className="text-2xl font-bold">{cumulativeData.yearlyPayments.toLocaleString()}円</div>
              </CustomCardContent>
            </CustomCard>
            <CustomCard className="transition-all duration-300 hover:shadow-lg bg-card text-card-foreground">
              <CustomCardHeader className="bg-[#00A2EF] text-white h-16 flex items-center justify-between">
                <h2 className="text-lg font-semibold">月間アフィリエイター予約件数</h2>
              </CustomCardHeader>
              <CustomCardContent>
                <div className="text-2xl font-bold">{cumulativeData.monthlyReservations.toLocaleString()}</div>
              </CustomCardContent>
            </CustomCard>
            <CustomCard className="transition-all duration-300 hover:shadow-lg bg-card text-card-foreground">
              <CustomCardHeader className="bg-[#00A2EF] text-white h-16 flex items-center justify-between">
                <h2 className="text-lg font-semibold">月間アフィリエイター売上</h2>
              </CustomCardHeader>
              <CustomCardContent>
                <div className="text-2xl font-bold">{cumulativeData.monthlySales.toLocaleString()}円</div>
              </CustomCardContent>
            </CustomCard>
            <CustomCard className="transition-all duration-300 hover:shadow-lg bg-card text-card-foreground">
              <CustomCardHeader className="bg-[#00A2EF] text-white h-16 flex items-center justify-between">
                <h2 className="text-lg font-semibold">月間アフィリエイター報酬額</h2>
              </CustomCardHeader>
              <CustomCardContent>
                <div className="text-2xl font-bold">{cumulativeData.monthlyPayments.toLocaleString()}円</div>
              </CustomCardContent>
            </CustomCard>
          </div>
        )}
      </main>
    </div>
  )
}
