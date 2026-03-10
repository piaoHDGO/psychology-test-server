import express from 'express'
import jwt from 'jsonwebtoken'
import Result from '../models/Result.js'
import Quiz from '../models/Quiz.js'

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'psychology-test-secret'

// 获取用户ID（中间件）
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

// 保存测试结果
router.post('/save', async (req, res) => {
  try {
    const userId = getUserId(req)
    const { quizCode, answers, resultType, resultName, resultDesc, detailReport, careers } = req.body

    const quiz = await Quiz.findOne({ code: quizCode })
    if (!quiz) {
      return res.status(404).json({ code: 404, message: '测试不存在' })
    }

    const result = new Result({
      userId,
      quizId: quiz._id,
      quizCode,
      answers,
      resultType,
      resultName,
      resultDesc,
      detailReport,
      careers,
      isPaid: false
    })

    await result.save()

    res.json({
      code: 0,
      data: {
        id: result._id,
        quizCode,
        resultType,
        resultName,
        resultDesc,
        isPaid: false,
        price: quiz.price,
        createdAt: result.createdAt
      }
    })
  } catch (error) {
    console.error('保存结果失败:', error)
    res.status(500).json({ code: 500, message: '保存失败' })
  }
})

// 获取结果详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const userId = getUserId(req)

    const result = await Result.findById(id).populate('quizId')

    if (!result) {
      return res.status(404).json({ code: 404, message: '结果不存在' })
    }

    // 检查权限
    if (result.userId && result.userId.toString() !== userId) {
      // 非本人查看，检查是否已付费
      if (!result.isPaid) {
        // 未付费，只返回基本信息
        return res.json({
          code: 0,
          data: {
            id: result._id,
            quizCode: result.quizCode,
            quizName: result.quizId?.name,
            resultType: result.resultType,
            resultName: result.resultName,
            resultDesc: result.resultDesc,
            isPaid: false,
            price: result.quizId?.price,
            createdAt: result.createdAt,
            detailReport: null,
            careers: null
          }
        })
      }
    }

    // 返回完整信息
    res.json({
      code: 0,
      data: {
        id: result._id,
        quizCode: result.quizCode,
        quizName: result.quizId?.name,
        resultType: result.resultType,
        resultName: result.resultName,
        resultDesc: result.resultDesc,
        isPaid: result.isPaid,
        price: result.quizId?.price,
        detailReport: result.detailReport,
        careers: result.careers,
        createdAt: result.createdAt
      }
    })
  } catch (error) {
    console.error('获取结果失败:', error)
    res.status(500).json({ code: 500, message: '获取失败' })
  }
})

// 标记为已付费
router.post('/:id/mark-paid', async (req, res) => {
  try {
    const { id } = req.params
    const { orderNo } = req.body

    const result = await Result.findById(id)

    if (!result) {
      return res.status(404).json({ code: 404, message: '结果不存在' })
    }

    result.isPaid = true
    result.paidOrderNo = orderNo
    await result.save()

    res.json({
      code: 0,
      data: { success: true }
    })
  } catch (error) {
    console.error('标记付费失败:', error)
    res.status(500).json({ code: 500, message: '操作失败' })
  }
})

// 获取用户测试历史
router.get('/user/history', async (req, res) => {
  try {
    const userId = getUserId(req)

    if (!userId) {
      // 未登录，返回空列表
      return res.json({ code: 0, data: [] })
    }

    const results = await Result.find({ userId })
      .populate('quizId', 'name icon')
      .sort({ createdAt: -1 })
      .limit(20)

    res.json({
      code: 0,
      data: results.map(r => ({
        id: r._id,
        quizCode: r.quizCode,
        quizName: r.quizId?.name,
        quizIcon: r.quizId?.icon,
        resultType: r.resultType,
        resultName: r.resultName,
        isPaid: r.isPaid,
        createdAt: r.createdAt
      }))
    })
  } catch (error) {
    console.error('获取历史失败:', error)
    res.status(500).json({ code: 500, message: '获取失败' })
  }
})

export default router
