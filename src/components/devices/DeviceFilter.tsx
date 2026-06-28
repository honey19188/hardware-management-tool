import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CATEGORY_NESTED_GROUPS } from '../../utils/constants'
import { Filter, X } from 'lucide-react'

interface DeviceFilterProps {
  currentFilter: string
  onFilterChange: (filter: string) => void
  customCategories?: string[]
}

export default function DeviceFilter({ currentFilter, onFilterChange, customCategories = [] }: DeviceFilterProps) {
  const [open, setOpen] = useState(false)

  const isActive = (key: string) => currentFilter === key

  const handleFilter = (key: string) => {
    onFilterChange(key)
    setOpen(false)
  }

  return (
    <div className="relative">
      {/* 漏斗按钮 */}
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
          currentFilter !== 'ALL' || open
            ? 'bg-primary-600 text-white shadow-md'
            : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 hover:border-gray-300'
        }`}
      >
        <Filter className={`w-4 h-4 ${currentFilter !== 'ALL' ? 'text-white' : 'text-primary-600'}`} />
        {currentFilter !== 'ALL' && (
          <span className="text-xs">{currentFilter}</span>
        )}
      </button>

      {/* 筛选面板 */}
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.96 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="absolute right-0 top-full mt-2 z-20 w-[340px] bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden"
            >
              {/* 头部 */}
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                <span className="text-sm font-semibold text-gray-700">筛选设备</span>
                <button onClick={() => setOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 max-h-[60vh] overflow-y-auto">
                {/* 全部设备 */}
                <button
                  onClick={() => handleFilter('ALL')}
                  className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 mb-2 ${
                    isActive('ALL')
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  全部设备
                </button>

                {/* 自定义类别 */}
                {customCategories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {customCategories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => handleFilter(cat)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                          isActive(cat)
                            ? 'bg-primary-600 text-white shadow-sm'
                            : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}

                {/* 分隔线 */}
                <div className="my-2 border-t border-gray-100" />

                {/* 按父类别分组 — 全部展开 */}
                <div className="space-y-1">
                  {Object.entries(CATEGORY_NESTED_GROUPS).map(([parentLabel, subGroups]) => (
                    <div key={parentLabel} className="rounded-lg overflow-hidden">
                      <div className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-primary-700 bg-primary-50">
                        <span>▾</span>
                        <span>{parentLabel}</span>
                      </div>

                      <div className="pl-5 pr-2 pb-2 space-y-1 border-l-2 border-primary-100 ml-4">
                        {subGroups.map(sg => {
                          const sgKey = sg.groupLabel || `nogroup-${parentLabel}`
                          return (
                            <div key={sgKey}>
                              {sg.groupLabel ? (
                                <>
                                  <div className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium text-gray-700 bg-gray-50">
                                    <span>▾</span>
                                    <span>{sg.groupLabel}</span>
                                    <span className="ml-auto text-gray-300 text-[10px] bg-gray-100 px-1.5 py-0.5 rounded-full">
                                      {sg.items.length}
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5 pl-4 pt-1 pb-1.5">
                                    {sg.items.map(flat => (
                                      <button
                                        key={flat.label}
                                        onClick={() => handleFilter(flat.label)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                                          isActive(flat.label)
                                            ? 'bg-primary-600 text-white shadow-sm'
                                            : 'bg-white text-gray-600 hover:bg-primary-50 hover:text-primary-700 border border-gray-200 hover:border-primary-300'
                                        }`}
                                      >
                                        {flat.label}
                                      </button>
                                    ))}
                                  </div>
                                </>
                              ) : (
                                <div className="flex flex-wrap gap-1.5 pl-2 pt-1">
                                  {sg.items.map(flat => (
                                    <button
                                      key={flat.label}
                                      onClick={() => handleFilter(flat.label)}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                                        isActive(flat.label)
                                          ? 'bg-primary-600 text-white shadow-sm'
                                          : 'bg-white text-gray-600 hover:bg-primary-50 hover:text-primary-700 border border-gray-200 hover:border-primary-300'
                                      }`}
                                    >
                                      {flat.label}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
