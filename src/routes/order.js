import express from 'express'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import Order from '../models/Order.js'
import Result from '../models/Result.js'
import Quiz from '../models/Quiz.js'

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'psychology-test-secret'

// 获取用户ID
function getUserId(req) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return null
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    return decoded.userId
  } catch {
    return null
  }
}

// 生成订单号
function generateOrderNo() {
  return `PT${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`
}

// 生成签名
function generateSignature(params, apiKey) {
  const stringA = Object.keys(params).sort().map(key => `${key}=${params[key]}`).join('&')
  const stringSignTemp = `${stringA}&key=${apiKey}`
  return crypto.createHash('md5').update(stringSignTemp).digest('hex').toUpperCase()
}

// 创建支付订单
router.post('/create', async (req, res) => {
  try {
    const userId = getUserId(req)
    const { resultId, quizCode, openid } = req.body

    if (!resultId || !quizCode) {
      return res.status(400).json({ code: 400, message: '参数不完整' })
    }

    // 获取测试价格
    let quiz
    try {
      quiz = await Quiz.findOne({ code: quizCode })
    } catch (e) {
      // 数据库未连接，使用模拟数据
      quiz = { _id: 'demo', name: quizCode, price: 19.9 }
    }

    const amount = quiz.price * 100 // 微信支付单位是分

    // 创建订单
    let order
    try {
      order = new Order({
        orderNo: generateOrderNo(),
        userId,
        resultId,
        quizId: quiz._id,
        amount: quiz.price,
        status: 'pending'
      })
      await order.save()
    } catch (e) {
      // 数据库未连接，使用内存订单
      order = {
        orderNo: generateOrderNo(),
        amount: quiz.price,
        status: 'pending'
      }
    }

    // 检查是否启用真实微信支付
    const payEnabled = process.env.WECHAT_PAY_ENABLED === 'true'

    if (payEnabled && process.env.WECHAT_PAY_APPID && openid) {
      // 真实微信支付模式
      try {
        const wechatPay = await import('wechatpay-node-v3')
        const wxpay = new wechatPay.default({
          appid: process.env.WECHAT_PAY_APPID,
          mchid: process.env.WECHAT_PAY_MCHID,
          publicKey: process.env.WECHAT_PAY_APIKEY,
          privateKey: process.env.WECHAT_PAY_APIKEY
        })

        const payResult = await wxpay.transactions_jsapi({
          body: `${quiz.name}-完整报告`,
          out_trade_no: order.orderNo,
          total_fee: amount,
          trade_type: 'JSAPI',
          openid: openid,
          notify_url: process.env.WECHAT_PAY_NOTIFY_URL
        })

        // 返回支付参数给前端
        const timestamp = String(Math.floor(Date.now() / 1000))
        const nonceStr = Math.random().toString(36).substr(2)

        const payParams = {
          appId: process.env.WECHAT_PAY_APPID,
          timeStamp: timestamp,
          nonceStr: nonceStr,
          package: `prepay_id=${payResult.prepay_id}`,
          signType: 'RSA',
          paySign: '' // 需要签名
        }

        // 生成签名
        const paySignStr = `${payParams.appId}\n${timestamp}\n${nonceStr}\n${payParams.package}\n`
        payParams.paySign = crypto.createSign('RSA-SHA256')
          .update(paySignStr)
          .sign(process.env.WECHAT_PAY_PRIVATE_KEY, 'base64')

        res.json({
          code: 0,
          data: {
            orderNo: order.orderNo,
            amount: quiz.price,
            payParams,
            payType: 'wechat'
          }
        })
      } catch (wxError) {
        console.error('微信支付创建失败:', wxError.message)
        // 降级到模拟支付
        res.json({
          code: 0,
          data: {
            orderNo: order.orderNo,
            amount: quiz.price,
            payParams: getSimulatePayParams(order.orderNo),
            payType: 'simulate'
          }
        })
      }
    } else {
      // 模拟支付模式
      res.json({
        code: 0,
        data: {
          orderNo: order.orderNo,
          amount: quiz.price,
          payParams: getSimulatePayParams(order.orderNo),
          payType: 'simulate'
        }
      })
    }
  } catch (error) {
    console.error('创建订单失败:', error)
    res.status(500).json({ code: 500, message: '创建失败' })
  }
})

