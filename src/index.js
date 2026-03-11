import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import dotenv from 'dotenv'

// 路由
import authRoutes from './routes/auth.js'
import quizRoutes from './routes/quiz.js'
import resultRoutes from './routes/result.js'
import orderRoutes from './routes/order.js'
import adminAuthRoutes from './routes/adminAuth.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 8080

// 中间件
app.use(cors())
app.use(express.json())

// 路由
app.use('/api/auth', authRoutes)
app.use('/api/quiz', quizRoutes)
app.use('/api/result', resultRoutes)
app.use('/api/order', orderRoutes)
app.use('/api/admin', adminAuthRoutes)

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

// 连接数据库并启动服务器
async function startServer() {
  try {
    // 连接MongoDB（可选，如果未配置则使用内存存储）
    if (process.env.MONGODB_URI) {
      const mongoUri = process.env.MONGODB_URI
      console.log('🔄 尝试连接MongoDB...')
      console.log('URI:', mongoUri.replace(/\/\/.*:.*@/, '//***:***@')) // 隐藏密码

      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 10000,
        authSource: 'admin'
      })
      console.log('✅ MongoDB连接成功')
    } else {
      console.log('⚠️ 未配置MongoDB，使用内存存储（重启数据会丢失）')
    }

    app.listen(PORT, () => {
      console.log(`🚀 服务器运行在 http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('❌ 启动失败:', error.message)
    console.error('错误详情:', error)
    // 即使数据库连接失败也启动服务器
    app.listen(PORT, () => {
      console.log(`🚀 服务器运行在 http://localhost:${PORT}（无数据库）`)
    })
  }
}

startServer()
