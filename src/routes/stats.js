import express from 'express'
import Stat from '../models/Stat.js'
import Order from '../models/Order.js'

const router = express.Router()

// 记录统计事件
router.post('/record', async (req, res) => {
  try {
    const { event, quizCode, userId, amount, orderNo } = req.body

    if (!event) {
      return res.status(400).json({ code: 400, message: '缺少事件类型' })
    }

    const stat = await Stat.create({
      event,
      quizCode: quizCode || '',
      userId: userId || '',
      amount: amount || 0,
      orderNo: orderNo || ''
    })

    res.json({
      code: 0,
      data: stat
    })
  } catch (error) {
    console.error('记录统计失败:', error)
    res.status(500).json({ code: 500, message: '记录统计失败' })
  }
})

// 获取统计数据
router.get('/stats', async (req, res) => {
  try {
    const { period = '7d' } = req.query

    // 计算日期范围
    let startDate = new Date()
    switch (period) {
      case '24h':
        startDate.setDate(startDate.getDate() - 1)
        break
      case '7d':
        startDate.setDate(startDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(startDate.getDate() - 30)
        break
      case 'all':
        startDate = new Date(0)
        break
      default:
        startDate.setDate(startDate.getDate() - 7)
    }

    // 总测试次数
    const totalTests = await Stat.countDocuments({
      event: 'test_complete'
    })

    // 期间测试次数
    const periodTests = await Stat.countDocuments({
      event: 'test_complete',
      createdAt: { $gte: startDate }
    })

    // 总用户数（去重）
    const totalUsers = await Stat.distinct('userId', {
      userId: { $ne: '' }
    })

    // 期间新增用户
    const periodUsers = await Stat.distinct('userId', {
      userId: { $ne: '' },
      createdAt: { $gte: startDate }
    })

    // 付费订单数
    const totalPaidOrders = await Order.countDocuments({
      status: 'paid'
    })

    // 期间付费订单
    const periodPaidOrders = await Order.countDocuments({
      status: 'paid',
      createdAt: { $gte: startDate }
    })

    // 收入金额
    const totalRevenue = await Order.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])

    // 期间收入
    const periodRevenue = await Order.aggregate([
      { $match: { status: 'paid', createdAt: { $gte: startDate } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])

    // 获取趋势数据
    const trendData = await getTrendData(period)

    res.json({
      code: 0,
      data: {
        totalTests,
        periodTests,
        totalUsers: totalUsers.length,
        periodUsers: periodUsers.length,
        totalPaidOrders,
        periodPaidOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        periodRevenue: periodRevenue[0]?.total || 0,
        trendData
      }
    })
  } catch (error) {
    console.error('获取统计失败:', error)
    res.status(500).json({ code: 500, message: '获取统计失败' })
  }
})

// 获取趋势数据
async function getTrendData(period) {
  let format
  let days

  switch (period) {
    case '24h':
      format = '%Y-%m-%d %H:00'
      days = 1
      break
    case '7d':
      format = '%Y-%m-%d'
      days = 7
      break
    case '30d':
      format = '%Y-%m-%d'
      days = 30
      break
    default:
      format = '%Y-%m-%d'
      days = 7
  }

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  // 测试完成趋势
  const testStats = await Stat.aggregate([
    {
      $match: {
        event: 'test_complete',
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format, date: '$createdAt' } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ])

  // 支付趋势
  const paymentStats = await Order.aggregate([
    {
      $match: {
        status: 'paid',
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format, date: '$createdAt' } },
        count: { $sum: 1 },
        amount: { $sum: '$amount' }
      }
    },
    { $sort: { _id: 1 } }
  ])

  // 转换为日期→数据的映射
  const testMap = {}
  testStats.forEach(s => {
    testMap[s._id] = s.count
  })

  const paymentMap = {}
  paymentStats.forEach(s => {
    paymentMap[s._id] = { count: s.count, amount: s.amount }
  })

  // 生成完整日期序列
  const result = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)

    let dateKey
    if (period === '24h') {
      dateKey = d.getHours().toString().padStart(2, '0') + ':00'
    } else {
      dateKey = d.toISOString().split('T')[0]
    }

    result.push({
      date: dateKey,
      tests: testMap[dateKey] || 0,
      payments: paymentMap[dateKey]?.count || 0,
      revenue: paymentMap[dateKey]?.amount || 0
    })
  }

  return result
}

export default router
