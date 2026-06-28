import { format } from 'date-fns'
import { DeviceCategory } from '../types/device'
import { getTodayDevicesByCategory } from '../db/database'

// 生成设备ID
export async function generateDeviceId(category: DeviceCategory): Promise<string> {
  const date = new Date()
  const dateStr = format(date, 'yyyyMMdd')

  // 查询当天该类别已有的设备数量
  const count = await getTodayDevicesByCategory(category)
  const sequence = String(count + 1).padStart(3, '0')

  return `${category}-${dateStr}-${sequence}`
}
