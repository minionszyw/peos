/**
 * 数据看板页面
 */
import { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, DatePicker, Select, Button, Empty } from 'antd'
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  ReloadOutlined,
  DollarOutlined,
  ShoppingOutlined,
  ShopOutlined,
  PercentageOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import { getDashboardSummary, getSalesTrend, getSalesRanking } from '@/services/dashboard'
import { getActivePlatforms } from '@/services/platform'
import { getShopList } from '@/services/shop'
import styles from './index.module.scss'

const { RangePicker } = DatePicker

const Dashboard = () => {
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(7, 'days'),
    dayjs(),
  ])
  const [selectedPlatform, setSelectedPlatform] = useState<string>()
  const [selectedShop, setSelectedShop] = useState<number>()
  const [platforms, setPlatforms] = useState<any[]>([])
  const [shops, setShops] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [trendData, setTrendData] = useState<any>(null)
  const [rankingData, setRankingData] = useState<any>(null)

  // 加载基础数据
  useEffect(() => {
    loadPlatforms()
    loadShops()
  }, [])

  // 加载看板数据
  useEffect(() => {
    loadDashboardData()
  }, [dateRange, selectedPlatform, selectedShop])

  const loadPlatforms = async () => {
    try {
      const data = await getActivePlatforms()
      setPlatforms(data)
    } catch (error) {
      console.error('加载平台失败:', error)
    }
  }

  const loadShops = async () => {
    try {
      const data = await getShopList()
      setShops(data)
    } catch (error) {
      console.error('加载店铺失败:', error)
    }
  }

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const params = {
        start_date: dateRange[0].format('YYYY-MM-DD'),
        end_date: dateRange[1].format('YYYY-MM-DD'),
        platform: selectedPlatform,
        shop_id: selectedShop,
      }

      const [summaryRes, trendRes, rankingRes] = await Promise.all([
        getDashboardSummary(params),
        getSalesTrend({ ...params, group_by: 'day' }),
        getSalesRanking({ ...params, type: 'product', limit: 10 }),
      ])

      setSummary(summaryRes)
      setTrendData(trendRes)
      setRankingData(rankingRes)
    } catch (error) {
      console.error('加载看板数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 销售趋势图表配置
  const getTrendChartOption = () => {
    if (!trendData || !trendData.length) {
      return null
    }

    const dates = trendData.map((item: any) => item.date)
    const amounts = trendData.map((item: any) => item.total_amount || 0)

    return {
      tooltip: {
        trigger: 'axis',
      },
      xAxis: {
        type: 'category',
        data: dates,
      },
      yAxis: {
        type: 'value',
        name: '销售额（元）',
      },
      series: [
        {
          name: '销售额',
          type: 'line',
          data: amounts,
          smooth: true,
          areaStyle: {
            opacity: 0.3,
          },
        },
      ],
    }
  }

  // 销售排行图表配置
  const getRankingChartOption = () => {
    if (!rankingData || !rankingData.length) {
      return null
    }

    const products = rankingData.map((item: any) => item.product_name || '未知商品')
    const amounts = rankingData.map((item: any) => item.total_amount || 0)

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
      },
      xAxis: {
        type: 'value',
        name: '销售额（元）',
      },
      yAxis: {
        type: 'category',
        data: products,
      },
      series: [
        {
          name: '销售额',
          type: 'bar',
          data: amounts,
        },
      ],
    }
  }

  const trendOption = getTrendChartOption()
  const rankingOption = getRankingChartOption()

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h2>数据看板</h2>
        <div className={styles.filters}>
          <RangePicker
            value={dateRange}
            onChange={(dates) => dates && setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
          />
          <Select
            style={{ width: 150 }}
            placeholder="选择平台"
            allowClear
            value={selectedPlatform}
            onChange={setSelectedPlatform}
          >
            {platforms.map((p) => (
              <Select.Option key={p.id} value={p.name}>
                {p.name}
              </Select.Option>
            ))}
          </Select>
          <Select
            style={{ width: 200 }}
            placeholder="选择店铺"
            allowClear
            value={selectedShop}
            onChange={setSelectedShop}
            showSearch
            optionFilterProp="children"
          >
            {shops.map((s) => (
              <Select.Option key={s.id} value={s.id}>
                {s.name}
              </Select.Option>
            ))}
          </Select>
          <Button icon={<ReloadOutlined />} onClick={loadDashboardData}>
            刷新
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} className={styles.statsCards}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总销售额"
              value={summary?.total_sales || 0}
              precision={2}
              prefix={<DollarOutlined />}
              suffix="元"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="订单数量"
              value={summary?.total_orders || 0}
              prefix={<ShoppingOutlined />}
              suffix="单"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="活跃店铺"
              value={summary?.active_shops || 0}
              prefix={<ShopOutlined />}
              suffix="家"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="平均客单价"
              value={summary?.avg_order_amount || 0}
              precision={2}
              prefix={<PercentageOutlined />}
              suffix="元"
            />
          </Card>
        </Col>
      </Row>

      {/* 销售趋势图 */}
      <div className={styles.chartCard}>
        <div className={styles.cardTitle}>销售趋势</div>
        {trendOption ? (
          <ReactECharts
            option={trendOption}
            style={{ height: '350px' }}
            notMerge={true}
            lazyUpdate={true}
          />
        ) : (
          <div className={styles.emptyState}>
            <Empty description="暂无销售数据" />
          </div>
        )}
      </div>

      {/* 商品销售排行 */}
      <div className={styles.chartCard}>
        <div className={styles.cardTitle}>商品销售排行 TOP 10</div>
        {rankingOption ? (
          <ReactECharts
            option={rankingOption}
            style={{ height: '350px' }}
            notMerge={true}
            lazyUpdate={true}
          />
        ) : (
          <div className={styles.emptyState}>
            <Empty description="暂无排行数据" />
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
