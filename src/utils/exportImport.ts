import { Device } from '../types/device'
import * as db from '../db/database'
import { format } from 'date-fns'

// 导出数据为JSON文件
export async function exportToJSON(devices?: Device[]): Promise<string> {
  const data = devices || await db.getAllDevices()
  return JSON.stringify(data, null, 2)
}

// 导出数据并下载文件
export async function downloadExportFile(devices?: Device[]): Promise<void> {
  const data = await exportToJSON(devices)
  const timestamp = format(new Date(), 'yyyyMMdd_HHmmss')
  const filename = `hardware_backup_${timestamp}.json`

  // 创建Blob并下载
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)

  URL.revokeObjectURL(url)
}

// 从JSON文件导入数据
export async function importFromJSON(jsonString: string, overwrite: boolean = false): Promise<number> {
  try {
    const devices: Device[] = JSON.parse(jsonString)

    // 验证数据格式
    if (!Array.isArray(devices)) {
      throw new Error('数据格式不正确,应为设备数组')
    }

    // 基本验证每个设备对象
    for (const device of devices) {
      if (!device.id || !device.name || !device.category || !device.purchaseDate || !device.storageDate) {
        throw new Error('设备数据缺少必填字段')
      }
    }

    return await db.importDevices(devices, overwrite)
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('JSON格式不正确')
    }
    throw error
  }
}

// 读取文件并导入
export async function readAndImportFile(file: File, overwrite: boolean = false): Promise<number> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string
        const count = await importFromJSON(content, overwrite)
        resolve(count)
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => {
      reject(new Error('文件读取失败'))
    }

    reader.readAsText(file)
  })
}
