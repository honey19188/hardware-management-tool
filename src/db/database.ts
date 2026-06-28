import { openDB, IDBPDatabase } from 'idb'
import { Device, DeviceCategory, ManagedCategory, ProjectCategory } from '../types/device'
import { DB_NAME, DB_VERSION, STORE_NAME, CATEGORIES_STORE, PROJECTS_STORE } from '../utils/constants'
import { seedDevices } from './seedData'

// 数据库实例
let db: IDBPDatabase | null = null

// 初始化数据库
export async function initDatabase(): Promise<IDBPDatabase> {
  if (db) return db

  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(database, oldVersion, _newVersion, transaction) {
      // 如果对象存储不存在，则创建
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('category', 'category', { unique: false })
        store.createIndex('createdAt', 'createdAt', { unique: false })
        store.createIndex('purchaseDate', 'purchaseDate', { unique: false })
        store.createIndex('name', 'name', { unique: false })
      }
      if (!database.objectStoreNames.contains(CATEGORIES_STORE)) {
        database.createObjectStore(CATEGORIES_STORE, { keyPath: 'id' })
      }
      if (!database.objectStoreNames.contains(PROJECTS_STORE)) {
        database.createObjectStore(PROJECTS_STORE, { keyPath: 'id' })
      }

      // 首次创建或版本升级时导入种子数据
      const seedStore = transaction.objectStore(STORE_NAME)
      // 升级时先清空旧数据再导入
      if (oldVersion > 0) {
        seedStore.clear()
      }
      for (const device of seedDevices) {
        seedStore.add(device)
      }
    },
  })

  return db
}

// 获取所有设备
export async function getAllDevices(): Promise<Device[]> {
  const database = await initDatabase()
  return await database.getAll(STORE_NAME)
}

// 根据ID获取设备
export async function getDeviceById(id: string): Promise<Device | undefined> {
  const database = await initDatabase()
  return await database.get(STORE_NAME, id)
}

// 添加或合并设备(同名同类别自动合并数量)
export async function addOrMergeDevice(device: Device): Promise<{ id: string; merged: boolean }> {
  const database = await initDatabase()
  const allDevices = await database.getAll(STORE_NAME)

  // 查找同名同类别设备
  const existing = allDevices.find(
    d => d.name === device.name && d.category === device.category
  )

  if (existing) {
    // 合并: 增加数量,更新时间和入库信息
    const currentQty = existing.quantity || 1
    const updated = {
      ...existing,
      quantity: currentQty + 1,
      updatedAt: new Date().toISOString(),
      // 保留最早的购买时间和最新的入库时间
      purchaseDate: existing.purchaseDate < device.purchaseDate ? existing.purchaseDate : device.purchaseDate,
      storageDate: device.storageDate > existing.storageDate ? device.storageDate : existing.storageDate,
    }
    await database.put(STORE_NAME, updated)
    return { id: existing.id, merged: true }
  } else {
    // 新设备
    await database.add(STORE_NAME, { ...device, quantity: 1 })
    return { id: device.id, merged: false }
  }
}

// 拆分设备(减少数量)
export async function splitDevice(id: string): Promise<boolean> {
  const database = await initDatabase()
  const device = await database.get(STORE_NAME, id)
  if (!device) return false

  const qty = device.quantity || 1
  if (qty <= 1) return false // 无法拆分

  device.quantity = qty - 1
  device.updatedAt = new Date().toISOString()
  await database.put(STORE_NAME, device)
  return true
}

// 更新设备
export async function updateDevice(device: Device): Promise<void> {
  const database = await initDatabase()
  await database.put(STORE_NAME, device)
}

// 删除设备
export async function deleteDevice(id: string): Promise<void> {
  const database = await initDatabase()
  await database.delete(STORE_NAME, id)
}

// 搜索设备
export async function searchDevices(query: string): Promise<Device[]> {
  const allDevices = await getAllDevices()
  const lowerQuery = query.toLowerCase()

  return allDevices.filter(device =>
    device.name.toLowerCase().includes(lowerQuery) ||
    device.id.toLowerCase().includes(lowerQuery) ||
    (device.coreModel && device.coreModel.toLowerCase().includes(lowerQuery)) ||
    (device.macAddress && device.macAddress.toLowerCase().includes(lowerQuery)) ||
    (device.manufacturer && device.manufacturer.toLowerCase().includes(lowerQuery)) ||
    (device.purpose && device.purpose.toLowerCase().includes(lowerQuery)) ||
    (device.project && device.project.toLowerCase().includes(lowerQuery))
  )
}

// 批量删除设备
export async function deleteMultipleDevices(ids: string[]): Promise<void> {
  const database = await initDatabase()
  const tx = database.transaction(STORE_NAME, 'readwrite')

  await Promise.all(ids.map(id => tx.store.delete(id)))
  await tx.done
}

// 导入数据
export async function importDevices(devices: Device[], overwrite: boolean = false): Promise<number> {
  const database = await initDatabase()
  const existingIds = await database.getAllKeys(STORE_NAME)

  let importedCount = 0

  for (const device of devices) {
    if (overwrite || !existingIds.includes(device.id)) {
      await database.put(STORE_NAME, device)
      importedCount++
    }
  }

  return importedCount
}

// 报损(标记设备损坏)
export async function reportDamaged(id: string, count: number = 1): Promise<boolean> {
  const database = await initDatabase()
  const device = await database.get(STORE_NAME, id)
  if (!device) return false

  const totalQty = device.quantity || 1
  const currentDamaged = device.damagedQuantity || 0
  const usable = totalQty - currentDamaged

  if (usable < count) return false // 可用的不够报损

  device.damagedQuantity = currentDamaged + count
  device.updatedAt = new Date().toISOString()
  await database.put(STORE_NAME, device)
  return true
}

