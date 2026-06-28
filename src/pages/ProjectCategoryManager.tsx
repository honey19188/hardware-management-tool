import { useEffect, useState, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import Button from '../components/common/Button'
import Card from '../components/common/Card'
import Modal from '../components/common/Modal'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit3, Trash2, FolderKanban, FolderOpen, Package, AlertTriangle, Eye, Cpu, Search, AlertTriangle as AlertTriangleIcon } from 'lucide-react'
import { useDeviceStore } from '../store/useDeviceStore'
import * as db from '../db/database'
import { ProjectCategory, DeviceCategory, Device } from '../types/device'

export default function ProjectCategoryManager() {
  const { devices, loadDevices, batchSetProject } = useDeviceStore()
  const [projects, setProjects] = useState<ProjectCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [renameModalOpen, setRenameModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedProj, setSelectedProj] = useState<ProjectCategory | null>(null)
  const [newName, setNewName] = useState('')
  const [renameName, setRenameName] = useState('')
  const [deviceModalOpen, setDeviceModalOpen] = useState(false)
  const [viewProjectName, setViewProjectName] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerSearch, setPickerSearch] = useState('')
  const [pickerSelection, setPickerSelection] = useState<string[]>([])
  const [pickerBoardOnly, setPickerBoardOnly] = useState(false)

  // 提取设备芯片标识用于配对匹配
  const getChipId = useCallback((device: Device): string | null => {
    if (device.category !== DeviceCategory.BOARD) return null
    const text = [device.name, device.coreModel].join(' ')

    // 常见芯片型号模式
    const chipPatterns = [
      /ESP32-S3\b/i, /ESP32-C6\b/i, /ESP32-C3\b/i, /ESP32-H2\b/i,
      /ESP32\b/i, /ESP8266\b/i,
      /RTL8720\b/i,
      /STM32F103\b/i, /STM32F407\b/i, /STM32F411\b/i,
      /ATMEGA328\b/i, /ATMEGA2560\b/i,
      /XC7A35T\b/i
    ]
    for (const pattern of chipPatterns) {
      const m = text.match(pattern)
      if (m) return m[0].toUpperCase()
    }
    return null
  }, [])

  const loadProjects = useCallback(async () => {
    setLoading(true)
    const data = await db.getAllProjects()
    setProjects(data)
    setLoading(false)
  }, [])

  useEffect(() => { loadProjects(); loadDevices() }, [loadProjects, loadDevices])

  const handleAdd = async () => {
    if (!newName.trim()) return
    await db.addProject(newName.trim())
    setNewName('')
    setAddModalOpen(false)
    await loadProjects()
  }

  const handleRename = async () => {
    if (!selectedProj || !renameName.trim()) return
    await db.renameProject(selectedProj.id, renameName.trim())
    setRenameModalOpen(false)
    setSelectedProj(null)
    setRenameName('')
    await loadProjects()
  }

  const handleDelete = async () => {
    if (!selectedProj) return
    await db.deleteProject(selectedProj.id)
    setDeleteModalOpen(false)
    setSelectedProj(null)
    await loadProjects()
  }

  // 统计每个项目下的设备数量
  const projectDeviceCounts: Record<string, number> = {}
  const projectBoardCounts: Record<string, number> = {}
  for (const d of devices) {
    if (d.project) {
      projectDeviceCounts[d.project] = (projectDeviceCounts[d.project] || 0) + 1
      if (d.category === DeviceCategory.BOARD) {
        projectBoardCounts[d.project] = (projectBoardCounts[d.project] || 0) + 1
      }
    }
  }

  // 可供挑选的设备（不在当前查看项目中,不检查库存）
  const availableDevices = useMemo(() => {
    if (!viewProjectName) return []
    const search = pickerSearch.toLowerCase().trim()

    // 先从项目中拆关键词用于相关性评分
    const projectKeywords = viewProjectName.toLowerCase().split(/[\/\s,_\-（）()]+/).filter(k => k.length >= 2)

    let list = devices.filter(d => {
      if (d.project === viewProjectName) return false
      if (!search) return true
      return (
        d.name.toLowerCase().includes(search) ||
        d.id.toLowerCase().includes(search) ||
        (d.coreModel && d.coreModel.toLowerCase().includes(search)) ||
        (d.subCategory && d.subCategory.toLowerCase().includes(search)) ||
        (d.shelfNumber && d.shelfNumber.toLowerCase().includes(search))
      )
    })

    // BOARD-only 模式：只显示核心板，按相关性排序
    if (pickerBoardOnly) {
      list = list
        .filter(d => d.category === DeviceCategory.BOARD)
        .map(d => {
          let score = 0
          const text = [d.name, d.coreModel, d.subCategory, ...(d.tags || [])].join(' ').toLowerCase()
          for (const kw of projectKeywords) {
            if (text.includes(kw)) score += kw.length * 2
            if (d.name.toLowerCase().includes(kw)) score += kw.length * 3
          }
          return { ...d, _relScore: score }
        })
        .sort((a, b) => (b._relScore || 0) - (a._relScore || 0)) as (Device & { _relScore?: number })[]
    }

    return list
  }, [devices, viewProjectName, pickerSearch, pickerBoardOnly])

  const handleAddFromLibrary = async () => {
    if (pickerSelection.length === 0 || !viewProjectName) return
    await batchSetProject(pickerSelection, viewProjectName)
    setPickerSelection([])
    setPickerSearch('')
    setPickerOpen(false)
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* 标题栏 */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <FolderKanban className="w-6 h-6 text-emerald-600" />
              项目类别管理
            </h2>
            <p className="text-sm text-gray-500">
              管理项目类别,方便设备按项目筛选和归类
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={() => {
            setNewName('')
            setAddModalOpen(true)
          }}>
            <Plus className="w-4 h-4" />
            添加项目
          </Button>
        </div>

        {/* 项目中使用的类别（只读统计） */}
        <Card hover={false}>
          <div className="flex items-center gap-3 mb-4">
            <FolderOpen className="w-5 h-5 text-emerald-500" />
            <span className="font-semibold text-gray-700">设备中使用的项目</span>
            <span className="text-xs text-gray-400">
              共 {Object.keys(projectDeviceCounts).length} 个项目
            </span>
          </div>

          {Object.keys(projectDeviceCounts).length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">暂无设备关联项目</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {Object.entries(projectDeviceCounts)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([projectName, count]) => {
                  const boardCount = projectBoardCounts[projectName] || 0
                  const hasBoard = boardCount >= 1
                  return (
                    <button
                      key={projectName}
                      onClick={() => {
                        setViewProjectName(projectName)
                        setDeviceModalOpen(true)
                      }}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 cursor-pointer group ${
                        hasBoard
                          ? 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 hover:shadow-sm'
                          : 'bg-red-50 border-red-200 hover:bg-red-100 hover:border-red-300 hover:shadow-sm'
                      }`}
                    >
                      <FolderKanban className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                        hasBoard ? 'text-emerald-500' : 'text-red-400'
                      }`} />
                      <span className={`text-sm font-medium ${hasBoard ? 'text-emerald-800' : 'text-red-700'}`}>
                        {projectName}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        hasBoard
                          ? 'text-emerald-500 bg-emerald-100 group-hover:bg-emerald-200'
                          : 'text-red-500 bg-red-100 group-hover:bg-red-200'
                      }`}>
                        {count} 台
                      </span>
                      {!hasBoard && (
                        <span className="inline-flex items-center gap-1 text-xs text-red-500 bg-red-100 px-1.5 py-0.5 rounded-full animate-pulse">
                          <AlertTriangle className="w-3 h-3" />
                          缺核心板
                        </span>
                      )}
                    </button>
                  )
                })}
            </div>
          )}
        </Card>

        {/* 管理的项目类别 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-emerald-500" />
              <h3 className="font-semibold text-gray-700">管理的项目类别</h3>
              <span className="text-xs text-gray-400">可在此添加/编辑/删除项目类别</span>
            </div>
          </div>

          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
              <FolderKanban className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-500 mb-1">暂无项目类别</h3>
              <p className="text-gray-400 text-sm">点击右上角"添加项目"按钮创建</p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {projects.map((proj) => {
                  const usedCount = projectDeviceCounts[proj.name] || 0
                  const boardCount = projectBoardCounts[proj.name] || 0
                  const hasBoard = boardCount >= 1
                  return (
                    <motion.div
                      key={proj.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className={`rounded-lg border px-4 py-3 flex items-center justify-between group hover:shadow-sm transition-all ${
                        hasBoard
                          ? 'bg-white border-gray-200 hover:border-emerald-300'
                          : 'bg-red-50/50 border-red-200 hover:border-red-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          hasBoard ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'
                        }`}>
                          <FolderKanban className="w-4 h-4" />
                        </div>
                        <div>
                          <p className={`font-medium ${hasBoard ? 'text-gray-800' : 'text-red-800'}`}>{proj.name}</p>
                          <p className="text-xs text-gray-400">
                            创建于 {new Date(proj.createdAt).toLocaleDateString('zh-CN')}
                            {usedCount > 0 && (
                              <span className="ml-2 text-emerald-500">· {usedCount} 台设备</span>
                            )}
                            <span className={`ml-2 ${hasBoard ? 'text-emerald-500' : 'text-red-500 font-medium'}`}>
                              · 核心板 {boardCount} 台
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setViewProjectName(proj.name)
                            setDeviceModalOpen(true)
                          }}
                          className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="查看设备"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedProj(proj)
                            setRenameName(proj.name)
                            setRenameModalOpen(true)
                          }}
                          className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="重命名"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedProj(proj)
                            setDeleteModalOpen(true)
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* 添加模态框 */}
        <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} title="添加项目类别">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">项目名称</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="如: 智能家居、环境监测系统"
                autoFocus
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setAddModalOpen(false)}>取消</Button>
              <Button variant="primary" onClick={handleAdd} disabled={!newName.trim()}>添加</Button>
            </div>
          </div>
        </Modal>

        {/* 重命名模态框 */}
        <Modal isOpen={renameModalOpen} onClose={() => setRenameModalOpen(false)} title="重命名项目">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">新名称</label>
              <input
                type="text"
                value={renameName}
                onChange={(e) => setRenameName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                autoFocus
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setRenameModalOpen(false)}>取消</Button>
              <Button variant="primary" onClick={handleRename} disabled={!renameName.trim()}>保存</Button>
            </div>
          </div>
        </Modal>

        {/* 删除确认 */}
        <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="确认删除">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 rounded-lg px-4 py-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">
                删除项目类别不会影响已关联该项目的设备,但新建设备时不再可选
              </p>
            </div>
            <p className="text-gray-600">
              确定要删除项目类别 <strong>{selectedProj?.name}</strong> 吗？
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setDeleteModalOpen(false)}>取消</Button>
              <Button variant="danger" onClick={handleDelete}>删除</Button>
            </div>
          </div>
        </Modal>

        {/* 项目设备列表 */}
        <Modal
          isOpen={deviceModalOpen}
          onClose={() => setDeviceModalOpen(false)}
          title={`${viewProjectName} - 设备列表`}
        >
          <div className="space-y-3">
            {/* 核心板统计 */}
            {(() => {
              const projectDevices = devices.filter(d => d.project === viewProjectName)
              const boardCount = projectDevices.filter(d => d.category === DeviceCategory.BOARD).length
              const hasBoard = boardCount >= 1
              return (
                <div className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${
                  hasBoard ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                }`}>
                  <span className="flex items-center gap-1.5">
                    {!hasBoard && <AlertTriangle className="w-3.5 h-3.5" />}
                    核心板: {boardCount} 台 / 共 {projectDevices.length} 台设备
                  </span>
                  {!hasBoard && (
                    <span className="font-medium animate-pulse">缺少核心板</span>
                  )}
                </div>
              )
            })()}

            {/* 添加设备按钮组 */}
            <div className="flex gap-2">
              <Link
                to="/devices/add"
                state={{ smartData: { project: viewProjectName } }}
                onClick={() => setDeviceModalOpen(false)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98] transition-all duration-200 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                新建
              </Link>
              <button
                onClick={() => {
                    setPickerSelection([])
                    setPickerSearch('')
                    setPickerBoardOnly(false)
                    setPickerOpen(true)
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-white text-emerald-700 border border-emerald-300 hover:bg-emerald-50 active:scale-[0.98] transition-all duration-200"
                >
                  <Search className="w-4 h-4" />
                  挑选
              </button>
            </div>

            {/* 设备列表 */}
            <div className="max-h-[50vh] overflow-y-auto space-y-2">
              {devices
                .filter(d => d.project === viewProjectName)
                .length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Package className="w-10 h-10 mx-auto mb-2" />
                  <p className="text-sm">该项目暂无设备,点击上方按钮添加</p>
                </div>
              ) : (
                devices
                  .filter(d => d.project === viewProjectName)
                  .map((device) => {
                    const outOfStock = !device.quantity || device.quantity <= 0
                    return (
                      <Link
                        key={device.id}
                        to={`/devices/${device.id}`}
                        onClick={() => setDeviceModalOpen(false)}
                        className="block bg-white border border-gray-200 rounded-lg px-4 py-3 hover:border-emerald-300 hover:shadow-sm transition-all duration-200 group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <Cpu className="w-4 h-4 text-gray-500" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate group-hover:text-emerald-700 transition-colors">
                                {device.name}
                              </p>
                              <p className="text-xs text-gray-400 font-mono truncate">{device.id}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                            {device.subCategory && (
                              <span className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-200">
                                {device.subCategory}
                              </span>
                            )}
                            {outOfStock && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                                <AlertTriangleIcon className="w-3 h-3" />
                                缺货
                              </span>
                            )}
                            {device.shelfNumber && (
                              <span className="text-xs text-gray-400">货架:{device.shelfNumber}</span>
                            )}
                          </div>
                        </div>
                      </Link>
                    )
                  })
              )}
            </div>
          </div>
        </Modal>

        {/* 从库中挑选设备 */}
        <Modal
          isOpen={pickerOpen}
          onClose={() => { setPickerOpen(false); setPickerSelection([]); setPickerBoardOnly(false) }}
          title={`从库中挑选设备 - 加入「${viewProjectName}」`}
        >
          <div className="space-y-3">
            {/* 搜索框 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索设备名称、ID、型号、子类别、货架号..."
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* 筛选标签 */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPickerBoardOnly(false)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  !pickerBoardOnly
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-300 font-medium'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                }`}
              >
                全部设备
              </button>
              <button
                onClick={() => setPickerBoardOnly(true)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors flex items-center gap-1 ${
                  pickerBoardOnly
                    ? 'bg-indigo-100 text-indigo-700 border-indigo-300 font-medium'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                }`}
              >
                <Cpu className="w-3 h-3" />
                推荐核心板
              </button>
              {pickerBoardOnly && (
                <span className="text-xs text-gray-400">
                  按与「{viewProjectName}」相关性排序
                </span>
              )}
            </div>

            {/* 全选/取消 */}
            {availableDevices.length > 0 && (
              <div className="flex items-center justify-between text-xs text-gray-500">
                <button
                  onClick={() => {
                    if (pickerSelection.length === availableDevices.length) {
                      setPickerSelection([])
                    } else {
                      setPickerSelection(availableDevices.map(d => d.id))
                    }
                  }}
                  className="text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  {pickerSelection.length === availableDevices.length ? '取消全选' : '全选'}
                </button>
                <span>已选 {pickerSelection.length} / {availableDevices.length}</span>
              </div>
            )}

            {/* 设备列表 */}
            <div className="max-h-[40vh] overflow-y-auto space-y-1.5">
              {availableDevices.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Package className="w-10 h-10 mx-auto mb-2" />
                  <p className="text-sm">{pickerSearch ? '未找到匹配设备' : '库中暂无可用设备'}</p>
                </div>
              ) : (
                availableDevices.map(device => {
                  const isSelected = pickerSelection.includes(device.id)
                  const outOfStock = !device.quantity || device.quantity <= 0

                  // 配对逻辑
                  const chipId = getChipId(device)
                  const pairedDevice = chipId && device.category === DeviceCategory.BOARD
                    ? availableDevices.find(d =>
                        d.id !== device.id &&
                        d.category === DeviceCategory.BOARD &&
                        getChipId(d) === chipId
                      )
                    : null
                  const isPairedSelected = pairedDevice && pickerSelection.includes(pairedDevice.id)

                  return (
                    <button
                      key={device.id}
                      onClick={() => {
                        setPickerSelection(prev => {
                          let next = isSelected
                            ? prev.filter(id => id !== device.id)
                            : [...prev, device.id]
                          // 配对设备联动勾选/取消
                          if (pairedDevice) {
                            if (isSelected) {
                              // 取消时也取消配对
                              next = next.filter(id => id !== pairedDevice.id)
                            } else if (!next.includes(pairedDevice.id)) {
                              // 勾选时也勾选配对
                              next = [...next, pairedDevice.id]
                            }
                          }
                          return next
                        })
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left border transition-all duration-150 ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-300 shadow-sm'
                          : isPairedSelected
                          ? 'bg-indigo-50/50 border-indigo-200'
                          : 'bg-white border-gray-200 hover:border-emerald-200 hover:bg-gray-50'
                      }`}
                    >
                      {/* 复选框 */}
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected ? 'bg-emerald-600 border-emerald-600' : 'border-gray-300'
                      }`}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>

                      {/* 设备信息 */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-800 truncate">{device.name}</p>
                          {outOfStock && (
                            <span className="text-xs text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
                              缺货
                            </span>
                          )}
                          {(device as any)._relScore !== undefined && (device as any)._relScore > 0 && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${
                              (device as any)._relScore >= 20
                                ? 'text-indigo-500 bg-indigo-50'
                                : 'text-amber-500 bg-amber-50'
                            }`}>
                              {(device as any)._relScore >= 20 ? '高匹配' : '中匹配'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span className="font-mono">{device.id}</span>
                          {pairedDevice && (
                            <span className="inline-flex items-center gap-1 text-indigo-400 font-medium">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg>
                              配对 {pairedDevice.name}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 标签 */}
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        {device.category === DeviceCategory.BOARD && (
                          <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-medium">
                            核心板
                          </span>
                        )}
                        {device.subCategory && device.category !== DeviceCategory.BOARD && (
                          <span className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-200">
                            {device.subCategory}
                          </span>
                        )}
                        {device.shelfNumber && (
                          <span className="text-xs text-gray-400 hidden sm:inline">{device.shelfNumber}</span>
                        )}
                      </div>
                    </button>
                  )
                })
              )}
            </div>

            {/* 确认按钮 */}
            <div className="space-y-2">
              {pickerSelection.length > 0 && (() => {
                const selectedBoardCount = availableDevices.filter(d => pickerSelection.includes(d.id) && d.category === DeviceCategory.BOARD).length
                if (selectedBoardCount === 0) {
                  return (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 text-amber-700 text-xs">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      当前选中没有核心板设备，建议至少选择 1 台核心板
                    </div>
                  )
                }
                return null
              })()}
              <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
                <Button variant="ghost" onClick={() => { setPickerOpen(false); setPickerSelection([]); setPickerBoardOnly(false) }}>
                  取消
                </Button>
                <Button
                  variant="primary"
                  onClick={handleAddFromLibrary}
                  disabled={pickerSelection.length === 0}
                >
                  将 {pickerSelection.length || ''} 台设备加入项目
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  )
}
