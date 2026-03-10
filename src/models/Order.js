import mongoose from 'mongoose'

const orderSchema = new mongoose.Schema({
  orderNo: {
    type: String,
    unique: true,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz'
  },
  resultId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Result'
  },
  amount: Number,
  payType: String,
  payTime: Date,
  status: {
    type: String,
    default: 'pending' // pending/paid/refunded
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

export default mongoose.model('Order', orderSchema)
