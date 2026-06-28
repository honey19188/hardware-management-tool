import { CATEGORY_FLAT, PARENT_CATEGORY_LABEL } from './constants'

const API_URL = 'https://api.deepseek.com/v1/chat/completions'
const API_KEY_STORAGE_KEY = 'deepseek_api_key'

// 全部的父类别+子类别标签文本，供 AI 参考
function buildCategoryContext(): string {
  const parentMap: Record<string, string[]> = {}
  for (const flat of CATEGORY_FLAT) {
    const parent = PARENT_CATEGORY_LABEL[flat.parentCategory] || flat.parentCategory
    if (!parentMap[parent]) parentMap[parent] = []
    parentMap[parent].push(flat.label)
  }
  return Object.entries(parentMap)
    .map(([parent, children]) => `  ${parent}: ${children.join('、')}`)
    .join('\n')
}

const SYSTEM_PROMPT = `你是一个专业的电子硬件设备识别助手。根据用户提供的设备名称或型号，识别出该硬件的详细信息。

以下是可用的类别和子类别列表(请从中选择最匹配的):

${buildCategoryContext()}

请严格返回 JSON 格式，不要包含 markdown 代码块标记:
{
  "name": "设备名称(如用户未提供则根据型号生成合理的名称)",
  "category": "父类别名称(如"传感器类"、"核心板类")",
  "subCategory": "子类别名称(从上方列表中选取最匹配的)",
  "tags": ["额外归属的子类别名称(如有多个归属可选，没有则空数组)"],
  "coreModel": "核心型号/芯片型号",
  "manufacturer": "生产厂家(不确定则填空字符串)",
  "workingVoltage": "工作电压(不确定则填空字符串)",
  "purpose": "用途(不确定则填空字符串)",
  "project": "可能适用的项目(不确定则填空字符串)",
  "notes": "其他补充说明(不确定则填空字符串)"
}`

export function getApiKey(): string {
  return localStorage.getItem(API_KEY_STORAGE_KEY) || ''
}

export function setApiKey(key: string): void {
  localStorage.setItem(API_KEY_STORAGE_KEY, key)
}

export interface IdentifyResult {
  name: string
  category: string
  subCategory: string
  tags: string[]
  coreModel: string
  manufacturer: string
  workingVoltage: string
  purpose: string
  project: string
  notes: string
}

export async function identifyDevice(deviceName: string): Promise<IdentifyResult> {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error('请先配置 DeepSeek API Key')
  }

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `请识别这个设备: ${deviceName}` },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    }),
  })

  if (!res.ok) {
    const errBody = await res.text()
    throw new Error(`API请求失败 (${res.status}): ${errBody}`)
  }

  const data = await res.json()
  const raw = data.choices?.[0]?.message?.content || ''

  // 尝试提取 JSON
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('AI 返回格式异常，无法解析')
  }

  const result: IdentifyResult = JSON.parse(jsonMatch[0])

  // 验证必需字段
  if (!result.name && !result.subCategory) {
    throw new Error('AI 未能识别出有效设备信息')
  }

  return result
}

// === 配置单 AI 解析 ===

export interface AIHardwareItem {
  name: string
  quantity: number
}

const CONFIG_AI_PROMPT = `你是一个硬件工程师助手。用户会提供简单的项目描述或硬件清单，请从中识别出具体需要哪些硬件模块或设备。

用户的描述可能很简单、口语化或不完整（例如"esp32 dht11做个温控器"、"用arduino控制步进电机"、"需要几个传感器"等），你要根据上下文补全和理解：

示例：
- "esp32 dht11 oled" → ESP32开发板、DHT11温湿度模块、0.96寸OLED显示屏
- "用arduino控制步进电机" → Arduino开发板、ULN2003步进电机驱动板、28BYJ-48步进电机

请以 JSON 数组格式返回（不要包含 markdown 代码块标记），每个元素包含：
{
  "name": "完整硬件名称（使用常见标准名称）",
  "quantity": 需要的数量
}

要求：
- 从碎片化描述中补全完整的硬件名称
- 只返回具体、有型号/名称的硬件设备
- 同一个硬件只出现一次，合并数量
- 名称使用常见标准名称，方便匹配库中设备
- **数量规则**：除非用户明确说"3个"、"两个"等，否则默认为 1`

export async function identifyHardwareFromDescription(description: string): Promise<AIHardwareItem[]> {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error('请先配置 DeepSeek API Key')
  }

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: CONFIG_AI_PROMPT },
        { role: 'user', content: `项目需求描述：${description}\n\n请分析以上描述，返回所需的硬件列表。` },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  })

  if (!res.ok) {
    const errBody = await res.text()
    throw new Error(`API请求失败 (${res.status}): ${errBody}`)
  }

  const data = await res.json()
  const raw = data.choices?.[0]?.message?.content || ''

  // 提取 JSON 数组
  const jsonMatch = raw.match(/\[[\s\S]*\]/)
  if (!jsonMatch) {
    throw new Error('AI 返回格式异常，无法解析')
  }

  const result: AIHardwareItem[] = JSON.parse(jsonMatch[0])

  if (!Array.isArray(result) || result.length === 0) {
    throw new Error('AI 未能从描述中识别出硬件')
  }

  // 规范化
  return result.map(item => ({
    name: item.name.trim(),
    quantity: Math.max(1, item.quantity || 1),
  }))
}
