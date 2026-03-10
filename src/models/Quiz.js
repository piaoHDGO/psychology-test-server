import mongoose from 'mongoose'

const questionSchema = new mongoose.Schema({
  orderNum: Number,
  dimension: String,
  content: String,
  type: { type: String, default: 'single' },
  options: [{
    text: String,
    // MBTI计分
    e: Number, i: Number, s: Number, n: Number, t: Number, f: Number, j: Number, p: Number,
    // 心理年龄
    age: Number,
    // 性格色彩
    red: Number, blue: Number, yellow: Number, green: Number
  }]
}, { _id: false })

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
  questionCount: Number,
  questions: [questionSchema],
  results: mongoose.Schema.Types.Mixed,
  status: {
    type: Number,
    default: 1
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
