import * as XLSX from 'xlsx'
import { Device } from '../types/device'
import { getCategoryLabel } from './constants'
import { format } from 'date-fns'

// 自定义项目
export interface CustomExportItem {
  name: string
  quantity: number
}

// Excel列定义
interface ExcelColumn {
  header: string
  width: number
  key: keyof Device | ((d: Device) => string)
}

// 用户指定的简化列 - 用于采购/配置清单
const columns: ExcelColumn[] = [
  { header: '设备ID', width: 26, key: 'id' },
  { header: '设备名称', width: 30, key: 'name' },
  { header: '类别', width: 14, key: (d) => getCategoryLabel(d) },
  { header: '子类别', width: 14, key: (d) => d.subCategory || '' },
  { header: '多分类', width: 20, key: (d) => (d.tags && d.tags.length > 0) ? d.tags.join('、') : '' },
  { header: '所需数量', width: 12, key: () => '' },  // 空白供用户填写
  { header: '核心型号', width: 22, key: 'coreModel' },
]

// 获取单元格值
function getCellValue(device: Device, col: ExcelColumn, quantity?: number): string {
  if (col.header === '所需数量') return quantity != null ? String(quantity) : ''
  if (typeof col.key === 'function') return col.key(device)
  const val = device[col.key]
  return val != null ? String(val) : ''
}

// 创建工作簿(含所需数量)
function createWorkbook(devices: Device[], quantities?: Record<string, number>, sheetName: string = '设备清单', customItems?: CustomExportItem[]): XLSX.WorkBook {
  const wb = XLSX.utils.book_new()

  // 准备数据行
  const headerRow = columns.map(c => c.header)
  const dataRows = devices.map(device =>
    columns.map(col => getCellValue(device, col, quantities?.[device.id]))
  )

  // 自定义项目行
  const customRows = (customItems || [])
    .filter(item => item.name.trim() && item.quantity > 0)
    .map(item => [
      '',                    // 设备ID
      item.name,             // 设备名称
      '自定义',              // 类别
      '',                    // 子类别
      '',                    // 多分类
      String(item.quantity), // 所需数量
      '',                    // 核心型号
    ])

  // 创建Sheet
  const ws = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows])

  // 设置列宽
  ws['!cols'] = columns.map(c => ({ wch: c.width }))

  // 合并左上角标题行 - 添加设备统计信息行
  const totalCount = devices.reduce((s, d) => s + (d.quantity || 1), 0)

  // 在数据上方插入统计行
  const infoRows = [
    [`硬件信息管理工具 - 配置清单`],
    [`导出时间: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}  |  设备种类: ${devices.length}  |  总数: ${totalCount}`],
    [],
  ]

  // 重新构建完整sheet
  const fullData = [
    ...infoRows,
    headerRow,
    ...dataRows,
    ...customRows,
  ]

  const ws2 = XLSX.utils.aoa_to_sheet(fullData)

  // 合并标题行
  ws2['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: columns.length - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: columns.length - 1 } },
  ]

  // 设置列宽
  ws2['!cols'] = columns.map(c => ({ wch: c.width }))

  // 添加到工作簿
  XLSX.utils.book_append_sheet(wb, ws2, sheetName)

  return wb
}

// 下载工作簿
function downloadWorkbook(wb: XLSX.WorkBook, filename: string): void {
  XLSX.writeFile(wb, filename)
}

// 导出所有设备为Excel
export async function exportDevicesToExcel(devices?: Device[], quantities?: Record<string, number>, customItems?: CustomExportItem[]): Promise<void> {
  const { getAllDevices } = await import('../db/database')
  const data = devices || await getAllDevices()

  if (data.length === 0) {
    return
  }

  const wb = createWorkbook(data, quantities, undefined, customItems)
  const timestamp = format(new Date(), 'yyyyMMdd_HHmmss')
  downloadWorkbook(wb, `硬件配置清单_${timestamp}.xlsx`)
}

// 导出为配置单(按类别分sheet)
export async function exportConfigSheet(devices: Device[], quantities?: Record<string, number>, sheetName?: string, customItems?: CustomExportItem[]): Promise<void> {
  const wb = XLSX.utils.book_new()
  const q = quantities || {}
  const sheet = XLSX.utils.json_to_sheet(
    devices
      .filter(d => (q[d.id] || 0) > 0)
      .map(d => ({
        '设备ID': d.id,
        '设备名称': d.name,
        '类别': getCategoryLabel(d),
        '多分类标签': d.tags?.join('、') || '',
        '核心型号': d.coreModel || '',
        '所需数量': q[d.id] || 0,
        '厂商': d.manufacturer || '',
        '工作电压': d.workingVoltage || '',
        '用途': d.purpose || '',
        '项目': d.project || '',
        '备注': d.notes || '',
      }))
  )
  XLSX.utils.book_append_sheet(wb, sheet, '配置单')

  // 自定义项目sheet
  const validCustom = (customItems || []).filter(item => item.name.trim() && item.quantity > 0)
  if (validCustom.length > 0) {
    const customSheet = XLSX.utils.json_to_sheet(
      validCustom.map(item => ({
        '硬件描述': item.name,
        '所需数量': item.quantity,
      }))
    )
    customSheet['!cols'] = [{ wch: 40 }, { wch: 12 }]
    XLSX.utils.book_append_sheet(wb, customSheet, '自定义项目')
  }

  const title = sheetName || '硬件配置单'
  XLSX.writeFile(wb, `${title}_${format(new Date(), 'yyyyMMdd')}.xlsx`)
}

// 导出选中设备为配置单
export async function exportSelectedAsConfig(deviceIds: string[]): Promise<void> {
  const { getAllDevices } = await import('../db/database')
  const allDevices = await getAllDevices()
  const selected = allDevices.filter(d => deviceIds.includes(d.id))
  await exportConfigSheet(selected)
}