// 修复(将损坏设备恢复为可用)
export async function repairDevice(id: string, count: number = 1): Promise<boolean> {
  const database = await initDatabase()
  const device = await database.get(STORE_NAME, id)
  if (!device) return false

  const currentDamaged = device.damagedQuantity || 0
  if (currentDamaged < count) return false // 损坏数量不够修复

  device.damagedQuantity = currentDamaged - count
  device.updatedAt = new Date().toISOString()
  await database.put(STORE_NAME, device)
  return true
}

// 清除所有设备的MAC地址
export async function clearAllMacAddresses(): Promise<number> {
  const database = await initDatabase()
  const allDevices = await database.getAll(STORE_NAME)
  let count = 0

  for (const device of allDevices) {
    if (device.macAddress) {
      device.macAddress = ''
      device.updatedAt = new Date().toISOString()
      await database.put(STORE_NAME, device)
      count++
    }
  }

  return count
}

// 获取当天某类别的设备数量
export async function getTodayDevicesByCategory(category: DeviceCategory): Promise<number> {
  const today = new Date()
  const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
  const prefix = `${category}-${dateStr}`

  const devices = await getAllDevices()
  return devices.filter(d => d.id.startsWith(prefix)).length
}

// ===== 类别管理 =====

// 获取所有自定义类别
export async function getAllCategories(): Promise<ManagedCategory[]> {
  const database = await initDatabase()
  return await database.getAll(CATEGORIES_STORE)
}

// 添加自定义类别
export async function addCategory(name: string): Promise<ManagedCategory> {
  const database = await initDatabase()
  const id = `CAT-${Date.now()}`
  const category: ManagedCategory = {
    id,
    name: name.trim(),
    createdAt: new Date().toISOString(),
  }
  await database.add(CATEGORIES_STORE, category)
  return category
}

// 重命名类别
export async function renameCategory(id: string, newName: string): Promise<void> {
  const database = await initDatabase()
  const category = await database.get(CATEGORIES_STORE, id)
  if (category) {
    category.name = newName.trim()
    await database.put(CATEGORIES_STORE, category)
  }
}

// 删除类别
export async function deleteCategory(id: string): Promise<void> {
  const database = await initDatabase()
  await database.delete(CATEGORIES_STORE, id)
}

// ===== 项目类别管理 =====

// 获取所有项目类别
export async function getAllProjects(): Promise<ProjectCategory[]> {
  const database = await initDatabase()
  return await database.getAll(PROJECTS_STORE)
}

// 添加项目类别
export async function addProject(name: string): Promise<ProjectCategory> {
  const database = await initDatabase()
  const id = `PROJ-${Date.now()}`
  const project: ProjectCategory = {
    id,
    name: name.trim(),
    createdAt: new Date().toISOString(),
  }
  await database.add(PROJECTS_STORE, project)
  return project
}

// 重命名项目类别
export async function renameProject(id: string, newName: string): Promise<void> {
  const database = await initDatabase()
  const project = await database.get(PROJECTS_STORE, id)
  if (project) {
    project.name = newName.trim()
    await database.put(PROJECTS_STORE, project)
  }
}

// 删除项目类别
export async function deleteProject(id: string): Promise<void> {
  const database = await initDatabase()
  await database.delete(PROJECTS_STORE, id)
}

// 批量设置设备项目归属（从库里挑选设备加入项目）
export async function batchSetProject(deviceIds: string[], projectName: string): Promise<void> {
  const database = await initDatabase()
  const tx = database.transaction(STORE_NAME, 'readwrite')
  for (const id of deviceIds) {
    const device = await tx.store.get(id)
    if (device) {
      device.project = projectName
      device.updatedAt = new Date().toISOString()
      await tx.store.put(device)
    }
  }
  await tx.done
}

// ===== 数据库备份/还原 =====

// 备份数据结构
export interface DatabaseBackup {
  version: string
  exportedAt: string
  deviceCount: number
  devices: Device[]
}

// 导出数据库(备份为JSON)
export async function exportDatabaseBackup(): Promise<DatabaseBackup> {
  const devices = await getAllDevices()
  return {
    version: String(DB_VERSION),
    exportedAt: new Date().toISOString(),
    deviceCount: devices.length,
    devices,
  }
}

// 导入数据库(从JSON还原)
export async function importDatabaseBackup(backup: DatabaseBackup): Promise<number> {
  const database = await initDatabase()

  // 清空现有设备数据
  const tx = database.transaction(STORE_NAME, 'readwrite')
  await tx.store.clear()
  await tx.done

  // 导入备份数据
  let importedCount = 0
  for (const device of backup.devices) {
    // 确保时间戳字段完整
    const restoredDevice: Device = {
      ...device,
      updatedAt: new Date().toISOString(),
      createdAt: device.createdAt || new Date().toISOString(),
    }
    await database.put(STORE_NAME, restoredDevice)
    importedCount++
  }

  return importedCount
}

// 下载JSON文件
export function downloadJsonFile(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// 解析JSON文件
export function parseJsonFile(file: File): Promise<DatabaseBackup> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const result = JSON.parse(e.target?.result as string)
        resolve(result as DatabaseBackup)
      } catch {
        reject(new Error('无效的 JSON 文件'))
      }
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsText(file)
  })
}