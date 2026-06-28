import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import Layout from '../components/layout/Layout'
import Button from '../components/common/Button'
import { useDeviceStore } from '../store/useDeviceStore'
import { exportDevicesToExcel, exportConfigSheet } from '../utils/excelExport'
import { DeviceCategory } from '../types/device'
import { getCategoryLabel } from '../utils/constants'
import { identifyHardwareFromDescription, AIHardwareItem } from '../utils/deepseek'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, FileSpreadsheet, RotateCcw, Save, Check, Package, Edit3, Sparkles, AlertCircle, Loader2, BrainCircuit } from 'lucide-react'

const STORAGE_PREFIX = 'configSheet_'

// 自定义项目类型
interface CustomItem {
  id: string
  name: string
  quantity: number
}

// 类别颜色映射
const CATEGORY_COLORS: Record<string, string> = {
  传感器类: '#0891b2',
  核心板类: '#7c3aed',
  通信模块类: '#0891b2',
  电源模块类: '#d97706',
  存储模块类: '#059669',
  其他: '#6b7280',
}

function getCategoryColor(cat: string): string {
  return CATEGORY_COLORS[cat] || '#6b7280'
}

function loadConfigSheets(): Record<string, { name: string; quantities: Record<string, number>; customItems?: CustomItem[] }> {
  try {
    const raw = localStorage.getItem('configSheetIndex')
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveConfigIndex(index: Record<string, { name: string; quantities: Record<string, number>; customItems?: CustomItem[] }>) {
  localStorage.setItem('configSheetIndex', JSON.stringify(index))
}

export default function ConfigSheet() {
  const { devices, loading, loadDevices } = useDeviceStore()

  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [customItems, setCustomItems] = useState<CustomItem[]>([])
  const [saved, setSaved] = useState(false)
  const showZero = true
  const [sheetName, setSheetName] = useState('')
  const [editingName, setEditingName] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)

  const [aiDescription, setAiDescription] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [aiResultItems, setAiResultItems] = useState<(AIHardwareItem & { inLibrary: boolean; matchedDeviceId?: string })[]>([])

  // 匹配 AI 结果与库中设备
  const matchAndApply = useCallback((items: AIHardwareItem[]) => {
    const matched: (AIHardwareItem & { inLibrary: boolean; matchedDeviceId?: string })[] = []
    const newQuantities: Record<string, number> = { ...quantities }
    const newCustomItems: CustomItem[] = [...customItems]

    items.forEach(item => {
      const lower = item.name.toLowerCase()
      // 尝试精确匹配设备名称或核心型号
      const found = devices.find(d =>
        d.name.toLowerCase() === lower ||
        (d.coreModel && d.coreModel.toLowerCase() === lower)
      )
      // 尝试模糊匹配（名称包含或核心型号包含）
      const fuzzy = !found ? devices.find(d =>
        d.name.toLowerCase().includes(lower) ||
        lower.includes(d.name.toLowerCase()) ||
        (d.coreModel && lower.includes(d.coreModel.toLowerCase()))
      ) : null

      const match = found || fuzzy
      if (match) {
        matched.push({ ...item, inLibrary: true, matchedDeviceId: match.id })
        const added = (newQuantities[match.id] || 0) + item.quantity
        newQuantities[match.id] = match.category === DeviceCategory.BOARD ? Math.min(added, 1) : added
      } else {
        matched.push({ ...item, inLibrary: false })
        newCustomItems.push({
          id: `ai_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: item.name,
          quantity: item.quantity,
        })
      }
    })

    setQuantities(newQuantities)
    setCustomItems(newCustomItems)
    setAiResultItems(matched)
  }, [devices, quantities, customItems])

  // Load saved quantities on mount
  useEffect(() => {
    loadDevices()
    const index = loadConfigSheets()
    const keys = Object.keys(index)
    if (keys.length > 0) {
      const latest = keys.sort().reverse()[0]
      const entry = index[latest]
      setQuantities(entry.quantities)
      setCustomItems(entry.customItems || [])
      setSheetName(entry.name)
    } else {
      setQuantities({})
      setCustomItems([])
      setSheetName('硬件配置单')
    }
  }, [loadDevices])

  // Show all devices — no category filter
  const filteredDevices = devices

  // For display: optionally hide devices with zero quantity
  const displayDevices = showZero ? filteredDevices : filteredDevices.filter(d => (quantities[d.id] || 0) > 0)

  // 合并库设备 + 自定义项目为统一显示列表
  const allRows = useMemo(() => {
    const libraryRows = displayDevices.map(device => ({
      type: 'library' as const,
      id: device.id,
      name: device.name,
      quantity: quantities[device.id] || 0,
      device,
      customName: '',
    }))
    const customRows = customItems
      .filter(item => item.name.trim())
      .map(item => ({
        type: 'custom' as const,
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        device: null as never,
        customName: item.name,
      }))
    return [...libraryRows, ...customRows]
  }, [displayDevices, quantities, customItems])

  // Update single quantity
  const updateQuantity = useCallback((id: string, value: string) => {
    const num = parseInt(value, 10)
    const device = devices.find(d => d.id === id)
    const capped = device?.category === DeviceCategory.BOARD ? Math.min(num, 1) : num
    setQuantities(prev => ({
      ...prev,
      [id]: isNaN(capped) || capped < 0 ? 0 : capped,
    }))
    setSaved(false)
  }, [devices])

  // Custom item handlers
  const addCustomItem = () => {
    const newItem: CustomItem = {
      id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: '',
      quantity: 1,
    }
    setCustomItems(prev => [...prev, newItem])
    setSaved(false)
  }

  // AI 解析
  const handleAiParse = async () => {
    if (!aiDescription.trim()) return
    setAiLoading(true)
    setAiError('')
    setAiResultItems([])
    try {
      const items = await identifyHardwareFromDescription(aiDescription.trim())
      matchAndApply(items)
    } catch (err: any) {
      setAiError(err.message || '解析失败')
    } finally {
      setAiLoading(false)
    }
  }

  const clearAiResults = () => {
    setAiResultItems([])
    setAiError('')
  }

  const updateCustomItem = (id: string, field: 'name' | 'quantity', value: string) => {
    setCustomItems(prev => prev.map(item =>
      item.id === id
        ? {
            ...item,
            [field]: field === 'quantity' ? (parseInt(value) || 0) : value,
          }
        : item
    ))
    setSaved(false)
  }

  const removeCustomItem = (id: string) => {
    setCustomItems(prev => prev.filter(item => item.id !== id))
    setSaved(false)
  }

  // Save to localStorage
  const saveQuantities = useCallback(() => {
    const id = `config_${Date.now()}`
    const index = loadConfigSheets()
    // Remove old entries (keep max 5)
    const keys = Object.keys(index).sort()
    while (keys.length >= 5) {
      const oldKey = keys.shift()!
      localStorage.removeItem(STORAGE_PREFIX + oldKey)
      delete index[oldKey]
    }
    index[id] = { name: sheetName || '硬件配置单', quantities, customItems }
    saveConfigIndex(index)
    localStorage.setItem(STORAGE_PREFIX + id, JSON.stringify({ quantities, customItems }))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [quantities, sheetName, customItems])

  // Reset all quantities
  const resetQuantities = useCallback(() => {
    setQuantities({})
    const index = loadConfigSheets()
    const keys = Object.keys(index)
    keys.forEach(k => localStorage.removeItem(STORAGE_PREFIX + k))
    localStorage.removeItem('configSheetIndex')
  }, [])

  // Export with quantities
  const handleExport = useCallback(async (mode: 'simple' | 'grouped') => {
    saveQuantities()
    if (mode === 'grouped') {
      await exportConfigSheet(devices, quantities, sheetName || '硬件配置单', customItems)
    } else {
      await exportDevicesToExcel(devices, quantities, customItems)
    }
  }, [devices, quantities, saveQuantities, sheetName, customItems])

  // Stats
  const stats = useMemo(() => {
    const totalTypes = allRows.length
    const totalQty = allRows.reduce((s, row) => s + row.quantity, 0)
    const filledTypes = allRows.filter(row => row.quantity > 0).length
    return { totalTypes, totalQty, filledTypes }
  }, [allRows])

  // History: load a previous config
  const [showHistory, setShowHistory] = useState(false)
  const savedSheets = useMemo(() => {
    const index = loadConfigSheets()
    return Object.entries(index)
      .map(([id, entry]) => ({ id, ...entry }))
      .sort((a, b) => b.id.localeCompare(a.id))
  }, [saved])

  const loadSheet = (id: string) => {
    const index = loadConfigSheets()
    const entry = index[id]
    if (entry) {
      setQuantities(entry.quantities)
      setCustomItems(entry.customItems || [])
      setSheetName(entry.name)
      setShowHistory(false)
    }
  }

  const startEditingName = () => {
    setEditingName(true)
    setTimeout(() => nameInputRef.current?.select(), 0)
  }

  return (
    <Layout>
      <div className="space-y-4">
        {/* 标题与操作栏 */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-primary-600" />
              <span className="sr-only">配置单</span>
            </h2>
            <div className="flex items-center gap-2 mt-1">
              {editingName ? (
                <input
                  ref={nameInputRef}
                  type="text"
                  value={sheetName}
                  onChange={(e) => setSheetName(e.target.value)}
                  onBlur={() => setEditingName(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setEditingName(false)}
                  className="text-lg font-bold text-gray-800 bg-white border border-gray-300 rounded-lg px-2 py-1 w-48 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  autoFocus
                />
              ) : (
                <button
                  onClick={startEditingName}
                  className="group flex items-center gap-1.5 text-lg font-bold text-gray-800 hover:text-primary-600 transition-colors"
                >
                  {sheetName || '硬件配置单'}
                  <Edit3 className="w-3.5 h-3.5 text-gray-300 group-hover:text-primary-400 transition-colors" />
                </button>
              )}
              <p className="text-sm text-gray-500 ml-2 hidden sm:block">填写所需数量后导出为Excel采购清单</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {savedSheets.length > 0 && (
              <div className="relative">
                <Button variant="ghost" size="sm" onClick={() => setShowHistory(!showHistory)}>
                  <FileSpreadsheet className="w-4 h-4" />
                  历史({savedSheets.length})
                </Button>
                {showHistory && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowHistory(false)} />
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 z-20 py-1 max-h-60 overflow-y-auto">
                      {savedSheets.map(s => (
                        <button
                          key={s.id}
                          onClick={() => loadSheet(s.id)}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                        >
                          <div className="font-medium text-gray-800 truncate">{s.name}</div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {Object.values(s.quantities).filter(v => v > 0).length + (s.customItems || []).filter(i => i.quantity > 0 && i.name.trim()).length} 项 · 共 {
                              Object.values(s.quantities).reduce((a, b) => a + b, 0) + (s.customItems || []).reduce((a, i) => a + i.quantity, 0)
                            } 件
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={resetQuantities}>
              <RotateCcw className="w-4 h-4" />
              重置
            </Button>
            <Button variant="ghost" size="sm" onClick={saveQuantities}>
              <Save className="w-4 h-4" />
              {saved ? '已保存' : '保存'}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => handleExport('simple')}>
              <Download className="w-4 h-4" />
              导出清单
            </Button>
            <Button variant="primary" size="sm" onClick={() => handleExport('grouped')}>
              <FileSpreadsheet className="w-4 h-4" />
              导出配置单
            </Button>
          </div>
        </div>

        {/* 统计信息卡 */}
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-4"
        >
          {[
            { label: '设备种类', value: stats.totalTypes, color: 'text-blue-600', bg: 'bg-blue-50', icon: '📦' },
            { label: '已填写数量', value: stats.filledTypes, color: 'text-green-600', bg: 'bg-green-50', icon: '✓' },
            { label: '合计需求', value: stats.totalQty, color: 'text-accent-600', bg: 'bg-accent-50', icon: '∑' },
          ].map((s, i) => (
            <div key={i} className={`stat-card ${s.bg}`}>
              <div className="px-5 py-4 flex items-center justify-between">
                <div>
                  <span className="text-gray-500 text-xs font-medium">{s.label}</span>
                  <div className="text-xs text-gray-400 mt-0.5">{s.icon} 当前</div>
                </div>
                <span className={`text-2xl font-bold ${s.color}`}>{s.value}</span>
              </div>
            </div>
          ))}
        </motion.div>

        {/* AI 解析 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-primary-600" />
              AI 识别硬件
              <span className="text-xs font-normal text-gray-400">输入项目描述，自动识别所需硬件</span>
            </h3>
            {aiResultItems.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAiResults}>
                清除结果
              </Button>
            )}
          </div>
          <div className="p-4 space-y-3">
            <textarea
              value={aiDescription}
              onChange={(e) => setAiDescription(e.target.value)}
              placeholder="描述您的项目需求，例如：做一个智能温控器，需要DHT11温湿度传感器、ESP32-S3开发板、0.96寸OLED显示屏、继电器模块控制加热器，5V电源模块供电..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              rows={3}
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAiParse}
                  disabled={aiLoading || !aiDescription.trim()}
                  className="flex items-center gap-2"
                >
                  {aiLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {aiLoading ? '解析中...' : 'AI 解析'}
                </Button>
                {aiError && (
                  <span className="flex items-center gap-1 text-xs text-red-500">
                    <AlertCircle className="w-3 h-3" />
                    {aiError}
                  </span>
                )}
              </div>
            </div>

            {/* 解析结果 */}
            <AnimatePresence>
              {aiResultItems.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-gray-100 pt-3 space-y-2"
                >
                  <p className="text-xs font-medium text-gray-500">
                    共识别 {aiResultItems.length} 项硬件
                  </p>
                  <div className="space-y-1.5">
                    {aiResultItems.map((item, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                          item.inLibrary
                            ? 'bg-green-50 border border-green-200'
                            : 'bg-red-50 border border-red-200'
                        }`}
                      >
                        <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                          item.inLibrary
                            ? 'bg-green-500 text-white'
                            : 'bg-red-500 text-white'
                        }`}>
                          {item.inLibrary ? '✓' : '!'}
                        </span>
                        <span className={`flex-1 font-medium ${
                          item.inLibrary ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {item.name}
                        </span>
                        <span className={`text-xs font-bold ${
                          item.inLibrary ? 'text-green-600' : 'text-red-600'
                        }`}>
                          x{item.quantity}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          item.inLibrary
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {item.inLibrary ? '库中已有' : '未在库中'}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* 统一设备表格（库设备 + 自定义项目） */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">
              设备清单 <span className="text-xs font-normal text-gray-400 ml-1">共 {allRows.length} 项</span>
            </h3>
            <Button variant="ghost" size="sm" onClick={addCustomItem}>
              + 添加项目
            </Button>
          </div>
          {loading ? (
            <div className="animate-pulse space-y-3 p-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-12 bg-gray-100 rounded-lg" />
              ))}
            </div>
          ) : allRows.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-600 mb-2">
                {devices.length === 0 ? '暂无设备数据' : '没有匹配的设备'}
              </h3>
              <p className="text-gray-500">
                {devices.length === 0 ? '请先在设备管理中添加设备' : '尝试添加自定义项目'}
              </p>
            </motion.div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 w-[180px]">设备ID</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">名称</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 w-[90px]">类别</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 w-[100px]">子类别</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 w-[130px]">多分类</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">核心型号</th>
                    <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600 w-[120px]">所需数量</th>
                  </tr>
                </thead>
                <tbody>
                  {allRows.map((row, index) => {
                    if (row.type === 'custom') {
                      return (
                        <motion.tr
                          key={row.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.01 }}
                          className="border-b border-red-100 bg-red-50/40 hover:bg-red-50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <span className="inline-block px-2 py-1 text-[10px] font-bold text-red-600 bg-red-100 rounded-full uppercase tracking-wider">
                              未在库中
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={row.name}
                              onChange={(e) => updateCustomItem(row.id, 'name', e.target.value)}
                              placeholder="输入硬件名称..."
                              className="w-full px-2 py-1 border border-red-300 rounded-lg text-sm text-red-800 bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-100 text-red-700">
                              自定义
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-red-400">-</td>
                          <td className="px-4 py-3 text-sm text-red-400">-</td>
                          <td className="px-4 py-3 text-sm text-red-400">-</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                min={0}
                                value={row.quantity}
                                onChange={(e) => updateCustomItem(row.id, 'quantity', e.target.value)}
                                className={`w-20 text-center px-2 py-1.5 border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-400 transition-colors ${
                                  row.quantity > 0
                                    ? 'border-red-400 bg-red-100 text-red-700'
                                    : 'border-red-200 text-red-600 bg-red-50'
                                }`}
                                placeholder="0"
                              />
                              {row.quantity > 0 && (
                                <button
                                  onClick={() => removeCustomItem(row.id)}
                                  className="p-1 text-red-300 hover:text-red-500 transition-colors"
                                  title="删除"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      )
                    }
                    // library row
                    const device = row.device
                    const qty = row.quantity
                    return (
                      <motion.tr
                        key={device.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.01 }}
                        className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                          qty > 0 ? 'bg-green-50/40' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <code className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                            {device.id}
                          </code>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-800">{device.name}</td>
                        <td className="px-4 py-3">
                          <span
                            className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: getCategoryColor(getCategoryLabel(device)) + '20',
                              color: getCategoryColor(getCategoryLabel(device)),
                            }}
                          >
                            {getCategoryLabel(device)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {device.subCategory || <span className="text-gray-300">-</span>}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {device.tags && device.tags.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {device.tags.map(tag => (
                                <span key={tag} className="inline-block px-1.5 py-0.5 text-[10px] font-medium rounded bg-accent-50 text-accent-600">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          ) : <span className="text-gray-300">-</span>}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{device.coreModel || '-'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            {device.category === DeviceCategory.BOARD ? (
                              <button
                                onClick={() => updateQuantity(device.id, qty > 0 ? '0' : '1')}
                                className={`w-20 px-2 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border ${
                                  qty > 0
                                    ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                                    : 'bg-gray-50 text-gray-400 border-gray-200 hover:border-primary-300 hover:text-primary-600'
                                }`}
                                title="核心板类仅可选择 0 或 1"
                              >
                                {qty > 0 ? '✓ 1' : '0'}
                              </button>
                            ) : (
                              <input
                                type="number"
                                min={0}
                                value={qty}
                                onChange={(e) => updateQuantity(device.id, e.target.value)}
                                className={`w-20 text-center px-2 py-1.5 border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors ${
                                  qty > 0
                                    ? 'border-primary-400 bg-primary-50 text-primary-700'
                                    : 'border-gray-300 text-gray-600'
                                }`}
                                placeholder="0"
                              />
                            )}
                            {qty > 0 && device.category !== DeviceCategory.BOARD && <Check className="w-4 h-4 text-green-500" />}
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
