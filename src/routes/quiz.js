import express from 'express'
import Quiz from '../models/Quiz.js'

const router = express.Router()

// 获取测试列表
router.get('/list', async (req, res) => {
  try {
    const quizzes = await Quiz.find({ status: 1 }).select('-questions -results')
    res.json({
      code: 0,
      data: quizzes
    })
  } catch (error) {
    console.error('获取测试列表失败:', error)
    res.status(500).json({ code: 500, message: '获取失败' })
  }
})

// 获取所有测试数据（包含题目和结果）
router.get('/all', async (req, res) => {
  try {
    const quizzes = await Quiz.find({ status: 1 })
    res.json({
      code: 0,
      data: quizzes
    })
  } catch (error) {
    console.error('获取全部数据失败:', error)
    res.status(500).json({ code: 500, message: '获取失败' })
  }
})

// 获取测试详情
router.get('/:code', async (req, res) => {
  try {
    const { code } = req.params
    const quiz = await Quiz.findOne({ code, status: 1 })

    if (!quiz) {
      return res.status(404).json({ code: 404, message: '测试不存在' })
    }

    // 不返回详细结果
    const quizData = quiz.toObject()
    delete quizData.results

    res.json({
      code: 0,
      data: quizData
    })
  } catch (error) {
    console.error('获取测试详情失败:', error)
    res.status(500).json({ code: 500, message: '获取失败' })
  }
})

// 获取测试题目（不含结果）
router.get('/:code/questions', async (req, res) => {
  try {
    const { code } = req.params
    const quiz = await Quiz.findOne({ code, status: 1 }).select('questions name')

    if (!quiz) {
      return res.status(404).json({ code: 404, message: '测试不存在' })
    }

    res.json({
      code: 0,
      data: {
        name: quiz.name,
        questions: quiz.questions.map(q => ({
          orderNum: q.orderNum,
          content: q.content,
          type: q.type,
          options: q.options.map(o => ({ text: o.text }))
        }))
      }
    })
  } catch (error) {
    console.error('获取题目失败:', error)
    res.status(500).json({ code: 500, message: '获取失败' })
  }
})

// 导入/更新测试数据（从管理后台上传）
router.post('/sync', async (req, res) => {
  try {
    // API密钥验证（生产环境建议使用JWT）
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
      const { code, name, description, price, icon, color, category, questions, results: quizResults, status } = quiz

      const updateData = {
        name,
        description,
        price: price || 0,
        icon: icon || '📝',
        color: color || '#667eea',
        category: category || 'psychology',
        questionCount: questions?.length || 0,
        questions: questions || [],
        results: quizResults || {},
        status: status !== undefined ? status : 1
      }

      const updated = await Quiz.findOneAndUpdate(
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

// 计算结果（需要提交答案）
router.post('/:code/calculate', async (req, res) => {
  try {
    const { code } = req.params
    const { answers, userId } = req.body

    const quiz = await Quiz.findOne({ code, status: 1 })

    if (!quiz) {
      return res.status(404).json({ code: 404, message: '测试不存在' })
    }

    // 计算结果
    let resultType = ''
    let resultName = ''
    let resultDesc = ''
    let detailReport = ''
    let careers = []

    if (code === 'mbti') {
      const scores = { e: 0, i: 0, s: 0, n: 0, t: 0, f: 0, j: 0, p: 0 }

      answers.forEach((answerIndex, qIndex) => {
        const question = quiz.questions[qIndex]
        const answer = question.options[answerIndex]

        if (answer.e) scores.e += answer.e
        if (answer.i) scores.i += answer.i
        if (answer.s) scores.s += answer.s
        if (answer.n) scores.n += answer.n
        if (answer.t) scores.t += answer.t
        if (answer.f) scores.f += answer.f
        if (answer.j) scores.j += answer.j
        if (answer.p) scores.p += answer.p
      })

      resultType = ''
      resultType += scores.e >= scores.i ? 'E' : 'I'
      resultType += scores.s >= scores.n ? 'S' : 'N'
      resultType += scores.t >= scores.f ? 'T' : 'F'
      resultType += scores.j >= scores.p ? 'J' : 'P'

      if (quiz.results && quiz.results[resultType]) {
        const r = quiz.results[resultType]
        resultName = r.name
        resultDesc = r.description
        detailReport = r.detail
        careers = r.careers || []
      }
    } else if (code === 'age') {
      let totalScore = 0
      answers.forEach((answerIndex, qIndex) => {
        const question = quiz.questions[qIndex]
        const answer = question.options[answerIndex]
        if (answer.age !== undefined) {
          totalScore += answer.age
        }
      })

      const psychologicalAge = 25 + totalScore
      resultType = String(psychologicalAge)
      resultName = `心理年龄 ${psychologicalAge} 岁`

      if (quiz.results && quiz.results.ranges) {
        const ranges = quiz.results.ranges
        let result = ranges[ranges.length - 1]
        for (const r of ranges) {
          if (psychologicalAge <= r.max) {
            result = r
            break
          }
        }
        resultDesc = result.desc
        detailReport = result.detail
      }
    } else if (code === 'color') {
      const scores = { red: 0, blue: 0, yellow: 0, green: 0 }

      answers.forEach((answerIndex, qIndex) => {
        const question = quiz.questions[qIndex]
        const answer = question.options[answerIndex]
        if (answer.red) scores.red += answer.red
        if (answer.blue) scores.blue += answer.blue
        if (answer.yellow) scores.yellow += answer.yellow
        if (answer.green) scores.green += answer.green
      })

      const maxScore = Math.max(scores.red, scores.blue, scores.yellow, scores.green)
      const colorMap = { red: '红色', blue: '蓝色', yellow: '黄色', green: '绿色' }

      if (scores.red === maxScore) resultType = 'red'
      else if (scores.blue === maxScore) resultType = 'blue'
      else if (scores.yellow === maxScore) resultType = 'yellow'
      else resultType = 'green'

      resultName = colorMap[resultType] + '性格'

      if (quiz.results && quiz.results.types) {
        const result = quiz.results.types.find(t => t.color === resultType)
        if (result) {
          resultDesc = result.desc
          detailReport = result.detail
          careers = result.strengths || []
        }
      }
    }

    res.json({
      code: 0,
      data: {
        resultType,
        resultName,
        resultDesc,
        detailReport,
        careers,
        price: quiz.price
      }
    })
  } catch (error) {
    console.error('计算结果失败:', error)
    res.status(500).json({ code: 500, message: '计算失败' })
  }
})

export default router
