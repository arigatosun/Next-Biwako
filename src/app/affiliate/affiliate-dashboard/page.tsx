// affiliate-dashboard/page.tsx
'use client'

import { useState, useEffect, ChangeEvent, FormEvent } from 'react'
import { motion } from 'framer-motion'
import CustomCard, { CustomCardContent, CustomCardHeader } from '@/app/components/ui/CustomCard'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { ArrowUpDown, Copy, LogOut, Settings, Plus, Trash2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import Modal from '@/app/components/ui/Modal'
import Image from 'next/image'
import Link from 'next/link'
import Script from 'next/script';



type SortKey = 'reservationDate' | 'stayDate' | 'reservationStatus' | 'rewardAmount'
type SortOrder = 'asc' | 'desc'

interface AffiliateUser {
  id: number
  affiliate_code: string
  coupon_code: string
  name_kanji: string
  name_kana: string
  email: string
  phone: string
  bank_name: string
  branch_name: string
  account_number: string
  account_holder_name: string
  account_type: string
  promotion_mediums: string[]
  promotion_info: string[]
}

interface Reservation {
  reservationDate: string
  stayDate: string
  reservationNumber: string
  reservationAmount: number
  rewardAmount: number
  reservationStatus: string
}

export default function AffiliateDashboardPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>('all')
  const [selectedYear, setSelectedYear] = useState<string>('all')
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
  const [availableYears, setAvailableYears] = useState<number[]>([])

  const [affiliateUser, setAffiliateUser] = useState<AffiliateUser | null>(null)
  const [userLoading, setUserLoading] = useState<boolean>(true)
  const [userError, setUserError] = useState<string | null>(null)

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)

  const [formData, setFormData] = useState<Partial<AffiliateUser>>({
    promotion_mediums: [],
    promotion_info: [],
  })

  const { refreshToken, logout } = useAuth()
  const { toast } = useToast()

  const [isCopying, setIsCopying] = useState(false)

  // ページネーション用のステート
  const [currentPage, setCurrentPage] = useState<number>(1)
  const reservationsPerPage = 10

  useEffect(() => {
    const now = new Date()
    const nowJST = new Date(now.getTime() + 9 * 60 * 60 * 1000)
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
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.status === 401) {
        token = await refreshToken()
        const newResponse = await fetch('/api/auth/affiliate/user', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
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

  useEffect(() => {
    const fetchReservations = async () => {
      if (affiliateUser && affiliateUser.coupon_code) {
        try {
          setReservationsLoading(true)
          const token = localStorage.getItem('affiliateAuthToken')
          const response = await fetch('/api/auth/affiliate/reservations', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || '予約データの取得に失敗しました')
          }

          const data: Reservation[] = await response.json()
          setReservations(data)

          // 利用可能な年を設定
          const years = Array.from(
            new Set(
              data.map((reservation) => {
                const stayDate = new Date(reservation.stayDate)
                return stayDate.getFullYear()
              })
            )
          )
          setAvailableYears(years)
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

  useEffect(() => {
    if (reservations.length > 0) {
      calculateRewards()
      // ページを1にリセット
      setCurrentPage(1)
    }
  }, [reservations])

  const calculateRewards = () => {
    // 'paid' または 'processing' の予約のみを対象
    const rewardReservations = reservations.filter(
      (reservation) =>
        reservation.reservationStatus === 'paid' || reservation.reservationStatus === 'processing'
    )

    let total = 0
    let yearlyTotal = 0
    const monthlyTotals: { [key: string]: number } = {}
    let currentMonthReward = 0

    const now = new Date()
    const nowJST = new Date(now.getTime() + 9 * 60 * 60 * 1000)
    const currentYear = nowJST.getFullYear()
    const currentMonth = nowJST.getMonth() + 1

    const targetYear = selectedYear === 'all' ? null : parseInt(selectedYear)
    const targetMonth = selectedMonth === 'all' ? null : parseInt(selectedMonth)

    for (const reservation of rewardReservations) {
      const rewardAmount = reservation.rewardAmount

      total += rewardAmount

      const stayDateStr = reservation.stayDate // 'YYYY-MM-DD'
      const [stayYearStr, stayMonthStr] = stayDateStr.split('-')
      const stayYear = parseInt(stayYearStr)
      const stayMonth = parseInt(stayMonthStr)

      // 年間報酬額の計算
      if (targetYear === null || stayYear === targetYear) {
        yearlyTotal += rewardAmount
      }

      // 月別報酬額の計算
      const rewardMonth = stayMonth === 12 ? 1 : stayMonth + 1
      const monthKey = String(rewardMonth)

      if (targetYear === null || stayYear === targetYear) {
        if (monthlyTotals[monthKey]) {
          monthlyTotals[monthKey] += rewardAmount
        } else {
          monthlyTotals[monthKey] = rewardAmount
        }
      }

      // 今月の報酬予定額の計算
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

    setReservations(sortedReservations)
    // ページを1にリセット
    setCurrentPage(1)
  }

  const copyToClipboard = () => {
    if (affiliateUser) {
      navigator.clipboard.writeText(affiliateUser.coupon_code).then(
        () => {
          setIsCopying(true)
          toast({
            title: 'コピーしました',
            description: 'クーポンコードがクリップボードにコピーされました。',
          })
          setTimeout(() => setIsCopying(false), 500)
        },
        (err) => {
          console.error('Could not copy text: ', err)
          toast({
            title: 'コピーに失敗しました',
            description: 'クーポンコードのコピーに失敗しました。',
            variant: 'destructive',
          })
        }
      )
    }
  }

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
        promotion_info: affiliateUser.promotion_info,
      })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const addPromotionMedium = () => {
    setFormData((prev) => ({
      ...prev,
      promotion_mediums: prev.promotion_mediums ? [...prev.promotion_mediums, ''] : [''],
      promotion_info: prev.promotion_info ? [...prev.promotion_info, ''] : [''],
    }))
  }

  const handlePromotionMediumChange = (index: number, value: string) => {
    setFormData((prev) => {
      if (!prev.promotion_mediums) return prev
      const newPromotionMediums = [...prev.promotion_mediums]
      newPromotionMediums[index] = value
      return { ...prev, promotion_mediums: newPromotionMediums }
    })
  }

  const removePromotionMedium = (index: number) => {
    setFormData((prev) => {
      if (!prev.promotion_mediums || !prev.promotion_info) return prev
      const newPromotionMediums = [...prev.promotion_mediums]
      const newPromotionInfo = [...prev.promotion_info]
      newPromotionMediums.splice(index, 1)
      newPromotionInfo.splice(index, 1)
      return { ...prev, promotion_mediums: newPromotionMediums, promotion_info: newPromotionInfo }
    })
  }

  const handlePromotionUrlChange = (index: number, value: string) => {
    setFormData((prev) => {
      if (!prev.promotion_info) return prev
      const newPromotionInfo = [...prev.promotion_info]
      newPromotionInfo[index] = value
      return { ...prev, promotion_info: newPromotionInfo }
    })
  }

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!affiliateUser) return

    try {
      const token = localStorage.getItem('affiliateAuthToken')
      const response = await fetch('/api/auth/affiliate/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'アカウント情報の更新に失敗しました')
      }

      const updatedData = await response.json()
      setAffiliateUser(updatedData)
      toast({
        title: '更新成功',
        description: 'アカウント情報が正常に更新されました。',
      })
      closeModal()
    } catch (error) {
      console.error('Error updating account information:', error)
      toast({
        title: '更新失敗',
        description: 'アカウント情報の更新に失敗しました。',
        variant: 'destructive',
      })
    }
  }

  // ページネーション用の計算
  const indexOfLastReservation = currentPage * reservationsPerPage
  const indexOfFirstReservation = indexOfLastReservation - reservationsPerPage
  const paginatedReservations = reservations.slice(indexOfFirstReservation, indexOfLastReservation)
  const totalPages = Math.ceil(reservations.length / reservationsPerPage)

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber)
  }

  useEffect(() => {
    // LINEボタンの初期化
    if (typeof window !== 'undefined' && window.LineIt) {
      window.LineIt.loadButton();
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* ヘッダー */}
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div>
              <motion.h1
                className="text-2xl sm:text-3xl font-bold text-primary"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                NEST琵琶湖
              </motion.h1>
              <motion.h2
                className="text-lg sm:text-xl font-semibold text-secondary-foreground mt-1 sm:mt-2"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                アフィリエイターダッシュボード
              </motion.h2>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="w-full sm:w-auto"
            >
              {userLoading ? (
                <p className="text-gray-500">読み込み中...</p>
              ) : userError ? (
                <p className="text-red-500">{userError}</p>
              ) : affiliateUser ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                    <p className="font-semibold text-base text-gray-800">{affiliateUser.name_kanji}</p>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-600 text-sm sm:text-base">クーポンコード:</span>
                      <code className="bg-gray-100 px-2 py-1 rounded text-primary font-mono text-sm sm:text-base">
                        {affiliateUser.coupon_code}
                      </code>
                      <motion.div animate={{ scale: isCopying ? 0.95 : 1 }} transition={{ duration: 0.2 }}>
                        <Button onClick={copyToClipboard} variant="outline" size="sm" className="flex items-center">
                          <Copy className="h-4 w-4 mr-1" />
                          コピー
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                  <div className="flex space-x-2 w-full sm:w-auto">
                    <Button
                      onClick={openModal}
                      variant="outline"
                      className="flex items-center text-sm sm:text-base flex-grow sm:flex-grow-0"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      アカウント情報
                    </Button>
                    <Button
                      onClick={() => logout('/affiliate/login')}
                      variant="destructive"
                      className="flex items-center text-sm sm:text-base flex-grow sm:flex-grow-0"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      ログアウト
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">ユーザー情報がありません。</p>
              )}
            </motion.div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-auto">
        {/* ダッシュボードのカード */}
        <motion.div
          className="grid gap-4 sm:gap-6 mb-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {/* 総報酬額 */}
          <CustomCard className="bg-white shadow-md rounded-lg overflow-hidden">
            <CustomCardHeader className="bg-primary text-primary-foreground p-4 flex justify-between items-center h-[72px]">
              <h2 className="text-lg font-semibold">総報酬額</h2>
              <div className="w-24 invisible">
                <Select disabled>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </Select>
              </div>
            </CustomCardHeader>
            <CustomCardContent className="p-4">
              <div className="text-2xl sm:text-3xl font-bold text-gray-800">
                {totalRewards.toLocaleString()}円
              </div>
            </CustomCardContent>
          </CustomCard>

          {/* 年間報酬額 */}
          <CustomCard className="bg-white shadow-md rounded-lg overflow-hidden">
            <CustomCardHeader className="bg-primary text-primary-foreground p-4 flex justify-between items-center h-[72px]">
              <h2 className="text-lg font-semibold">年間報酬額</h2>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-24 bg-primary-foreground text-primary border-primary-foreground">
                  <SelectValue placeholder="年を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全期間</SelectItem>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {`${year}年`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CustomCardHeader>
            <CustomCardContent className="p-4">
              <div className="text-2xl sm:text-3xl font-bold text-gray-800">
                {yearlyRewards.toLocaleString()}円
              </div>
            </CustomCardContent>
          </CustomCard>

          {/* 月別報酬額 */}
          <CustomCard className="bg-white shadow-md rounded-lg overflow-hidden">
            <CustomCardHeader className="bg-primary text-primary-foreground p-4 flex justify-between items-center h-[72px]">
              <h2 className="text-lg font-semibold">月別報酬額</h2>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-24 bg-primary-foreground text-primary border-primary-foreground">
                  <SelectValue placeholder="月を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全期間</SelectItem>
                  {[...Array(12)].map((_, index) => {
                    const month = index + 1
                    return (
                      <SelectItem key={month} value={String(month)}>
                        {`${month}月`}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </CustomCardHeader>
            <CustomCardContent className="p-4">
              <div className="text-2xl sm:text-3xl font-bold text-gray-800">
                {(
                  selectedMonth === 'all'
                    ? selectedYear === 'all'
                      ? totalRewards
                      : yearlyRewards
                    : monthlyRewards[selectedMonth] || 0
                ).toLocaleString()}
                円
              </div>
            </CustomCardContent>
          </CustomCard>

          {/* 今月の報酬予定額 */}
          <CustomCard className="bg-white shadow-md rounded-lg overflow-hidden">
            <CustomCardHeader className="bg-primary text-primary-foreground p-4 flex justify-between items-center h-[72px]">
              <h2 className="text-lg font-semibold">{`${currentMonthName}報酬予定額`}</h2>
              <div className="w-24 invisible">
                <Select disabled>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </Select>
              </div>
            </CustomCardHeader>
            <CustomCardContent className="p-4">
              <div className="text-2xl sm:text-3xl font-bold text-gray-800">
                {currentMonthExpectedReward.toLocaleString()}円
              </div>
            </CustomCardContent>
          </CustomCard>
        </motion.div>

        {/* 予約一覧 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <CustomCard className="bg-white shadow-lg rounded-lg overflow-hidden">
            <CustomCardHeader className="bg-secondary text-secondary-foreground p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <h2 className="text-xl font-bold mb-2 sm:mb-0">クーポン使用者予約一覧</h2>
              <p className="text-sm">報酬は月末締め翌月払いになります。</p>
            </CustomCardHeader>
            <CustomCardContent className="p-4">
              <div className="overflow-x-auto">
                {reservationsLoading ? (
                  <p className="text-center text-gray-500">予約データを読み込み中...</p>
                ) : reservationsError ? (
                  <p className="text-center text-red-500">{reservationsError}</p>
                ) : reservations.length === 0 ? (
                  <p className="text-center text-gray-500">予約がありません。</p>
                ) : (
                  <>
                    <div className="mb-4 sm:hidden">
                      <Select value={sortKey} onValueChange={(value) => handleSort(value as SortKey)}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="並び替え" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="reservationDate">予約日</SelectItem>
                          <SelectItem value="stayDate">宿泊日</SelectItem>
                          <SelectItem value="rewardAmount">報酬額</SelectItem>
                          <SelectItem value="reservationStatus">ステータス</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="hidden sm:block">
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
                          {paginatedReservations.map((reservation) => (
                            <TableRow key={reservation.reservationNumber}>
                              <TableCell>
                                {new Date(reservation.reservationDate).toLocaleDateString('ja-JP')}
                              </TableCell>
                              <TableCell>
                                {new Date(reservation.stayDate).toLocaleDateString('ja-JP')}
                              </TableCell>
                              <TableCell>{reservation.reservationNumber}</TableCell>
                              <TableCell>{reservation.reservationAmount.toLocaleString()}円</TableCell>
                              <TableCell>{reservation.rewardAmount.toLocaleString()}円</TableCell>
                              <TableCell>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs ${
                                    reservationStatusMap[reservation.reservationStatus.toLowerCase()]?.color ||
                                    'bg-secondary text-secondary-foreground'
                                  }`}
                                >
                                  {reservationStatusMap[reservation.reservationStatus.toLowerCase()]?.label || '不明'}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {/* ページネーション */}
                    <div className="flex justify-center mt-4">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                        <Button
                          key={pageNumber}
                          variant={currentPage === pageNumber ? 'default' : 'outline'}
                          className="mx-1"
                          onClick={() => handlePageChange(pageNumber)}
                        >
                          {pageNumber}
                        </Button>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 sm:hidden gap-4">
                      {paginatedReservations.map((reservation) => (
                        <CustomCard
                          key={reservation.reservationNumber}
                          className="bg-white shadow-sm rounded-lg overflow-hidden"
                        >
                          <CustomCardContent className="p-4 grid grid-cols-2 gap-2">
                            <div>
                              <p className="text-sm font-medium text-gray-500">予約日</p>
                              <p className="text-base font-semibold">
                                {new Date(reservation.reservationDate).toLocaleDateString('ja-JP')}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">宿泊日</p>
                              <p className="text-base font-semibold">
                                {new Date(reservation.stayDate).toLocaleDateString('ja-JP')}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">報酬額</p>
                              <p className="text-base font-semibold">{reservation.rewardAmount.toLocaleString()}円</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">ステータス</p>
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${
                                  reservationStatusMap[reservation.reservationStatus.toLowerCase()]?.color ||
                                  'bg-secondary text-secondary-foreground'
                                }`}
                              >
                                {reservationStatusMap[reservation.reservationStatus.toLowerCase()]?.label || '不明'}
                              </span>
                            </div>
                          </CustomCardContent>
                        </CustomCard>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </CustomCardContent>
          </CustomCard>
        </motion.div>

        {/* モーダルウィンドウ */}
{isModalOpen && affiliateUser && (
  <Modal onClose={closeModal}>
    <div className="max-h-[80vh] overflow-y-auto">
      <form onSubmit={handleFormSubmit} className="space-y-6">
        <h2 className="text-2xl font-semibold mb-6">アカウント情報</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">名前（漢字）</label>
            <input
              type="text"
              name="name_kanji"
              value={formData.name_kanji || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary focus:border-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">名前（カナ）</label>
            <input
              type="text"
              name="name_kana"
              value={formData.name_kana || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary focus:border-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">メール</label>
            <input
              type="email"
              name="email"
              value={formData.email || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary focus:border-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">電話番号</label>
            <input
              type="text"
              name="phone"
              value={formData.phone || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary focus:border-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">銀行名</label>
            <input
              type="text"
              name="bank_name"
              value={formData.bank_name || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary focus:border-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">支店名</label>
            <input
              type="text"
              name="branch_name"
              value={formData.branch_name || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary focus:border-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">口座番号</label>
            <input
              type="text"
              name="account_number"
              value={formData.account_number || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2  focus:ring-primary focus:border-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">口座タイプ</label>
            <input
              type="text"
              name="account_type"
              value={formData.account_type || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary focus:border-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">口座名義</label>
            <input
              type="text"
              name="account_holder_name"
              value={formData.account_holder_name || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary focus:border-primary"
              required
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">宣伝媒体</label>
            <Button type="button" onClick={addPromotionMedium} size="sm" className="flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              追加
            </Button>
          </div>
          {formData.promotion_mediums && formData.promotion_mediums.map((medium, index) => (
            <div key={index} className="space-y-2 mb-4">
              <div className="flex items-center">
                <input
                  type="text"
                  name={`promotion_mediums_${index}`}
                  value={medium}
                  onChange={(e) => handlePromotionMediumChange(index, e.target.value)}
                  className="flex-1 border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary focus:border-primary"
                  placeholder="宣伝媒体"
                  required
                />
                <Button type="button" onClick={() => removePromotionMedium(index)} className="ml-2 bg-red-500 hover:bg-red-600">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <input
                type="url"
                name={`promotion_info_${index}`}
                value={formData.promotion_info?.[index] || ''}
                onChange={(e) => handlePromotionUrlChange(index, e.target.value)}
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary focus:border-primary"
                placeholder="宣伝媒体情報 (URLもしくはアカウント名など)"
                required
              />
            </div>
          ))}
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
    </div>
  </Modal>
)}
        
      </main>

    </div>
  );
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