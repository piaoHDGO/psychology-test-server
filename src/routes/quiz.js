import express from 'express'
import Quiz from '../models/Quiz.js'

const router = express.Router()

// 初始化默认测试配置
const defaultQuizzes = [
  { code: 'mbti', name: 'MBTI人格测试', description: '28题 · 国际权威人格深度测评', price: 19.9, icon: '🎯', color: '#FFE5E5', category: 'psychology', questionCount: 28, status: 1, paid: 1 },
  { code: 'color', name: '性格色彩测试', description: '20题 · 深入解读性格色彩密码', price: 9.9, icon: '🎨', color: '#E5FFE5', category: 'psychology', questionCount: 20, status: 1, paid: 1 },
  { code: 'age', name: '心理成熟度测试', description: '12题 · 探索你的心理成熟度', price: 9.9, icon: '🧠', color: '#E5F0FF', category: 'psychology', questionCount: 12, status: 1, paid: 0 },
  { code: 'eq', name: 'EQ情商测试', description: '20题 · 测量你的情商水平', price: 9.9, icon: '🧡', color: '#E5FFFF', category: 'psychology', questionCount: 20, status: 1, paid: 1 }
]

// 初始化测试配置（如果不存在）
async function initQuizConfigs() {
  for (const quiz of defaultQuizzes) {
    await Quiz.findOneAndUpdate(
      { code: quiz.code },
      quiz,
      { upsert: true, new: true }
    )
  }
  console.log('测试配置初始化完成')
}

// 启动时初始化
initQuizConfigs().catch(console.error)

// 获取测试列表（只返回配置，不含题目）
router.get('/list', async (req, res) => {
  try {
    const quizzes = await Quiz.find({ status: 1 }).select('-__v -createdAt')
    res.json({
      code: 0,
      data: quizzes
    })
  } catch (error) {
    console.error('获取测试列表失败:', error)
    res.status(500).json({ code: 500, message: '获取失败' })
  }
})

// 获取所有测试配置（后台管理用，包含上下线状态）
router.get('/all', async (req, res) => {
  try {
    const quizzes = await Quiz.find().select('-__v -createdAt')
    res.json({
      code: 0,
      data: quizzes
    })
  } catch (error) {
    console.error('获取全部数据失败:', error)
    res.status(500).json({ code: 500, message: '获取失败' })
  }
})

// 获取单个测试配置
router.get('/config/:code', async (req, res) => {
  try {
    const { code } = req.params
    const quiz = await Quiz.findOne({ code })

    if (!quiz) {
      return res.status(404).json({ code: 404, message: '测试不存在' })
    }

    res.json({
      code: 0,
      data: quiz
    })
  } catch (error) {
    console.error('获取配置失败:', error)
    res.status(500).json({ code: 500, message: '获取失败' })
  }
})

// 更新测试配置（管理后台用）
router.post('/config', async (req, res) => {
  try {
    const { code, name, description, price, icon, color, category, status, paid, questions, results, questionCount } = req.body

    if (!code) {
      return res.status(400).json({ code: 400, message: '缺少code参数' })
    }

    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (price !== undefined) updateData.price = price
    if (icon !== undefined) updateData.icon = icon
    if (color !== undefined) updateData.color = color
    if (category !== undefined) updateData.category = category
    if (status !== undefined) updateData.status = status
    if (paid !== undefined) updateData.paid = paid
    if (questions !== undefined) updateData.questions = questions
    if (results !== undefined) updateData.results = results
    if (questionCount !== undefined) updateData.questionCount = questionCount

    const quiz = await Quiz.findOneAndUpdate(
      { code },
      updateData,
      { upsert: true, new: true }
    )

    res.json({
      code: 0,
      message: '更新成功',
      data: quiz
    })
  } catch (error) {
    console.error('更新配置失败:', error)
    res.status(500).json({ code: 500, message: '更新失败' })
  }
})

// 批量更新测试配置（从管理后台上传）
router.post('/sync', async (req, res) => {
  try {
    // API密钥验证
    const apiKey = req.headers['x-api-key']
    const validKey = process.env.ADMIN_API_KEY || 'admin-sync-key-2024'
    if (apiKey !== validKey) {
      return res.status(401).json({ code: 401, message: '未授权' })
    }

    const { quizzes } = req.body

    if (!quizzes || !Array.isArray(quizzes)) {
      return res.status(400).json({ code: 400, message: '无效的数据格式' })
    }

    const results = []

    for (const quiz of quizzes) {
      const { code, name, description, price, icon, color, category, questionCount, status, paid, questions } = quiz

      const updateData = {
        name,
        description,
        price: price || 0,
        icon: icon || '📝',
        color: color || '#667eea',
        category: category || 'psychology',
        questionCount: questionCount || 0,
        status: status !== undefined ? status : 1,
        paid: paid || 0
      }

      // 如果有题目数据，一并更新
      if (questions && Array.isArray(questions)) {
        updateData.questions = questions
      }

      await Quiz.findOneAndUpdate(
        { code },
        updateData,
        { upsert: true, new: true }
      )

      results.push({ code, name, status: 'success' })
    }

    res.json({
      code: 0,
      message: `成功同步 ${results.length} 个测试`,
      data: results
    })
  } catch (error) {
    console.error('同步数据失败:', error)
    res.status(500).json({ code: 500, message: '同步失败' })
  }
})

export default router
