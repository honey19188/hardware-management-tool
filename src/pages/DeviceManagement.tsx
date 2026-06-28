import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDeviceStore } from '../store/useDeviceStore'
import Layout from '../components/layout/Layout'
import DeviceCard from '../components/devices/DeviceCard'
import DeviceFilter from '../components/devices/DeviceFilter'
import SmartDeviceModal from '../components/devices/SmartDeviceModal'
import Modal from '../components/common/Modal'
import Button from '../components/common/Button'
import Card from '../components/common/Card'
import { motion } from 'framer-motion'
import { Package, Trash2, FileSpreadsheet, Sparkles, Plus } from 'lucide-react'
import { exportSelectedAsConfig } from '../utils/excelExport'
import { clearAllMacAddresses } from '../db/database'
import { DeviceCategory, Device } from '../types/device'

const MAC_CLEAR_FLAG = 'macAllClearedV1'

export default function DeviceManagement() {
  const navigate = useNavigate()
  const {
    devices,
    currentFilter,
    loading,
    loadDevices,
    setFilter,
    deleteDevice,
    deleteMultipleDevices,
    selectedDevices,
    selectDevice,
    unselectDevice,
    clearSelection,
  } = useDeviceStore()

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deviceToDelete, setDeviceToDelete] = useState<string | null>(null)
  const [smartModalOpen, setSmartModalOpen] = useState(false)

  useEffect(() => {
    const init = async () => {
      if (!localStorage.getItem(MAC_CLEAR_FLAG)) {
        const count = await clearAllMacAddresses()
        if (count > 0) {
          console.log(`已清除 ${count} 台设备的MAC地址`)
        }
        localStorage.setItem(MAC_CLEAR_FLAG, '1')
      }
      await loadDevices()
    }
    init()
  }, [loadDevices])

  const filteredDevices = currentFilter === 'ALL'
    ? devices
    : devices.filter(d =>
        // 按子类别名称或自定义类别名或标签匹配
        d.subCategory === currentFilter || d.customCategory === currentFilter || d.tags?.includes(currentFilter)
      )

  const handleDeleteClick = (id: string) => {
    setDeviceToDelete(id)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (deviceToDelete) {
      await deleteDevice(deviceToDelete)
      setDeleteModalOpen(false)
      setDeviceToDelete(null)
    }
  }

  const handleBatchDelete = async () => {
    if (selectedDevices.length > 0) {
      await deleteMultipleDevices(selectedDevices)
    }
  }

  const handleSmartConfirm = (data: Partial<Device>) => {
    navigate('/devices/add', { state: { smartData: data } })
  }

  const handleOpenAdvanced = () => {
    window.dispatchEvent(new CustomEvent('open-advanced'))
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* 操作栏 */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            共 {filteredDevices.length} 台设备
            {currentFilter !== 'ALL' && <span className="text-gray-400"> (全部 {devices.length} 台)</span>}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSmartModalOpen(true)}>
              <Sparkles className="w-4 h-4" />
              智能添加
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/devices/add')}>
              <Plus className="w-4 h-4" />
              添加设备
            </Button>
            <DeviceFilter
              currentFilter={currentFilter}
              onFilterChange={setFilter}
              customCategories={[...new Set(
                devices
                  .filter(d => d.category === DeviceCategory.OTHER && d.customCategory)
                  .map(d => d.customCategory!)
              )]}
            />
          </div>
        </div>

        {/* 批量操作 */}
        {selectedDevices.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-primary-50 border border-primary-200 rounded-lg px-4 py-3 flex items-center justify-between"
          >
            <span className="text-primary-700 font-medium">
              已选择 {selectedDevices.length} 台设备
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={clearSelection}>
                取消选择
              </Button>
              <Button variant="secondary" size="sm" onClick={() => exportSelectedAsConfig(selectedDevices)}>
                <FileSpreadsheet className="w-4 h-4" />
                生成配置单
              </Button>
              <Button variant="danger" size="sm" onClick={handleBatchDelete}>
                <Trash2 className="w-4 h-4" />
                批量删除
              </Button>
            </div>
          </motion.div>
        )}

        {/* 设备列表 */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Card key={i} hover={false}>
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : filteredDevices.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Package className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            </motion.div>
            <h3 className="text-2xl font-semibold text-gray-500 mb-3">
              {currentFilter === 'ALL' ? '暂无设备数据' : '该类别暂无设备'}
            </h3>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              {currentFilter === 'ALL'
                ? '点击下方按钮，快速添加您的第一台设备'
                : '该分类下暂无设备，试试调整筛选条件'}
            </p>
            <div className="flex gap-3 justify-center">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSmartModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-accent-500 to-accent-400 text-white shadow-lg shadow-accent-200/40 hover:shadow-xl hover:shadow-accent-200/60 active:shadow-sm transition-all duration-200"
              >
                <Sparkles className="w-4 h-4" />
                智能添加
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/devices/add')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-white text-primary-600 border border-primary-200 shadow-sm hover:bg-primary-50 hover:border-primary-300 hover:shadow-md active:shadow-sm transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                手动添加
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDevices.map((device, index) => (
              <motion.div
                key={device.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={selectedDevices.includes(device.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        selectDevice(device.id)
                      } else {
                        unselectDevice(device.id)
                      }
                    }}
                    className="absolute top-2 right-2 w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 z-10"
                  />
                  <DeviceCard device={device} onDelete={handleDeleteClick} index={index} />
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* 统计信息 */}
        {!loading && devices.length > 0 && (
          <div className="stat-card px-5 py-3 flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary-500"></span>
              <span className="text-gray-500">共</span>
              <span className="font-bold text-gray-800">{devices.length}</span>
              <span className="text-gray-500">台设备</span>
            </div>
            {currentFilter !== 'ALL' && (
              <>
                <span className="text-gray-300">|</span>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent-500"></span>
                  <span className="text-gray-500">当前显示</span>
                  <span className="font-bold text-accent-700">{filteredDevices.length}</span>
                  <span className="text-gray-500">台</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* 删除确认对话框 */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="确认删除"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            确定要删除这台设备吗?此操作不可撤销。
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setDeleteModalOpen(false)}>
              取消
            </Button>
            <Button variant="danger" onClick={handleDeleteConfirm}>
              删除
            </Button>
          </div>
        </div>
      </Modal>

      {/* 智能添加 */}
      <SmartDeviceModal
        isOpen={smartModalOpen}
        onClose={() => setSmartModalOpen(false)}
        onConfirm={handleSmartConfirm}
        onOpenAdvanced={handleOpenAdvanced}
      />
    </Layout>
  )
}