// 同步初始数据到 MongoDB - 简化版
import Quiz from './src/models/Quiz.js'
import mongoose from 'mongoose'

const quizzes = [
  {
    code: 'mbti',
    name: 'MBTI人格测试',
    description: '28题 · 了解你的性格类型',
    price: 19.9,
    icon: '🎯',
    color: '#FFE5E5',
    category: 'psychology',
    questionCount: 28,
    questions: [
      { dimension: 'EI', content: '当你参加聚会时，你通常会：', options: [{ text: '主动和陌生人聊天，结交新朋友', e: 1 }, { text: '和熟悉的朋友待在一起', i: 1 }] },
      { dimension: 'EI', content: '在空闲时间，你更愿意：', options: [{ text: '参加社交活动', e: 1 }, { text: '独自安静地待着', i: 1 }] },
      { dimension: 'SN', content: '在做决定时，你更倾向于：', options: [{ text: '基于逻辑和分析', s: 1 }, { text: '基于直觉和想象', n: 1 }] },
      { dimension: 'SN', content: '你更喜欢哪种学习方式：', options: [{ text: '学习具体的技能和知识', s: 1 }, { text: '探索理论和概念', n: 1 }] },
      { dimension: 'TF', content: '当你与他人发生冲突时，你更看重：', options: [{ text: '维护和谐的关系', f: 1 }, { text: '坚持自己的原则', t: 1 }] },
      { dimension: 'TF', content: '你更容易被什么打动：', options: [{ text: '感人的故事', f: 1 }, { text: '有力的论据', t: 1 }] },
      { dimension: 'JP', content: '你更倾向于：', options: [{ text: '按计划行事', j: 1 }, { text: "随遇而安", p: 1 }] },
      { dimension: 'JP', content: '你如何看待最后期限：', options: [{ text: '提前完成', j: 1 }, { text: '最后一刻完成', p: 1 }] }
    ],
    results: {
      types: [
        { name: 'INTJ', desc: '独立思考者，擅长战略规划', detail: 'INTJ型的人被称为"建筑师"，他们具有战略性思维，善于制定长期计划。\n\n性格特点：\n- 独立自主，喜欢独自思考问题\n- 追求效率和逻辑性\n- 对知识有强烈的渴望\n- 善于发现问题并寻找解决方案\n\n职业建议：\n- 科学家\n- 工程师\n- 战略规划师\n- 金融分析师', careers: ['科学家', '工程师', '战略规划师', '金融分析师'] },
        { name: 'INTP', desc: '逻辑思考者，喜欢理论探索', detail: 'INTP型的人被称为"逻辑学家"，他们热爱思考，善于分析复杂问题。', careers: ['哲学家', '程序员', '研究员'] },
        { name: 'ENTJ', desc: '领导者，擅长组织和指挥', detail: 'ENTJ型的人被称为"指挥官"，他们天生具有领导才能。', careers: ['企业高管', '律师', '创业者'] },
        { name: 'ENTP', desc: '辩论家，喜欢智识碰撞', detail: 'ENTP型的人被称为"辩论家"，他们善于表达和辩论。', careers: ['律师', '记者', '顾问'] },
        { name: 'INFJ', desc: '提倡者，追求意义和价值', detail: 'INFJ型的人被称为"提倡者"，他们理想主义且富有同理心。', careers: ['心理咨询师', '作家', '教师'] },
        { name: 'INFP', desc: '调停者，追求内心和谐', detail: 'INFP型的人被称为"调停者"，他们敏感且富有创造力。', careers: ['艺术家', '作家', '心理咨询师'] },
        { name: 'ENFJ', desc: '主人公，天生的领导者', detail: 'ENFJ型的人被称为"主人公"，他们热情且有感染力。', careers: ['教师', '培训师', '销售'] },
        { name: 'ENFP', desc: '竞选者，充满热情和创意', detail: 'ENFP型的人被称为"竞选者"，他们充满活力和想象力。', careers: ['记者', '演员', '营销'] },
        { name: 'ISTJ', desc: '物流师，务实可靠', detail: 'ISTJ型的人被称为"物流师"，他们踏实可靠，值得信赖。', careers: ['会计', '审计', '管理员'] },
        { name: 'ISFJ', desc: '守卫者，忠诚体贴', detail: 'ISFJ型的人被称为"守卫者"，他们温柔细心，富有责任感。', careers: ['护士', '教师', '文员'] },
        { name: 'ESTJ', desc: '总经理，善于组织管理', detail: 'ESTJ型的人被称为"总经理"，他们善于组织和执行。', careers: ['管理者', '军官', '法官'] },
        { name: 'ESFJ', desc: '执政官，关注他人需求', detail: 'ESFJ型的人被称为"执政官"，他们热情且乐于助人。', sales: ['护士', '教师', 'HR'] },
        { name: 'ISTP', desc: '鉴赏家，灵活务实', detail: 'ISTP型的人被称为"鉴赏家"，他们善于动手操作。', careers: ['工程师', '机械师', '飞行员'] },
        { name: 'ISFP', desc: '探险家，灵活变通', detail: 'ISFP型的人被称为"探险家"，他们敏感且善于观察。', careers: ['设计师', '艺术家', '厨师'] },
        { name: 'ESTP', desc: '企业家，行动派', detail: 'ESTP型的人被称为"企业家"，他们大胆且善于谈判。', careers: ['销售', '企业家', '经纪人'] },
        { name: 'ESFP', desc: '表演者，充满活力', detail: 'ESFP型的人被称为"表演者"，他们热情且善于表达。', careers: ['演员', '主持人', '销售'] }
      ]
    },
    status: 1
  },
  {
    code: 'age',
    name: '心理年龄测试',
    description: '8题 · 探索你的心理年龄',
    price: 9.9,
    icon: '🧠',
    color: '#E5F0FF',
    category: 'psychology',
    questionCount: 8,
    questions: [
      { content: '你对待新事物的态度是？', options: [{ text: '充满好奇，积极尝试', age: 0 }, { text: '需要时间适应', age: 3 }, { text: '有些抗拒', age: 5 }] },
      { content: '当你遇到问题时，你会？', options: [{ text: '主动寻求解决方案', age: 0 }, { text: '先观察一段时间', age: 3 }, { text: '等待他人帮助', age: 5 }] },
      { content: '你的周末通常怎么度过？', options: [{ text: '学习新知识或技能', age: 0 }, { text: '休闲娱乐', age: 3 }, { text: '在家休息', age: 5 }] },
      { content: '你对未来的规划是？', options: [{ text: '有详细的长期规划', age: 0 }, { text: '大致方向', age: 3 }, { text: '走一步看一步', age: 5 }] }
    ],
    results: {
      ranges: [
        { name: '童年期', min: 0, max: 12, desc: '你拥有一颗童心，对世界充满好奇。', detail: '你的心理年龄保持在童年期，这意味着你拥有一颗纯真的心，对生活充满热情和好奇心。你善于发现生活中的美好，享受简单的快乐。' },
        { name: '青年期', min: 13, max: 25, desc: '你充满活力，心态年轻。', detail: '你的心理年龄在青年期，你保持着积极向上的心态，对未来充满期待。你敢于尝试新事物，具有创新精神。' },
        { name: '中年期', min: 26, max: 40, desc: '你成熟稳重，心态平和。', detail: '你的心理年龄在中年期，你已经建立了稳定的人生观和价值观。你成熟稳重，能够理性地处理问题。' },
        { name: '老年期', min: 41, max: 100, desc: '你智慧从容，淡定自若。', detail: '你的心理年龄在老年期，你拥有丰富的人生经验和智慧。你从容淡定，对很多事情都看得很开。' }
      ]
    },
    status: 1
  },
  {
    code: 'color',
    name: '性格色彩测试',
    description: '15题 · 发现你的性格底色',
    price: 12.9,
    icon: '🎨',
    color: '#FFF4E5',
    category: 'psychology',
    questionCount: 15,
    questions: [
      { content: '在社交场合，你通常？', options: [{ text: '成为焦点，活跃气氛', red: 2 }, { text: '观察他人，适度参与', blue: 1 }, { text: '跟随朋友行动', yellow: 1 }, { text: '安静地待着', green: 1 }] },
      { content: '面对压力时，你会？', options: [{ text: '积极应对，寻求突破', red: 2 }, { text: '冷静分析，寻找根源', blue: 1 }, { text: '向朋友倾诉', yellow: 1 }, { text: '独自承受', green: 1 }] },
      { content: '你更喜欢哪种工作方式？', options: [{ text: '有挑战性的任务', red: 2 }, { text: '有条理的工作', blue: 2 }, { text: '团队合作', yellow: 1 }, { text: '独立完成', green: 1 }] },
      { content: '你如何做决定？', options: [{ text: '快速果断', red: 2 }, { text: '深思熟虑', blue: 2 }, { text: '听取大家意见', yellow: 1 }, { text: '随缘', green: 1 }] }
    ],
    results: {
      types: [
        { color: 'red', name: '红色性格', desc: '热情奔放，积极进取', detail: '红色性格的人充满活力和热情。他们行动力强，喜欢成为焦点，具有很强的领导力和感染力。', strengths: ['行动力强', '充满热情', '具有领导力', '感染力强'] },
        { color: 'blue', name: '蓝色性格', desc: '理性冷静，追求完美', detail: '蓝色性格的人理性稳重，善于思考。他们追求完美，注重细节，具有很强的分析和规划能力。', strengths: ['理性稳重', '善于思考', '注重细节', '规划能力强'] },
        { color: 'yellow', name: '黄色性格', desc: '乐观开朗，人缘好', detail: '黄色性格的人乐观积极，善于交际。他们喜欢与人相处，具有很强的社交能力和创造力。', strengths: ['乐观积极', '善于交际', '创造力强', '人缘好'] },
        { color: 'green', name: '绿色性格', desc: '温和包容，与世无争', detail: '绿色性格的人温和善良，追求和谐。他们善于倾听，具有很强的包容心和适应能力。', strengths: ['温和善良', '善于倾听', '包容心强', '适应力强'] }
      ]
    },
    status: 1
  },
  {
    code: 'career',
    name: '职业性格测试',
    description: '20题 · 找到适合你的职业方向',
    price: 19.9,
    icon: '💼',
    color: '#E5FFE5',
    category: 'career',
    questionCount: 20,
    questions: [
      { dimension: 'R', content: '你更喜欢哪种工作环境？', options: [{ text: '户外实践', r: 2 }, { text: '室内办公', r: 0 }, { text: '灵活多变', r: 1 }] },
      { dimension: 'I', content: '面对问题时，你倾向于？', options: [{ text: '自己研究解决', i: 2 }, { text: '请教他人', i: 0 }, { text: '综合考虑', i: 1 }] },
      { dimension: 'S', content: '你希望工作中有更多？', options: [{ text: '与人互动', s: 2 }, { text: '独立完成', s: 0 }, { text: '平衡两者', s: 1 }] },
      { dimension: 'E', content: '你愿意承担领导责任吗？', options: [{ text: '非常愿意', e: 2 }, { text: '看情况', e: 1 }, { text: '不太愿意', e: 0 }] }
    ],
    results: {
      types: [
        { name: '实际型', desc: '喜欢动手操作，务实踏实', detail: '你是一个务实的人，喜欢通过实际操作来完成任务。你适合从事需要动手能力的工作。', careers: ['工程师', '技术员', '机械师', '程序员'] },
        { name: '研究型', desc: '喜欢分析和研究问题', detail: '你善于思考和分析问题，喜欢探索未知领域。你适合从事科研类工作。', careers: ['科学家', '研究员', '数据分析师', '医生'] },
        { name: '社会型', desc: '喜欢帮助他人，人际交往能力强', detail: '你善于与人沟通，喜欢帮助他人。你适合从事教育、医疗、服务类工作。', careers: ['教师', '护士', '心理咨询师', '销售'] },
        { name: '企业型', desc: '有领导力，追求成就', detail: '你具有领导才能，追求事业成功。你适合从事管理类、创业类工作。', careers: ['企业管理者', '创业者', '律师', '政治家'] },
        { name: '艺术型', desc: '有创造力，追求个性表达', detail: '你富有创造力，喜欢自由表达。你适合从事艺术、设计、创作类工作。', careers: ['设计师', '作家', '艺术家', '音乐家'] },
        { name: '常规型', desc: '喜欢有条理的工作', detail: '你善于组织和规划，喜欢按部就班的工作。你适合从事行政、财务类工作。', careers: ['会计', '审计', '行政人员', 'HR'] }
      ]
    },
    status: 1
  },
  {
    code: 'eq',
    name: 'EQ情商测试',
    description: '15题 · 了解你的情商水平',
    price: 14.9,
    icon: '🧡',
    color: '#FFE5E0',
    category: 'psychology',
    questionCount: 15,
    questions: [
      { content: '当你生气时，你会？', options: [{ text: '冷静后再说', eq: 2 }, { text: '直接发泄', eq: 0 }, { text: '压抑情绪', eq: 1 }] },
      { content: '面对失败，你会？', options: [{ text: '总结经验，继续努力', eq: 2 }, { text: '感到沮丧', eq: 0 }, { text: '逃避问题', eq: 0 }] },
      { content: '你经常赞美他人吗？', options: [{ text: '经常', eq: 2 }, { text: '偶尔', eq: 1 }, { text: '很少', eq: 0 }] },
      { content: '当你与他人意见不合时？', options: [{ text: '尊重对方，寻求共识', eq: 2 }, { text: "坚持自己观点", eq: 1}, { text: '发生冲突', eq: 0 }] }
    ],
    results: {
      ranges: [
        { name: '高情商', min: 40, max: 60, desc: '你情商很高！', detail: '你能够很好地管理自己的情绪，理解他人的感受，在人际交往中游刃有余。' },
        { name: '中等情商', min: 20, max: 39, desc: '你情商中等，还有提升空间', detail: '你具备基本的情商能力，但在情绪管理和人际关系方面还有提升空间。' },
        { name: '情商待提升', min: 0, max: 19, desc: '建议你多关注情商培养', detail: '建议你在情绪管理、同理心培养等方面多加练习，提高情商水平。' }
      ]
    },
    status: 1
  },
  {
    code: 'star',
    name: '星座测试',
    description: '12题 · 探索你的星座性格',
    price: 9.9,
    icon: '⭐',
    color: '#F0E5FF',
    category: 'fengshui',
    questionCount: 12,
    questions: [
      { content: '你的生日月份是？', options: [{ text: '1-3月', star: '水象' }, { text: '4-6月', star: '土象' }, { text: '7-9月', star: '火象' }, { text: '10-12月', star: '风象' }] },
      { content: '你更喜欢？', options: [{ text: '领导他人', star: '火象' }, { text: '稳定可靠', star: '土象' }, { text: '自由表达', star: '风象' }, { text: '情感深刻', star: '水象' }] }
    ],
    results: {
      types: [
        { star: '白羊', name: '白羊座', desc: '热情冲动，充满活力', detail: '白羊座的人充满热情和活力，行动力强，喜欢挑战。' },
        { star: '金牛', name: '金牛座', desc: '稳重务实，追求稳定', detail: '金牛座的人稳重务实，追求稳定的生活和爱情。' },
        { star: '双子', name: '双子座', desc: '聪明多变，善于沟通', detail: '双子座的人聪明机智，善于表达，喜欢新鲜事物。' },
        { star: '巨蟹', name: '巨蟹座', desc: "情感丰富，重视家庭", detail: '巨蟹座的人情感细腻，非常重视家庭和亲情。' },
        { star: '狮子', name: '狮子座', desc: '自信领导，喜欢被关注', detail: '狮子座的人自信满满，喜欢成为焦点，具有领导才能。' },
        { star: '处女', name: '处女座', desc: '追求完美，注重细节', detail: '处女座的人追求完美，注重细节，善于分析。' },
        { star: '天秤', name: '天秤座', desc: '追求平衡，善于社交', detail: '天秤座的人追求和谐，善于社交，注重外表。' },
        { star: '天蝎', name: '天蝎座', desc: '深情执着，占有欲强', detail: '天蝎座的人深沉执着，情感丰富，占有欲强。' },
        { star: '射手', name: '射手座', desc: '热爱自由，乐观开朗', detail: '射手座的人热爱自由，乐观开朗，喜欢旅行。' },
        { star: '摩羯', name: '摩羯座', desc: '踏实稳重，有责任感', detail: '摩羯座的人踏实稳重，有强烈的责任感和事业心。' },
        { star: '水瓶', name: '水瓶座', desc: '独立创新，追求独特', detail: '水瓶座的人独立思考，追求独特和创新。' },
        { star: '双鱼', name: '双鱼座', desc: '浪漫敏感，富有想象力', detail: '双鱼座的人浪漫敏感，富有想象力和同情心。' }
      ]
    },
    status: 1
  }
]

async function syncToMongoDB() {
  try {
    await mongoose.connect('mongodb://localhost:27017/psychology-test')
    console.log('✅ MongoDB 连接成功')

    // 清空旧数据
    await Quiz.deleteMany({})
    console.log('🗑️ 已清空旧数据')

    // 插入新数据
    for (const quiz of quizzes) {
      await Quiz.findOneAndUpdate(
        { code: quiz.code },
        quiz,
        { upsert: true }
      )
      console.log(`✅ 已同步: ${quiz.name}`)
    }

    console.log(`\n🎉 全部 ${quizzes.length} 个测试已同步到数据库！`)

    const count = await Quiz.countDocuments()
    console.log(`📊 数据库中共有 ${count} 个测试`)

    process.exit(0)
  } catch (error) {
    console.error('❌ 同步失败:', error.message)
    process.exit(1)
  }
}

syncToMongoDB()
