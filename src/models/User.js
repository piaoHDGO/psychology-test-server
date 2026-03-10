import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  openid: {
    type: String,
    unique: true,
    sparse: true
  },
  nickname: String,
  avatarUrl: String,
  phone: String,
  vipStatus: {
    type: Number,
    default: 0 // 0:普通 1:月卡 2:年卡
  },
  vipExpireTime: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

userSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

export default mongoose.model('User', userSchema)
