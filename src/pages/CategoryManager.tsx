import { useEffect, useState, useCallback } from 'react'
import Layout from '../components/layout/Layout'
import Button from '../components/common/Button'
import Card from '../components/common/Card'
import Modal from '../components/common/Modal'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit3, Trash2, Tag, Layers, FolderTree, AlertTriangle } from 'lucide-react'
import { CATEGORY_NESTED_GROUPS } from '../utils/constants'
import * as db from '../db/database'
import { ManagedCategory } from '../types/device'

export default function CategoryManager() {
  const [categories, setCategories] = useState<ManagedCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [renameModalOpen, setRenameModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedCat, setSelectedCat] = useState<ManagedCategory | null>(null)
  const [newName, setNewName] = useState('')
  const [renameName, setRenameName] = useState('')
  const loadCategories = useCallback(async () => {
    setLoading(true)
    const data = await db.getAllCategories()
    setCategories(data)
    setLoading(false)
  }, [])

  useEffect(() => { loadCategories() }, [loadCategories])

  const handleAdd = async () => {
    if (!newName.trim()) return
    await db.addCategory(newName.trim())
    setNewName('')
    setAddModalOpen(false)
    await loadCategories()
  }

  const handleRename = async () => {
    if (!selectedCat || !renameName.trim()) return
    await db.renameCategory(selectedCat.id, renameName.trim())
    setRenameModalOpen(false)
    setSelectedCat(null)
    setRenameName('')
    await loadCategories()
  }

  const handleDelete = async () => {
    if (!selectedCat) return
    await db.deleteCategory(selectedCat.id)
    setDeleteModalOpen(false)
    setSelectedCat(null)
    await loadCategories()
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* 标题栏 */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Layers className="w-6 h-6 text-primary-600" />
              类别管理
            </h2>
            <p className="text-sm text-gray-500">
              浏览所有类别,管理自定义类别
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={() => {
            setNewName('')
            setAddModalOpen(true)
          }}>
            <Plus className="w-4 h-4" />
            添加类别
          </Button>
        </div>

        {/* 内置类别树 */}
        <Card hover={false}>
          <div className="flex items-center gap-3 mb-4">
            <FolderTree className="w-5 h-5 text-primary-500" />
            <span className="font-semibold text-gray-700">内置类别结构</span>
            <span className="text-xs text-gray-400">只读 · 共 {Object.keys(CATEGORY_NESTED_GROUPS).length} 个大类</span>
          </div>

          <div className="space-y-0.5">
            {Object.entries(CATEGORY_NESTED_GROUPS).map(([parentLabel, subGroups]) => {
              const totalItems = subGroups.reduce((sum, sg) => sum + sg.items.length, 0)
              return (
                <div key={parentLabel} className="rounded-lg">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700">
                    <span className="text-xs text-gray-400">▾</span>
                    <span>{parentLabel}</span>
                    <span className="ml-auto text-xs text-gray-400">{totalItems} 项</span>
                  </div>
                  <div className="pl-5 ml-1 border-l-2 border-gray-100 space-y-0.5 pb-1">
                    {subGroups.map(sg => {
                      return (
                        <div key={sg.groupLabel || `nogroup-${parentLabel}`}>
                          {sg.groupLabel ? (
                            <>
                              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium text-gray-500">
                                <span className="text-[10px] text-gray-300">▾</span>
                                <span>{sg.groupLabel}</span>
                                <span className="ml-auto text-gray-300 text-[10px]">{sg.items.length} 项</span>
                              </div>
                              <div className="flex flex-wrap gap-1.5 pl-4 pt-1 pb-1">
                                {sg.items.map(item => (
                                  <span
                                    key={item.label}
                                    className="inline-block px-2.5 py-1 rounded-md text-xs bg-gray-50 text-gray-600 border border-gray-200"
                                  >
                                    {item.label}
                                  </span>
                                ))}
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-wrap gap-1.5 pl-2 pt-1">
                              {sg.items.map(item => (
                                <span
                                  key={item.label}
                                  className="inline-block px-2.5 py-1 rounded-md text-xs bg-gray-50 text-gray-600 border border-gray-200"
                                >
                                  {item.label}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* 自定义类别 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-accent-500" />
              <h3 className="font-semibold text-gray-700">自定义类别</h3>
              <span className="text-xs text-gray-400">用于"其他"分类下的自定义选项</span>
            </div>
          </div>

          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
              <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-500 mb-1">暂无自定义类别</h3>
              <p className="text-gray-400 text-sm">点击右上角"添加类别"按钮创建</p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {categories.map((cat) => (
                  <motion.div
                    key={cat.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex items-center justify-between group hover:border-accent-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-accent-100 text-accent-600 flex items-center justify-center">
                        <Tag className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{cat.name}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(cat.createdAt).toLocaleDateString('zh-CN')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setSelectedCat(cat)
                          setRenameName(cat.name)
                          setRenameModalOpen(true)
                        }}
                        className="p-2 text-gray-400 hover:text-accent-600 hover:bg-accent-50 rounded-lg transition-colors"
                        title="重命名"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCat(cat)
                          setDeleteModalOpen(true)
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* 添加模态框 */}
        <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} title="添加自定义类别">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">类别名称</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="如: 显示模块、电机驱动"
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
        <Modal isOpen={renameModalOpen} onClose={() => setRenameModalOpen(false)} title="重命名类别">
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
                删除类别不会影响已使用该类别的设备,但新建设备时不再可用
              </p>
            </div>
            <p className="text-gray-600">
              确定要删除类别 <strong>{selectedCat?.name}</strong> 吗？
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setDeleteModalOpen(false)}>取消</Button>
              <Button variant="danger" onClick={handleDelete}>删除</Button>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  )
}
