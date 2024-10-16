// src/app/affiliate-dashboard/page.tsx
'use client'

import { useState, useEffect } from 'react'
import CustomCard, { CustomCardContent, CustomCardHeader } from '@/app/components/ui/CustomCard'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, Copy } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from "@/hooks/use-toast"

type SortKey = 'reservationDate' | 'stayDate' | 'reservationStatus'
type SortOrder = 'asc' | 'desc'

interface AffiliateUser {
  id: number;
  affiliate_code: string;
  coupon_code: string;
  name_kanji: string;
  name_kana: string;
  email: string;
}

interface Reservation {
  reservationDate: string; // created_at
  stayDate: string; // check_in_date
  reservationNumber: string; // reservation_number
  reservationAmount: number; // payment_amount
  rewardAmount: number; // total_amount - payment_amount
  reservationStatus: string; // reservation_status
}

export default function AffiliateDashboardPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>('all')
  const [currentMonth, setCurrentMonth] = useState<string>('')
  const [sortKey, setSortKey] = useState<SortKey>('reservationDate')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [reservationsLoading, setReservationsLoading] = useState<boolean>(true)
  const [reservationsError, setReservationsError] = useState<string | null>(null)
  
  const [affiliateUser, setAffiliateUser] = useState<AffiliateUser | null>(null)
  const [userLoading, setUserLoading] = useState<boolean>(true)
  const [userError, setUserError] = useState<string | null>(null)
  
  const { refreshToken } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    const now = new Date()
    setCurrentMonth(now.toLocaleString('ja-JP', { month: 'long' }))
  }, [])

  const fetchAffiliateUser = async () => {
    try {
      let token = localStorage.getItem('affiliateAuthToken')
      console.log('Sending request with affiliate token:', token)

      if (!token) {
        throw new Error('認証トークンがありません')
      }

      const response = await fetch('/api/auth/affiliate/user', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.status === 401) {
        token = await refreshToken()
        const newResponse = await fetch('/api/auth/affiliate/user', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        if (!newResponse.ok) {
          throw new Error('ユーザー情報の取得に失敗しました')
        }
        const data = await newResponse.json()
        setAffiliateUser(data)
      } else if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'ユーザー情報の取得に失敗しました')
      } else {
        const data = await response.json()
        setAffiliateUser(data)
      }
    } catch (error) {
      setUserError('ユーザー情報の取得に失敗しました。')
      console.error('Error fetching affiliate user:', error)
    } finally {
      setUserLoading(false)
    }
  }

  useEffect(() => {
    fetchAffiliateUser()
  }, [])

  // 予約データの取得
  useEffect(() => {
    const fetchReservations = async () => {
      if (affiliateUser && affiliateUser.coupon_code) {
        try {
          setReservationsLoading(true)
          const token = localStorage.getItem('affiliateAuthToken')
          const response = await fetch('/api/auth/affiliate/reservations', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || '予約データの取得に失敗しました')
          }

          const data: Reservation[] = await response.json()
          setReservations(data)
        } catch (error) {
          setReservationsError('予約データの取得に失敗しました。')
          console.error('Error fetching reservations:', error)
        } finally {
          setReservationsLoading(false)
        }
      }
    }

    fetchReservations()
  }, [affiliateUser])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortOrder('asc')
    }

    const sortedReservations = [...reservations].sort((a, b) => {
      if (a[key] < b[key]) return sortOrder === 'asc' ? -1 : 1
      if (a[key] > b[key]) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    setReservations(sortedReservations)
  }

  const totalRewards = 11675
  const yearlyRewards = 11675
  const monthlyRewards: { [key: string]: number } = {
    all: 1250000,
    '1': 100000,
    '2': 120000,
    '3': 150000,
    '4': 180000,
    '5': 200000,
    '6': 220000,
    '7': 5500,
    '8': 6175,
    '9': 280000,
    '10': 300000,
    '11': 320000,
    '12': 340000,
  }

  const currentMonthExpectedReward = 6300

  const copyToClipboard = () => {
    if (affiliateUser) {
      navigator.clipboard.writeText(affiliateUser.coupon_code).then(() => {
        toast({
          title: "コピーしました",
          description: "クーポンコードがクリップボードにコピーされました。",
        })
      }, (err) => {
        console.error('Could not copy text: ', err)
        toast({
          title: "コピーに失敗しました",
          description: "クーポンコードのコピーに失敗しました。",
          variant: "destructive",
        })
      })
    }
  }

  // reservation_status のマッピング関数
  const mapReservationStatus = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
      case 'confirmed':
        return 'チェックイン待ち'
      case 'cancelled':
      case 'customer_cancelled':
        return 'キャンセル'
      case 'paid':
        return '報酬支払済み'
      case 'processing':
        return '報酬支払い待ち'
      default:
        return '不明'
    }
  }

  return (
    <div className="bg-background text-foreground">
      <main className="container mx-auto px-3 py-8 sm:px-4 sm:py-12 max-w-6xl">
        {/* ヘッダー部分 */}
        <div className="flex flex-col md:flex-row justify-between items-start mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-4 md:mb-0">アフィリエイターダッシュボード</h1>
          <div className="w-full md:w-auto">
            {userLoading ? (
              <p>読み込み中...</p>
            ) : userError ? (
              <p className="text-red-500">{userError}</p>
            ) : affiliateUser ? (
              <div className="bg-gray-100 p-4 rounded-lg">
                <p className="mb-2"><strong>名前:</strong> {affiliateUser.name_kanji} ({affiliateUser.name_kana})</p>
                <p className="mb-2"><strong>メール:</strong> {affiliateUser.email}</p>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">クーポンコード:</span>
                  <code className="bg-white px-2 py-1 rounded">{affiliateUser.coupon_code}</code>
                  <Button onClick={copyToClipboard}>
                    <Copy className="h-4 w-4 mr-2" />
                    コピー
                  </Button>
                </div>
              </div>
            ) : (
              <p>ユーザー情報がありません。</p>
            )}
          </div>
        </div>

        {/* 報酬額のカード */}
        <div className="grid gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
          <CustomCard className="transition-all duration-300 hover:shadow-lg bg-card text-card-foreground">
            <CustomCardHeader className="bg-[#00A2EF] text-white h-16 flex items-center justify-between">
              <h2 className="text-lg font-semibold">総報酬額</h2>
            </CustomCardHeader>
            <CustomCardContent>
              <div className="text-3xl font-bold">{totalRewards.toLocaleString()}円</div>
            </CustomCardContent>
          </CustomCard>
          <CustomCard className="transition-all duration-300 hover:shadow-lg bg-card text-card-foreground">
            <CustomCardHeader className="bg-[#00A2EF] text-white h-16 flex items-center justify-between">
              <h2 className="text-lg font-semibold">年間報酬額</h2>
            </CustomCardHeader>
            <CustomCardContent>
              <div className="text-3xl font-bold">{yearlyRewards.toLocaleString()}円</div>
            </CustomCardContent>
          </CustomCard>
          <CustomCard className="transition-all duration-300 hover:shadow-lg bg-card text-card-foreground">
            <CustomCardHeader className="bg-[#00A2EF] text-white h-16 flex items-center justify-between">
              <h2 className="text-lg font-semibold">月別報酬額</h2>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-24 bg-white text-[#00A2EF] border-white">
                  <SelectValue placeholder="月を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全期間</SelectItem>
                  {Object.keys(monthlyRewards).filter(key => key !== 'all').map((month) => (
                    <SelectItem key={month} value={month}>{`${month}月`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CustomCardHeader>
            <CustomCardContent>
              <div className="text-3xl font-bold">
                {monthlyRewards[selectedMonth].toLocaleString()}円
              </div>
            </CustomCardContent>
          </CustomCard>
          <CustomCard className="transition-all duration-300 hover:shadow-lg bg-card text-card-foreground">
            <CustomCardHeader className="bg-[#00A2EF] text-white h-16 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{`${currentMonth}報酬予定額`}</h2>
            </CustomCardHeader>
            <CustomCardContent>
              <div className="text-3xl font-bold">{currentMonthExpectedReward.toLocaleString()}円</div>
            </CustomCardContent>
          </CustomCard>
        </div>

        {/* 予約一覧のテーブル */}
        <CustomCard className="mt-8 transition-all duration-300 hover:shadow-lg bg-card text-card-foreground">
          <CustomCardHeader className="bg-secondary text-secondary-foreground h-16 flex items-center justify-between">
            <h2 className="text-xl font-bold">予約一覧</h2>
          </CustomCardHeader>
          <CustomCardContent>
            <div className="overflow-x-auto">
              {reservationsLoading ? (
                <p>予約データを読み込み中...</p>
              ) : reservationsError ? (
                <p className="text-red-500">{reservationsError}</p>
              ) : reservations.length === 0 ? (
                <p>予約がありません。</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="bg-muted cursor-pointer" onClick={() => handleSort('reservationDate')}>
                        予約日 <ArrowUpDown className="inline ml-2" />
                      </TableHead>
                      <TableHead className="bg-muted cursor-pointer" onClick={() => handleSort('stayDate')}>
                        宿泊日 <ArrowUpDown className="inline ml-2" />
                      </TableHead>
                      <TableHead className="bg-muted">予約番号</TableHead>
                      <TableHead className="bg-muted">予約金額</TableHead>
                      <TableHead className="bg-muted">報酬額</TableHead>
                      <TableHead className="bg-muted cursor-pointer" onClick={() => handleSort('reservationStatus')}>
                        ステータス <ArrowUpDown className="inline ml-2" />
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reservations.map((reservation) => (
                      <TableRow key={reservation.reservationNumber} className="hover:bg-muted/50 transition-colors duration-200">
                        <TableCell>{new Date(reservation.reservationDate).toLocaleDateString('ja-JP')}</TableCell>
                        <TableCell>{new Date(reservation.stayDate).toLocaleDateString('ja-JP')}</TableCell>
                        <TableCell>{reservation.reservationNumber}</TableCell>
                        <TableCell>{reservation.reservationAmount.toLocaleString()}円</TableCell>
                        <TableCell>{reservation.rewardAmount.toLocaleString()}円</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            reservationStatusMap[reservation.reservationStatus.toLowerCase()]?.color || 'bg-gray-100 text-gray-800'
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
          </CustomCardContent>
        </CustomCard>
      </main>
    </div>
  )
}

// reservation_status のマッピング
const reservationStatusMap: { [key: string]: { label: string, color: string } } = {
  'pending': { label: 'チェックイン待ち', color: 'bg-yellow-100 text-yellow-800' },
  'confirmed': { label: 'チェックイン待ち', color: 'bg-yellow-100 text-yellow-800' },
  'cancelled': { label: 'キャンセル', color: 'bg-red-100 text-red-800' },
  'customer_cancelled': { label: 'キャンセル', color: 'bg-red-100 text-red-800' },
  'paid': { label: '報酬支払済み', color: 'bg-green-100 text-green-800' },
  'processing': { label: '報酬支払い待ち', color: 'bg-blue-100 text-blue-800' },
}