// 获取模拟支付参数
function getSimulatePayParams(orderNo) {
  return {
    appId: 'wxdemo',
    timeStamp: String(Math.floor(Date.now() / 1000)),
    nonceStr: Math.random().toString(36).substr(2),
    package: 'prepay_id=demo',
    signType: 'MD5',
    paySign: 'demo'
  }
}

// 支付回调
router.post('/notify', async (req, res) => {
  try {
    const { out_trade_no, transaction_id } = req.body

    // 验证签名（真实支付需要验证）
    const payEnabled = process.env.WECHAT_PAY_ENABLED === 'true'

    if (payEnabled) {
      // TODO: 验证微信支付签名
      // const verify = wxpay.verifySignature(req.body)
    }

    let order
    try {
      order = await Order.findOne({ orderNo: out_trade_no })
    } catch (e) {
      order = null
    }

    if (!order) {
      return res.status(404).json({ code: 404, message: '订单不存在' })
    }

    if (order.status === 'paid') {
      return res.json({ code: 0, message: 'OK' })
    }

    // 更新订单状态
    try {
      order.status = 'paid'
      order.payTime = new Date()
      await order.save()
    } catch (e) {
      // 内存模式
      order.status = 'paid'
    }

    // 标记结果为已付费
    try {
      await Result.findByIdAndUpdate(order.resultId, {
        isPaid: true,
        paidOrderNo: out_trade_no
      })
    } catch (e) {
      // 可能数据库未连接
    }

    // 返回成功响应给微信
    res.json({ code: 0, message: 'OK' })
  } catch (error) {
    console.error('支付回调失败:', error)
    res.status(500).json({ code: 500, message: '处理失败' })
  }
})

// 查询订单状态
router.get('/:orderNo', async (req, res) => {
  try {
    const { orderNo } = req.params

    let order
    try {
      order = await Order.findOne({ orderNo })
    } catch (e) {
      order = null
    }

    if (!order) {
      return res.status(404).json({ code: 404, message: '订单不存在' })
    }

    res.json({
      code: 0,
      data: {
        orderNo: order.orderNo,
        amount: order.amount,
        status: order.status,
        payTime: order.payTime
      }
    })
  } catch (error) {
    console.error('查询订单失败:', error)
    res.status(500).json({ code: 500, message: '查询失败' })
  }
})

// 模拟支付（用于演示）
router.post('/simulate-pay', async (req, res) => {
  try {
    const { orderNo } = req.body

    let order
    try {
      order = await Order.findOne({ orderNo })
    } catch (e) {
      order = { orderNo, status: 'pending' }
    }

    if (!order) {
      return res.status(404).json({ code: 404, message: '订单不存在' })
    }

    // 更新订单状态
    try {
      order.status = 'paid'
      order.payTime = new Date()
      await order.save()
    } catch (e) {
      order.status = 'paid'
    }

    // 标记结果为已付费
    try {
      if (order.resultId) {
        await Result.findByIdAndUpdate(order.resultId, {
          isPaid: true,
          paidOrderNo: orderNo
        })
      }
    } catch (e) {
      // 可能数据库未连接
    }

    res.json({
      code: 0,
      data: { success: true }
    })
  } catch (error) {
    console.error('模拟支付失败:', error)
    res.status(500).json({ code: 500, message: '支付失败' })
  }
})

// 获取用户订单列表
router.get('/user/list', async (req, res) => {
  try {
    const userId = getUserId(req)

    if (!userId) {
      return res.json({ code: 0, data: [] })
    }

    let orders
    try {
      orders = await Order.find({ userId })
        .populate('quizId', 'name icon')
        .sort({ createdAt: -1 })
        .limit(20)
    } catch (e) {
      orders = []
    }

    res.json({
      code: 0,
      data: orders.map(o => ({
        orderNo: o.orderNo,
        quizName: o.quizId?.name,
        amount: o.amount,
        status: o.status,
        createdAt: o.createdAt
      }))
    })
  } catch (error) {
    console.error('获取订单列表失败:', error)
    res.status(500).json({ code: 500, message: '获取失败' })
  }
})

export default router
