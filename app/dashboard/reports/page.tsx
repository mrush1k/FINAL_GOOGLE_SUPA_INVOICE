"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, CalendarIcon, DollarSign, FileText, Clock, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ChartContainer, ChartConfig } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

interface InvoiceSummary {
  paid: { count: number; total: number }
  unpaid: { count: number; total: number }
  overdue: { count: number; total: number }
  taxCollected: number
  period: string
}

interface CashflowData {
  month: string
  income: number
  year: number
}

interface OutstandingBalances {
  overdue: { count: number; total: number }
  pending: { count: number; total: number }
  total: number
}

export default function ReportsPage() {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [summaryData, setSummaryData] = useState<InvoiceSummary | null>(null)
  const [cashflowData, setCashflowData] = useState<CashflowData[]>([])
  const [outstandingBalances, setOutstandingBalances] = useState<OutstandingBalances | null>(null)
  const [loading, setLoading] = useState(false)

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i)

  const fetchSummaryData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (dateFrom) params.append('from', dateFrom)
      if (dateTo) params.append('to', dateTo)
      
      const response = await fetch(`/api/reports/summary?${params}`)
      if (response.ok) {
        const data = await response.json()
        setSummaryData(data)
      }
    } catch (error) {
      console.error('Failed to fetch summary data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCashflowData = async (year: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/reports/cashflow?year=${year}`)
      if (response.ok) {
        const data = await response.json()
        setCashflowData(data.monthlyData || [])
        setOutstandingBalances(data.outstandingBalances || null)
      }
    } catch (error) {
      console.error('Failed to fetch cashflow data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCashflowData(selectedYear)
  }, [selectedYear])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(amount)
  }

  const setPresetDateRange = (preset: string) => {
    const today = new Date()
    const currentYear = today.getFullYear()
    const currentMonth = today.getMonth()

    switch (preset) {
      case 'thisMonth':
        setDateFrom(format(new Date(currentYear, currentMonth, 1), 'yyyy-MM-dd'))
        setDateTo(format(today, 'yyyy-MM-dd'))
        break
      case 'lastMonth':
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
        setDateFrom(format(new Date(lastMonthYear, lastMonth, 1), 'yyyy-MM-dd'))
        setDateTo(format(new Date(currentYear, currentMonth, 0), 'yyyy-MM-dd'))
        break
      case 'thisYear':
        setDateFrom(format(new Date(currentYear, 0, 1), 'yyyy-MM-dd'))
        setDateTo(format(today, 'yyyy-MM-dd'))
        break
      case 'lastYear':
        setDateFrom(format(new Date(currentYear - 1, 0, 1), 'yyyy-MM-dd'))
        setDateTo(format(new Date(currentYear - 1, 11, 31), 'yyyy-MM-dd'))
        break
    }
  }

  const chartData = cashflowData.map(item => ({
    name: item.month,
    income: item.income
  }))

  const chartConfig: ChartConfig = {
    income: {
      label: "Income",
      color: "hsl(var(--primary))",
    },
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
        <p className="text-muted-foreground">
          Track your business performance with detailed analytics and insights.
        </p>
      </div>

      <Tabs defaultValue="summary" className="space-y-6">
        <TabsList>
          <TabsTrigger value="summary">Invoice Summary</TabsTrigger>
          <TabsTrigger value="cashflow">Cashflow Tracker</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Invoice Summary Generator
              </CardTitle>
              <CardDescription>
                Generate comprehensive summaries of your invoices for any date range.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Quick Presets</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPresetDateRange('thisMonth')}
                    >
                      This Month
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPresetDateRange('lastMonth')}
                    >
                      Last Month
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPresetDateRange('thisYear')}
                    >
                      This Year
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPresetDateRange('lastYear')}
                    >
                      Last Year
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dateFrom">From Date</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dateTo">To Date</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Generate Report</Label>
                  <Button 
                    onClick={fetchSummaryData}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? 'Loading...' : 'Generate Summary'}
                  </Button>
                </div>
              </div>

              {summaryData && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-600 text-sm font-medium">Paid Invoices</p>
                          <p className="text-2xl font-bold text-green-700">{summaryData.paid.count}</p>
                          <p className="text-sm text-green-600">{formatCurrency(summaryData.paid.total)}</p>
                        </div>
                        <DollarSign className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-yellow-200 bg-yellow-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-yellow-600 text-sm font-medium">Unpaid Invoices</p>
                          <p className="text-2xl font-bold text-yellow-700">{summaryData.unpaid.count}</p>
                          <p className="text-sm text-yellow-600">{formatCurrency(summaryData.unpaid.total)}</p>
                        </div>
                        <Clock className="h-8 w-8 text-yellow-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-red-600 text-sm font-medium">Overdue Invoices</p>
                          <p className="text-2xl font-bold text-red-700">{summaryData.overdue.count}</p>
                          <p className="text-sm text-red-600">{formatCurrency(summaryData.overdue.total)}</p>
                        </div>
                        <FileText className="h-8 w-8 text-red-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-600 text-sm font-medium">Tax Collected</p>
                          <p className="text-2xl font-bold text-blue-700">{formatCurrency(summaryData.taxCollected)}</p>
                          <p className="text-sm text-blue-600">{summaryData.period}</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cashflow" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Monthly Income Trend
                </CardTitle>
                <CardDescription>
                  Track your monthly income performance for {selectedYear}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {chartData.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => formatCurrency(value).replace('AUD', '$')} />
                      <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Income']} />
                      <Bar dataKey="income" fill="var(--color-income)" />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    {loading ? 'Loading...' : 'No data available for this period'}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Cashflow Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Total Income ({selectedYear})</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(chartData.reduce((sum, item) => sum + item.income, 0))}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Average Monthly Income</p>
                    <p className="text-xl font-semibold">
                      {formatCurrency(chartData.length > 0 ? chartData.reduce((sum, item) => sum + item.income, 0) / chartData.length : 0)}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Best Month</p>
                    <p className="text-lg font-semibold text-green-600">
                      {chartData.length > 0 
                        ? (() => {
                            const best = chartData.reduce((max, item) => item.income > max.income ? item : max, chartData[0])
                            return `${best.name}: ${formatCurrency(best.income)}`
                          })()
                        : 'No data'
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-amber-600">Outstanding Balances</CardTitle>
                </CardHeader>
                <CardContent>
                  {outstandingBalances ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                        <div>
                          <span className="text-sm font-medium">Overdue Invoices</span>
                          <p className="text-xs text-red-600">{outstandingBalances.overdue.count} invoices</p>
                        </div>
                        <span className="font-semibold text-red-600">
                          {formatCurrency(outstandingBalances.overdue.total)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                        <div>
                          <span className="text-sm font-medium">Pending Invoices</span>
                          <p className="text-xs text-yellow-600">{outstandingBalances.pending.count} invoices</p>
                        </div>
                        <span className="font-semibold text-yellow-600">
                          {formatCurrency(outstandingBalances.pending.total)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded border-t">
                        <span className="text-sm font-bold">Total Outstanding:</span>
                        <span className="font-bold text-lg">
                          {formatCurrency(outstandingBalances.total)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Loading outstanding balances...</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}