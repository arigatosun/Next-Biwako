// src/app/affiliate-dashboard/page.tsx
'use client'

import { useState, useEffect, ChangeEvent, FormEvent } from 'react'
import CustomCard, { CustomCardContent, CustomCardHeader } from '@/app/components/ui/CustomCard'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, Copy, LogOut } from 'lucide-react' // LogOut アイコンを追加
import { useAuth } from '@/hooks/useAuth'
import { useToast } from "@/hooks/use-toast"

// モーダルコンポーネントをインポート
import Modal from '@/app/components/ui/Modal'

type SortKey = 'reservationDate' | 'stayDate' | 'reservationStatus'
type SortOrder = 'asc' | 'desc'

interface AffiliateUser {
  id: number;
  affiliate_code: string;
  coupon_code: string;
  name_kanji: string;
  name_kana: string;
  email: string;
  phone: string;
  bank_name: string;
  branch_name: string;
  account_number: string;
  account_holder_name: string;
  account_type: string;
  promotion_mediums: string[];
  promotion_urls: string[];
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
  const [currentMonthName, setCurrentMonthName] = useState<string>('')
  const [sortKey, setSortKey] = useState<SortKey>('reservationDate')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [reservationsLoading, setReservationsLoading] = useState<boolean>(true)
  const [reservationsError, setReservationsError] = useState<string | null>(null)

  const [totalRewards, setTotalRewards] = useState<number>(0)
  const [yearlyRewards, setYearlyRewards] = useState<number>(0)
  const [monthlyRewards, setMonthlyRewards] = useState<{ [key: string]: number }>({})
  const [currentMonthExpectedReward, setCurrentMonthExpectedReward] = useState<number>(0)

  const [affiliateUser, setAffiliateUser] = useState<AffiliateUser | null>(null)
  const [userLoading, setUserLoading] = useState<boolean>(true)
  const [userError, setUserError] = useState<string | null>(null)

