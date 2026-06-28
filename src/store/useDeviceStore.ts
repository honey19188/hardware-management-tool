import { create } from 'zustand'
import { Device, ToastMessage } from '../types/device'
import * as db from '../db/database'
import { nanoid } from 'nanoid'
import { TOAST_DURATION } from '../utils/constants'

interface DeviceStore {
  // 状态
  devices: Device[]
  currentFilter: string
  searchQuery: string
  loading: boolean
  error: string | null
  toasts: ToastMessage[]
  selectedDevices: string[]

  // 操作
  loadDevices: () => Promise<void>
  addDevice: (device: Device) => Promise<void>
  splitDevice: (id: string) => Promise<void>
  reportDamaged: (id: string, count?: number) => Promise<void>
  repairDevice: (id: string, count?: number) => Promise<void>
  updateDevice: (device: Device) => Promise<void>
  deleteDevice: (id: string) => Promise<void>
  deleteMultipleDevices: (ids: string[]) => Promise<void>
  batchSetProject: (deviceIds: string[], projectName: string) => Promise<void>
  setFilter: (filter: string) => void
  setSearchQuery: (query: string) => void
  searchDevices: (query: string) => Promise<void>
  selectDevice: (id: string) => void
  unselectDevice: (id: string) => void
  clearSelection: () => void
  addToast: (type: ToastMessage['type'], message: string, duration?: number) => void
  removeToast: (id: string) => void
  clearError: () => void
}

export const useDeviceStore = create<DeviceStore>((set, get) => ({
  // 初始状态
  devices: [],
  currentFilter: 'ALL',
  searchQuery: '',
  loading: false,
  error: null,
  toasts: [],
  selectedDevices: [],

  // 加载所有设备
  loadDevices: async () => {
    set({ loading: true, error: null })
    try {
      const devices = await db.getAllDevices()
      set({ devices, loading: false })
    } catch (error) {
      set({ error: '加载设备列表失败', loading: false })
      get().addToast('error', '加载设备列表失败')
    }
  },

  // 添加设备(自动合并同名同类别)
  addDevice: async (device: Device) => {
    set({ loading: true, error: null })
    try {
      const result = await db.addOrMergeDevice(device)
      const devices = await db.getAllDevices()
      set({ devices, loading: false })
      if (result.merged) {
        get().addToast('success', '已自动合并到同名设备,数量+1')
      } else {
        get().addToast('success', '设备添加成功')
      }
    } catch (error) {
      set({ error: '添加设备失败', loading: false })
      get().addToast('error', '添加设备失败')
    }
  },

  // 拆分设备(减少数量)
  splitDevice: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const success = await db.splitDevice(id)
      if (success) {
        const devices = await db.getAllDevices()
        set({ devices, loading: false })
        get().addToast('success', '已拆分一个设备')
      } else {
        set({ loading: false })
        get().addToast('warning', '该设备数量已是1,无法再拆分')
      }
    } catch (error) {
      set({ error: '拆分设备失败', loading: false })
      get().addToast('error', '拆分设备失败')
    }
  },

  // 报损设备
  reportDamaged: async (id: string, count: number = 1) => {
    set({ loading: true, error: null })
    try {
      const success = await db.reportDamaged(id, count)
      const devices = await db.getAllDevices()
      set({ devices, loading: false })
      if (success) {
        get().addToast('warning', `已报损 ${count} 台设备`)
      } else {
        get().addToast('error', '报损失败,可用数量不足')
      }
    } catch (error) {
      set({ error: '报损失败', loading: false })
      get().addToast('error', '报损失败')
    }
  },

  // 修复设备
  repairDevice: async (id: string, count: number = 1) => {
    set({ loading: true, error: null })
    try {
      const success = await db.repairDevice(id, count)
      const devices = await db.getAllDevices()
      set({ devices, loading: false })
      if (success) {
        get().addToast('success', `已修复 ${count} 台设备`)
      } else {
        get().addToast('error', '修复失败,无损坏设备可修复')
      }
    } catch (error) {
      set({ error: '修复失败', loading: false })
      get().addToast('error', '修复失败')
    }
  },

  // 更新设备
  updateDevice: async (device: Device) => {
    set({ loading: true, error: null })
    try {
      await db.updateDevice(device)
      const devices = await db.getAllDevices()
      set({ devices, loading: false })
      get().addToast('success', '设备更新成功')
    } catch (error) {
      set({ error: '更新设备失败', loading: false })
      get().addToast('error', '更新设备失败')
    }
  },

  // 删除设备
  deleteDevice: async (id: string) => {
    set({ loading: true, error: null })
    try {
      await db.deleteDevice(id)
      const devices = await db.getAllDevices()
      set({ devices, loading: false })
      get().addToast('success', '设备删除成功')
    } catch (error) {
      set({ error: '删除设备失败', loading: false })
      get().addToast('error', '删除设备失败')
    }
  },

  // 批量删除设备
  deleteMultipleDevices: async (ids: string[]) => {
    set({ loading: true, error: null })
    try {
      await db.deleteMultipleDevices(ids)
      const devices = await db.getAllDevices()
      set({ devices, loading: false, selectedDevices: [] })
      get().addToast('success', `成功删除${ids.length}台设备`)
    } catch (error) {
      set({ error: '批量删除失败', loading: false })
      get().addToast('error', '批量删除失败')
    }
  },

  // 批量设置设备项目归属
  batchSetProject: async (deviceIds: string[], projectName: string) => {
    set({ loading: true, error: null })
    try {
      await db.batchSetProject(deviceIds, projectName)
      const devices = await db.getAllDevices()
      set({ devices, loading: false })
      get().addToast('success', `已将 ${deviceIds.length} 台设备归入「${projectName}」项目`)
    } catch (error) {
      set({ error: '批量设置项目失败', loading: false })
      get().addToast('error', '批量设置项目失败')
    }
  },

  // 设置筛选
  setFilter: (filter: string) => {
    set({ currentFilter: filter })
  },

  // 设置搜索查询
  setSearchQuery: (query: string) => {
    set({ searchQuery: query })
  },

  // 搜索设备
  searchDevices: async (query: string) => {
    set({ loading: true, searchQuery: query, error: null })
    try {
      const devices = query.trim() ? await db.searchDevices(query) : await db.getAllDevices()
      set({ devices, loading: false })
    } catch (error) {
      set({ error: '搜索失败', loading: false })
      get().addToast('error', '搜索失败')
    }
  },

  // 选择设备
  selectDevice: (id: string) => {
    const selected = get().selectedDevices
    if (!selected.includes(id)) {
      set({ selectedDevices: [...selected, id] })
    }
  },

  // 取消选择设备
  unselectDevice: (id: string) => {
    const selected = get().selectedDevices
    set({ selectedDevices: selected.filter(s => s !== id) })
  },

  // 清除选择
  clearSelection: () => {
    set({ selectedDevices: [] })
  },

  // 添加Toast消息
  addToast: (type: ToastMessage['type'], message: string, duration?: number) => {
    const id = nanoid()
    const toast: ToastMessage = {
      id,
      type,
      message,
      duration: duration || TOAST_DURATION,
    }

    set({ toasts: [...get().toasts, toast] })

    // 自动移除
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        get().removeToast(id)
      }, toast.duration)
    }
  },

  // 移除Toast消息
  removeToast: (id: string) => {
    set({ toasts: get().toasts.filter(t => t.id !== id) })
  },

  // 清除错误
  clearError: () => {
    set({ error: null })
  },
}))