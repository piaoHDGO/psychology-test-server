import express from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'psychology-test-secret'

// 微信小程序登录
router.post('/wechat-login', async (req, res) => {
  try {
    const { code, userInfo } = req.body

    if (!code) {
      return res.status(400).json({ code: 400, message: '缺少code参数' })
    }

    // TODO: 实际应该调用微信API换取openid
    // const wxResult = await axios.get(`https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`)
    // const openid = wxResult.data.openid

    // 演示模式：使用code作为标识
    const openid = `demo_${code}`

    // 查找或创建用户
    let user = await User.findOne({ openid })

    if (!user) {
      user = new User({
        openid,
        nickname: userInfo?.nickname || '用户',
        avatarUrl: userInfo?.avatarUrl || ''
      })
      await user.save()
    } else {
      // 更新用户信息
      if (userInfo?.nickname) user.nickname = userInfo.nickname
      if (userInfo?.avatarUrl) user.avatarUrl = userInfo.avatarUrl
      await user.save()
    }

    // 生成Token
    const token = jwt.sign(
      { userId: user._id, openid: user.openid },
      JWT_SECRET,
      { expiresIn: '30d' }
    )

    res.json({
      code: 0,
      data: {
        token,
        user: {
          id: user._id,
          nickname: user.nickname,
          avatarUrl: user.avatarUrl,
          vipStatus: user.vipStatus,
          vipExpireTime: user.vipExpireTime
        }
      }
    })
  } catch (error) {
    console.error('登录失败:', error)
    res.status(500).json({ code: 500, message: '登录失败' })
  }
})

// 获取用户信息
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({ code: 401, message: '未登录' })
    }

    const decoded = jwt.verify(token, JWT_SECRET)
    const user = await User.findById(decoded.userId).select('-openid')

    if (!user) {
      return res.status(404).json({ code: 404, message: '用户不存在' })
    }

    res.json({
      code: 0,
      data: {
        id: user._id,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        vipStatus: user.vipStatus,
        vipExpireTime: user.vipExpireTime
      }
    })
  } catch (error) {
    res.status(401).json({ code: 401, message: 'Token无效' })
  }
})

// 手机号登录
router.post('/phone-login', async (req, res) => {
  try {
    const { phone, code } = req.body

    // TODO: 验证短信验证码
    // 实际应该调用短信服务验证code

    if (!phone) {
      return res.status(400).json({ code: 400, message: '缺少手机号' })
    }

    // 查找或创建用户
    let user = await User.findOne({ phone })

    if (!user) {
      user = new User({
        phone,
        nickname: `用户${phone.slice(-4)}`
      })
      await user.save()
    }

    const token = jwt.sign(
      { userId: user._id, phone: user.phone },
      JWT_SECRET,
      { expiresIn: '30d' }
    )

    res.json({
      code: 0,
      data: {
        token,
        user: {
          id: user._id,
          nickname: user.nickname,
          avatarUrl: user.avatarUrl,
          vipStatus: user.vipStatus
        }
      }
    })
  } catch (error) {
    console.error('登录失败:', error)
    res.status(500).json({ code: 500, message: '登录失败' })
  }
})

export default router
