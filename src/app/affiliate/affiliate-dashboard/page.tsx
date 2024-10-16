'use client'

import { useState, useEffect } from 'react'
import CustomCard, { CustomCardContent, CustomCardHeader } from '@/app/components/ui/CustomCard'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowUpDown } from 'lucide-react'

type SortKey = 'reservationDate' | 'stayDate' | 'status'
type SortOrder = 'asc' | 'desc'

export default function Component() {
  const [selectedMonth, setSelectedMonth] = useState<string>('all')
  const [currentMonth, setCurrentMonth] = useState<string>('')
  const [sortKey, setSortKey] = useState<SortKey>('reservationDate')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  useEffect(() => {
    const now = new Date()
    setCurrentMonth(now.toLocaleString('ja-JP', { month: 'long' }))
  }, [])

  const totalRewards = 1250000
  const yearlyRewards = 15000000
  const monthlyRewards: { [key: string]: number } = {
    all: 1250000,
    '1': 100000,
    '2': 120000,
    '3': 150000,
    '4': 180000,
    '5': 200000,
    '6': 220000,
    '7': 240000,
    '8': 260000,
    '9': 280000,
    '10': 300000,
    '11': 320000,
    '12': 340000,
  }

  const currentMonthExpectedReward = 280000

  const [reservations, setReservations] = useState([
    { id: 1, reservationDate: '2023-05-01', stayDate: '2023-06-15', reservationNumber: 'R001', amount: 50000, reward: 5000, status: '確定' },
    { id: 2, reservationDate: '2023-05-02', stayDate: '2023-06-20', reservationNumber: 'R002', amount: 75000, reward: 7500, status: '未確定' },
    { id: 3, reservationDate: '2023-05-03', stayDate: '2023-06-25', reservationNumber: 'R003', amount: 100000, reward: 10000, status: '確定' },
    { id: 4, reservationDate: '2023-05-04', stayDate: '2023-06-30', reservationNumber: 'R004', amount: 120000, reward: 12000, status: '未確定' },
    { id: 5, reservationDate: '2023-05-05', stayDate: '2023-07-05', reservationNumber: 'R005', amount: 90000, reward: 9000, status: '確定' },
  ])

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

  return (
    <div className="bg-background text-foreground">
      <main className="container mx-auto px-3 py-8 sm:px-4 sm:py-12 max-w-6xl">
        <h1 className="text-2xl sm:text-3xl font-bold mb-8 text-center sm:text-left">アフィリエイターダッシュボード</h1>

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

        <CustomCard className="mt-8 transition-all duration-300 hover:shadow-lg bg-card text-card-foreground">
          <CustomCardHeader className="bg-secondary text-secondary-foreground h-16 flex items-center justify-between">
            <h2 className="text-xl font-bold">予約一覧</h2>
          </CustomCardHeader>
          <CustomCardContent>
            <div className="overflow-x-auto">
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
                    <TableHead className="bg-muted cursor-pointer" onClick={() => handleSort('status')}>
                      ステータス <ArrowUpDown className="inline ml-2" />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reservations.map((reservation) => (
                    <TableRow key={reservation.id} className="hover:bg-muted/50 transition-colors duration-200">
                      <TableCell>{reservation.reservationDate}</TableCell>
                      <TableCell>{reservation.stayDate}</TableCell>
                      <TableCell>{reservation.reservationNumber}</TableCell>
                      <TableCell>{reservation.amount.toLocaleString()}円</TableCell>
                      <TableCell>{reservation.reward.toLocaleString()}円</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          reservation.status === '確定' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {reservation.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CustomCardContent>
        </CustomCard>
      </main>
    </div>
  )
}