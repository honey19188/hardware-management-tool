import { ReactNode } from 'react'
import Header from './Header'
import Toast from '../common/Toast'
import Modal from '../common/Modal'
import { useState, useRef, useEffect } from 'react'
import Button from '../common/Button'
import AdvancedPanel from './AdvancedPanel'
import { readAndImportFile } from '../../utils/exportImport'
import { useDeviceStore } from '../../store/useDeviceStore'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [overwrite, setOverwrite] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { loadDevices, addToast } = useDeviceStore()

  // 监听"打开高级面板"事件(从 SmartDeviceModal 触发)
  useEffect(() => {
    const handler = () => setAdvancedOpen(true)
    window.addEventListener('open-advanced', handler)
    return () => window.removeEventListener('open-advanced', handler)
  }, [])

  const handleImport = async () => {
    if (!fileInputRef.current?.files?.[0]) {
      addToast('warning', '请选择文件')
      return
    }

    try {
      const file = fileInputRef.current.files[0]
      const count = await readAndImportFile(file, overwrite)
      await loadDevices()
      addToast('success', `成功导入${count}台设备`)
      setImportModalOpen(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : '导入失败')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header
        onImportClick={() => setImportModalOpen(true)}
        onAdvancedClick={() => setAdvancedOpen(true)}
      />
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
      <Toast />

      <AdvancedPanel isOpen={advancedOpen} onClose={() => setAdvancedOpen(false)} />

      <Modal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        title="导入设备数据"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择JSON文件
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={overwrite}
              onChange={(e) => setOverwrite(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label className="text-sm text-gray-700">
              覆盖已存在的设备
            </label>
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setImportModalOpen(false)}>
              取消
            </Button>
            <Button variant="primary" onClick={handleImport}>
              导入
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
