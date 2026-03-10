import mongoose from 'mongoose'

const resultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz'
  },
  quizCode: String,
  answers: [Number],
  score: mongoose.Schema.Types.Mixed,
  resultType: String,
  resultName: String,
  resultDesc: String,
  detailReport: String,
  careers: [String],
  isPaid: {
    type: Boolean,
    default: false
  },
  paidOrderNo: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
})

export default mongoose.model('Result', resultSchema)
