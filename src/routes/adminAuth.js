import express from 'express'
import jwt from 'jsonwebtoken'
import Setting from '../models/Setting.js'

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'psychology-test-secret'

// 初始化默认管理员密码（如果不存在）
async function initAdminPassword() {
  try {
    const existing = await Setting.findOne({ key: 'admin_password' })
    if (!existing) {
      await Setting.create({
        key: 'admin_password',
        value: 'admin123',
        description: '管理员登录密码'
      })
      console.log('已初始化管理员密码')
    }
  } catch (error) {
    console.error('初始化管理员密码失败:', error)
  }
}

// 初始化默认系统配置（免责声明等）
async function initSystemSettings() {
  try {
    const defaultSettings = [
      {
        key: 'disclaimer',
        value: '本测试结果仅供娱乐参考，不能替代专业的心理咨询或医学诊断。如有心理困扰，请咨询专业心理医生。',
        description: '测试结果免责声明'
      },
      {
        key: 'content_source',
        value: '心理测试平台原创内容',
        description: '内容来源说明'
      }
    ]

    for (const setting of defaultSettings) {
      const existing = await Setting.findOne({ key: setting.key })
      if (!existing) {
        await Setting.create(setting)
        console.log(`已初始化系统配置: ${setting.key}`)
      }
    }
  } catch (error) {
    console.error('初始化系统配置失败:', error)
  }
}

// 初始化调用
initAdminPassword()
initSystemSettings()

// 管理员登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ code: 400, message: '请输入用户名和密码' })
    }

    // 从数据库获取密码
    const adminUser = await Setting.findOne({ key: 'admin_username' })
    const adminPass = await Setting.findOne({ key: 'admin_password' })

    const validUsername = adminUser?.value || 'admin'
    const validPassword = adminPass?.value || 'admin123'

    if (username !== validUsername || password !== validPassword) {
      return res.status(401).json({ code: 401, message: '用户名或密码错误' })
    }

    // 生成Token
    const token = jwt.sign(
      { username, isAdmin: true },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      code: 0,
      data: {
        token,
        user: {
          username,
          nickname: '管理员'
        }
      }
    })
  } catch (error) {
    console.error('管理员登录失败:', error)
    res.status(500).json({ code: 500, message: '登录失败' })
  }
})

// 修改密码
router.post('/change-password', async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ code: 400, message: '请填写完整信息' })
    }

    // 验证旧密码
    const adminPass = await Setting.findOne({ key: 'admin_password' })
    if (adminPass?.value !== oldPassword) {
      return res.status(401).json({ code: 401, message: '原密码错误' })
    }

    // 更新密码
    await Setting.findOneAndUpdate(
      { key: 'admin_password' },
      { value: newPassword, updatedAt: new Date() }
    )

    res.json({
      code: 0,
      message: '密码修改成功'
    })
  } catch (error) {
    console.error('修改密码失败:', error)
    res.status(500).json({ code: 500, message: '修改密码失败' })
  }
})

// 获取系统配置
router.get('/settings', async (req, res) => {
  try {
    const settings = await Setting.find()
    const result = {}
    settings.forEach(s => {
      result[s.key] = s.value
    })
    res.json({
      code: 0,
      data: result
    })
  } catch (error) {
    res.status(500).json({ code: 500, message: '获取配置失败' })
  }
})

// 更新系统配置
router.post('/settings', async (req, res) => {
  try {
    const { key, value, description } = req.body

    if (!key) {
      return res.status(400).json({ code: 400, message: '缺少key参数' })
    }

    const setting = await Setting.findOneAndUpdate(
      { key },
      { value, description, updatedAt: new Date() },
      { upsert: true, new: true }
    )

    res.json({
      code: 0,
      data: setting
    })
  } catch (error) {
    res.status(500).json({ code: 500, message: '保存配置失败' })
  }
})

export default router
