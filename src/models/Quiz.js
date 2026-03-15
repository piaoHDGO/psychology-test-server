import mongoose from 'mongoose'

// 优化后的Quiz Schema - 只存储配置信息，题目存前端
const quizSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true,
    required: true
  },
  name: String,
  description: String,
  price: Number,
  icon: String,
  color: String,
  category: String,
  questionCount: {
    type: Number,
    default: 0
  },
  status: {
    type: Number,
    default: 1  // 1=上线 0=下线
  },
  paid: {
    type: Number,
    default: 0  // 0: 免费, 1: 付费
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

export default mongoose.model('Quiz', quizSchema)