  // モーダルの表示状態を管理
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)

  // フォーム用のステート
  const [formData, setFormData] = useState<Partial<AffiliateUser>>({
    promotion_mediums: [],
    promotion_urls: []
  })

  const { refreshToken, logout } = useAuth() // logout を取得
  const { toast } = useToast()

  useEffect(() => {
    const now = new Date()
    const nowJST = new Date(now.getTime() + (9 * 60 * 60 * 1000))
    setCurrentMonthName(nowJST.toLocaleString('ja-JP', { month: 'long' }))
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

  // 報酬額の計算
  useEffect(() => {
    if (reservations.length > 0) {
      calculateRewards()
    }
  }, [reservations, selectedMonth])

  const calculateRewards = () => {
    let total = 0
    let yearlyTotal = 0
    const monthlyTotals: { [key: string]: number } = {}
    let currentMonthReward = 0

    const now = new Date()
    const nowJST = new Date(now.getTime() + (9 * 60 * 60 * 1000))
    const currentYear = nowJST.getFullYear()
    const currentMonth = nowJST.getMonth() + 1

    for (const reservation of reservations) {
      if (reservation.reservationStatus === 'cancelled' || reservation.reservationStatus === 'customer_cancelled') {
        continue
      }

      const rewardAmount = reservation.rewardAmount

      total += rewardAmount

      const stayDateStr = reservation.stayDate // 'YYYY-MM-DD'
      const [stayYearStr, stayMonthStr] = stayDateStr.split('-')
      const stayYear = parseInt(stayYearStr)
      const stayMonth = parseInt(stayMonthStr)

      if (stayYear === currentYear) {
        yearlyTotal += rewardAmount
      }

      // 宿泊月の翌月をキーとして使用
      const rewardMonth = stayMonth === 12 ? 1 : stayMonth + 1
      const monthKey = String(rewardMonth)
      if (monthlyTotals[monthKey]) {
        monthlyTotals[monthKey] += rewardAmount
      } else {
        monthlyTotals[monthKey] = rewardAmount
      }

      // 現在の月の報酬予定額の計算（現在の月の前月の宿泊に対する報酬）
      if (stayYear === currentYear && stayMonth === currentMonth - 1) {
        currentMonthReward += rewardAmount
      }
    }

    setTotalRewards(total)
    setYearlyRewards(yearlyTotal)
    setMonthlyRewards(monthlyTotals)
    setCurrentMonthExpectedReward(currentMonthReward)
  }

  const handleSort = (key: SortKey) => {
    let newSortOrder: SortOrder = 'asc'
    if (sortKey === key) {
      newSortOrder = sortOrder === 'asc' ? 'desc' : 'asc'
    }
    setSortKey(key)
    setSortOrder(newSortOrder)

    const sortedReservations = [...reservations].sort((a, b) => {
      let aValue = a[key]
      let bValue = b[key]

      if (key === 'reservationDate' || key === 'stayDate') {
        aValue = new Date(aValue).toISOString() // Convert to string
        bValue = new Date(bValue).toISOString() // Convert to string
      }

      if (aValue < bValue) return newSortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return newSortOrder === 'asc' ? 1 : -1
      return 0
    })

    setReservations(sortedReservations)
  }

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

  // モーダルを開く関数
  const openModal = () => {
    if (affiliateUser) {
      setFormData({
        name_kanji: affiliateUser.name_kanji,
        name_kana: affiliateUser.name_kana,
        email: affiliateUser.email,
        phone: affiliateUser.phone,
        bank_name: affiliateUser.bank_name,
        branch_name: affiliateUser.branch_name,
        account_number: affiliateUser.account_number,
        account_holder_name: affiliateUser.account_holder_name,
        account_type: affiliateUser.account_type,
        promotion_mediums: affiliateUser.promotion_mediums,
        promotion_urls: affiliateUser.promotion_urls,
      })
    }
    setIsModalOpen(true)
  }

  // モーダルを閉じる関数
  const closeModal = () => {
    setIsModalOpen(false)
  }

  // フォームの入力変更をハンドル
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // promotion_mediumsの追加
  const addPromotionMedium = () => {
    setFormData(prev => ({
      ...prev,
      promotion_mediums: prev.promotion_mediums ? [...prev.promotion_mediums, ''] : ['']
    }))
  }

  // promotion_mediumsの変更
  const handlePromotionMediumChange = (index: number, value: string) => {
    setFormData(prev => {
      if (!prev.promotion_mediums) return prev
      const newPromotionMediums = [...prev.promotion_mediums]
      newPromotionMediums[index] = value
      return { ...prev, promotion_mediums: newPromotionMediums }
    })
  }

  // promotion_mediumsの削除
  const removePromotionMedium = (index: number) => {
    setFormData(prev => {
      if (!prev.promotion_mediums) return prev
      const newPromotionMediums = [...prev.promotion_mediums]
      newPromotionMediums.splice(index, 1)
      return { ...prev, promotion_mediums: newPromotionMediums }
    })
  }

  // promotion_urlsの追加
  const addPromotionUrl = () => {
    setFormData(prev => ({
      ...prev,
      promotion_urls: prev.promotion_urls ? [...prev.promotion_urls, ''] : ['']
    }))
  }

  // promotion_urlsの変更
  const handlePromotionUrlChange = (index: number, value: string) => {
    setFormData(prev => {
      if (!prev.promotion_urls) return prev
      const newPromotionUrls = [...prev.promotion_urls]
      newPromotionUrls[index] = value
      return { ...prev, promotion_urls: newPromotionUrls }
    })
  }

  // promotion_urlsの削除
  const removePromotionUrl = (index: number) => {
    setFormData(prev => {
      if (!prev.promotion_urls) return prev
      const newPromotionUrls = [...prev.promotion_urls]
      newPromotionUrls.splice(index, 1)
      return { ...prev, promotion_urls: newPromotionUrls }
    })
  }

  // フォームの送信をハンドル
  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!affiliateUser) return

    try {
      const token = localStorage.getItem('affiliateAuthToken')
      const response = await fetch('/api/auth/affiliate/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'アカウント情報の更新に失敗しました')
      }

      const updatedData = await response.json()
      setAffiliateUser(updatedData)
      toast({
        title: "更新成功",
        description: "アカウント情報が正常に更新されました。",
      })
      closeModal()
    } catch (error) {
      console.error('Error updating account information:', error)
      toast({
        title: "更新失敗",
        description: "アカウント情報の更新に失敗しました。",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="bg-background text-foreground">
      <main className="container mx-auto px-3 py-8 sm:px-4 sm:py-12 max-w-6xl">
        {/* ヘッダー部分 */}
        <div className="flex flex-col md:flex-row justify-between items-start mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-4 md:mb-0">アフィリエイターダッシュボード</h1>
          <div className="w-full md:w-auto flex items-center space-x-4"> {/* 横並びにするため flex を追加 */}
            {userLoading ? (
              <p>読み込み中...</p>
            ) : userError ? (
              <p className="text-red-500">{userError}</p>
            ) : affiliateUser ? (
              <div className="bg-gray-100 p-4 rounded-lg flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-4">
                <div>
                  <p className="mb-2"><strong>名前:</strong> {affiliateUser.name_kanji} ({affiliateUser.name_kana})</p>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">クーポンコード:</span>
                    <code className="bg-white px-2 py-1 rounded">{affiliateUser.coupon_code}</code>
                    <Button onClick={copyToClipboard}>
                      <Copy className="h-4 w-4 mr-2" />
                      コピー
                    </Button>
                  </div>
                </div>
                {/* アカウント情報ボタンとログアウトボタンを横並びに */}
                <div className="flex space-x-2">
                  <Button onClick={openModal} variant="secondary">
                    アカウント情報
                  </Button>
                  <Button onClick={() => logout('/affiliate/login')} variant="destructive" className="flex items-center">
                    <LogOut className="h-4 w-4 mr-2" />
                    ログアウト
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
          {/* 総報酬額 */}
          <CustomCard className="transition-all duration-300 hover:shadow-lg bg-card text-card-foreground">
            <CustomCardHeader className="bg-[#00A2EF] text-white h-16 flex items-center justify-between">
              <h2 className="text-lg font-semibold">総報酬額</h2>
            </CustomCardHeader>
            <CustomCardContent>
              <div className="text-3xl font-bold">{totalRewards.toLocaleString()}円</div>
            </CustomCardContent>
          </CustomCard>
          {/* 年間報酬額 */}
          <CustomCard className="transition-all duration-300 hover:shadow-lg bg-card text-card-foreground">
            <CustomCardHeader className="bg-[#00A2EF] text-white h-16 flex items-center justify-between">
              <h2 className="text-lg font-semibold">年間報酬額</h2>
            </CustomCardHeader>
            <CustomCardContent>
              <div className="text-3xl font-bold">{yearlyRewards.toLocaleString()}円</div>
            </CustomCardContent>
          </CustomCard>
          {/* 月別報酬額のカード */}
          <CustomCard className="transition-all duration-300 hover:shadow-lg bg-card text-card-foreground">
            <CustomCardHeader className="bg-[#00A2EF] text-white h-16 flex items-center justify-between">
              <h2 className="text-lg font-semibold">月別報酬額</h2>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-24 bg-white text-[#00A2EF] border-white">
                  <SelectValue placeholder="月を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全期間</SelectItem>
                  {[...Array(12)].map((_, index) => {
                    const month = index + 1
                    return (
                      <SelectItem key={month} value={String(month)}>{`${month}月`}</SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </CustomCardHeader>
            <CustomCardContent>
              <div className="text-3xl font-bold">
                {(selectedMonth === 'all' ? totalRewards : (monthlyRewards[selectedMonth] || 0)).toLocaleString()}円
              </div>
            </CustomCardContent>
          </CustomCard>
          {/* 〇月報酬予定額 */}
          <CustomCard className="transition-all duration-300 hover:shadow-lg bg-card text-card-foreground">
            <CustomCardHeader className="bg-[#00A2EF] text-white h-16 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{`${currentMonthName}報酬予定額`}</h2>
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

        {/* アカウント情報モーダル */}
        {isModalOpen && affiliateUser && (
          <Modal onClose={closeModal}>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <h2 className="text-xl font-semibold">アカウント情報</h2>
              <div>
                <label className="block text-sm font-medium">名前（漢字）</label>
                <input
                  type="text"
                  name="name_kanji"
                  value={formData.name_kanji || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">名前（カナ）</label>
                <input
                  type="text"
                  name="name_kana"
                  value={formData.name_kana || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">メール</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">電話番号</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">銀行名</label>
                <input
                  type="text"
                  name="bank_name"
                  value={formData.bank_name || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">支店名</label>
                <input
                  type="text"
                  name="branch_name"
                  value={formData.branch_name || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">口座番号</label>
                <input
                  type="text"
                  name="account_number"
                  value={formData.account_number || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">口座名義</label>
                <input
                  type="text"
                  name="account_holder_name"
                  value={formData.account_holder_name || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">口座タイプ</label>
                <input
                  type="text"
                  name="account_type"
                  value={formData.account_type || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  required
                />
              </div>
              {/* Promotion Mediums の追加 */}
              <div>
                <label className="block text-sm font-medium">Promotion Mediums</label>
                {formData.promotion_mediums && formData.promotion_mediums.map((medium, index) => (
                  <div key={index} className="flex items-center mt-1">
                    <input
                      type="text"
                      name={`promotion_mediums_${index}`}
                      value={medium}
                      onChange={(e) => handlePromotionMediumChange(index, e.target.value)}
                      className="flex-1 border border-gray-300 rounded-md p-2"
                      required
                    />
                    <Button type="button" onClick={() => removePromotionMedium(index)} className="ml-2">
                      削除
                    </Button>
                  </div>
                ))}
                <Button type="button" onClick={addPromotionMedium} className="mt-2">
                  Medium追加
                </Button>
              </div>
              {/* Promotion URLs の追加 */}
              <div>
                <label className="block text-sm font-medium">Promotion URLs</label>
                {formData.promotion_urls && formData.promotion_urls.map((url, index) => (
                  <div key={index} className="flex items-center mt-1">
                    <input
                      type="url"
                      name={`promotion_urls_${index}`}
                      value={url}
                      onChange={(e) => handlePromotionUrlChange(index, e.target.value)}
                      className="flex-1 border border-gray-300 rounded-md p-2"
                      required
                    />
                    <Button type="button" onClick={() => removePromotionUrl(index)} className="ml-2">
                      削除
                    </Button>
                  </div>
                ))}
                <Button type="button" onClick={addPromotionUrl} className="mt-2">
                  URL追加
                </Button>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="ghost" onClick={closeModal}>
                  キャンセル
                </Button>
                <Button type="submit">
                  更新
                </Button>
              </div>
            </form>
          </Modal>
        )}
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
