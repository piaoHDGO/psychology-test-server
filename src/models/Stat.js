import mongoose from 'mongoose'

const StatSchema = new mongoose.Schema({
  event: {
    type: String,
    required: true,
    enum: ['test_start', 'test_complete', 'payment']
  },
  quizCode: {
    type: String,
    default: ''
  },
  userId: {
    type: String,
    default: ''
  },
  amount: {
    type: Number,
    default: 0
  },
  orderNo: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
})

// 索引优化查询性能
StatSchema.index({ event: 1, createdAt: -1 })
StatSchema.index({ quizCode: 1, createdAt: -1 })
StatSchema.index({ userId: 1, createdAt: -1 })

export default mongoose.model('Stat', StatSchema)
