import { useState, useEffect, useRef } from 'react'
import Modal from '../common/Modal'
import Button from '../common/Button'
import { getApiKey, setApiKey } from '../../utils/deepseek'
import { initDatabase, exportDatabaseBackup, importDatabaseBackup, downloadJsonFile, parseJsonFile } from '../../db/database'
import { Settings, Key, Database, Info, RotateCcw, Check, Eye, EyeOff, Download, Upload, AlertTriangle } from 'lucide-react'

const APP_VERSION = '1.2.0'

interface AdvancedPanelProps {
  isOpen: boolean
  onClose: () => void
}

type Tab = 'api' | 'database' | 'about'

export default function AdvancedPanel({ isOpen, onClose }: AdvancedPanelProps) {
  const [tab, setTab] = useState<Tab>('api')
  const [apiKey, setApiKeyState] = useState(getApiKey())
  const [showKey, setShowKey] = useState(false)
  const [keySaved, setKeySaved] = useState(false)
  const [dbStats, setDbStats] = useState({ deviceCount: 0, dbSize: '0 KB', version: 1 })
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [exporting, setExporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setApiKeyState(getApiKey())
      loadDbStats()
    }
  }, [isOpen])

  const loadDbStats = async () => {
    try {
      const db = await initDatabase()
      const tx = db.transaction('devices', 'readonly')
      const count = await tx.store.count()
      setDbStats({
        deviceCount: count,
        dbSize: '—',
        version: db.name ? 1 : 1,
      })
    } catch {
      setDbStats({ deviceCount: 0, dbSize: '0 KB', version: 1 })
    }
  }

  const handleSaveKey = () => {
    setApiKey(apiKey)
    setKeySaved(true)
    setTimeout(() => setKeySaved(false), 2000)
  }

  const handleResetApp = async () => {
    if (!window.confirm('确定要重置应用数据吗？这将清除所有设备数据，此操作不可撤销！')) return
    if (!window.confirm('再次确认：所有设备数据将被永久删除！')) return
    try {
      const database = await initDatabase()
      // 使用事务逐项删除(避免idb.clear潜在的兼容性问题)
      const tx = database.transaction('devices', 'readwrite')
      const store = tx.store
      const allKeys = await store.getAllKeys()
      for (const key of allKeys) {
        await store.delete(key)
      }
      await tx.done

      const catTx = database.transaction('categories', 'readwrite')
      await catTx.store.clear()
      await catTx.done

      // 仅清除配置单相关localStorage,保留API Key
      localStorage.removeItem('configSheetIndex')
      const configKeys = Object.keys(localStorage).filter(k => k.startsWith('configSheet_'))
      configKeys.forEach(k => localStorage.removeItem(k))

      window.location.reload()
    } catch (err) {
      alert('重置失败：' + (err as Error).message)
    }
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'api', label: 'API 配置', icon: <Key className="w-4 h-4" /> },
    { key: 'database', label: '数据管理', icon: <Database className="w-4 h-4" /> },
    { key: 'about', label: '关于', icon: <Info className="w-4 h-4" /> },
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="高级" size="md">
      {/* 标签页导航 */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 ${
              tab === t.key
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* API 配置 */}
      {tab === 'api' && (
        <div className="space-y-5">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-primary-50 border border-primary-100">
            <Settings className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-primary-800">
              <p className="font-medium mb-0.5">DeepSeek API Key</p>
              <p className="text-primary-600 text-xs">
                🔒 Key 仅存储在本地浏览器 localStorage 中，不会上传到任何其他服务器
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKeyState(e.target.value)}
                placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="primary" onClick={handleSaveKey} disabled={!apiKey.trim()}>
              {keySaved ? <><Check className="w-4 h-4" /> 已保存</> : '保存 Key'}
            </Button>
            <a
              href="https://platform.deepseek.com"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-xs text-primary-600 hover:text-primary-700 underline self-center"
            >
              获取 API Key →
            </a>
          </div>

          <div className="text-xs text-gray-400 border-t border-gray-100 pt-3">
            <p>Key 状态: {apiKey ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}` : '未配置'}</p>
          </div>
        </div>
      )}

      {/* 数据管理 */}
      {tab === 'database' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
              <div className="text-xs text-gray-500 mb-1">设备总数</div>
              <div className="text-2xl font-bold text-gray-800">{dbStats.deviceCount}</div>
            </div>
            <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
              <div className="text-xs text-gray-500 mb-1">数据库版本</div>
              <div className="text-2xl font-bold text-gray-800">{dbStats.version}</div>
            </div>
          </div>

          {/* 备份与还原 */}
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <h4 className="text-sm font-medium text-gray-700">备份与还原</h4>

            {/* 导入状态提示 */}
            {importStatus && (
              <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm ${
                importStatus.type === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {importStatus.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                {importStatus.msg}
              </div>
            )}

            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-white">
              <div className="text-sm">
                <span className="font-medium text-gray-700">导出备份</span>
                <p className="text-xs text-gray-500 mt-0.5">将所有设备数据导出为 JSON 备份文件</p>
              </div>
              <Button variant="primary" size="sm" disabled={exporting} onClick={async () => {
                setExporting(true)
                try {
                  const backup = await exportDatabaseBackup()
                  const filename = `硬件管理备份_${new Date().toISOString().slice(0, 10)}.json`
                  downloadJsonFile(backup, filename)
                  setImportStatus({ type: 'success', msg: `已导出 ${backup.deviceCount} 个设备` })
                  setTimeout(() => setImportStatus(null), 3000)
                } catch {
                  setImportStatus({ type: 'error', msg: '导出失败' })
                }
                setExporting(false)
              }}>
                <Download className="w-4 h-4" />
                导出
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-white">
              <div className="text-sm">
                <span className="font-medium text-gray-700">导入备份</span>
                <p className="text-xs text-gray-500 mt-0.5">从 JSON 备份文件恢复设备数据（将覆盖当前数据）</p>
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    try {
                      const backup = await parseJsonFile(file)
                      if (!backup.devices || !Array.isArray(backup.devices)) {
                        setImportStatus({ type: 'error', msg: '无效的备份文件格式' })
                        return
                      }
                      const count = await importDatabaseBackup(backup)
                      setImportStatus({ type: 'success', msg: `成功导入 ${count} 个设备` })
                      loadDbStats()
                    } catch (err) {
                      setImportStatus({ type: 'error', msg: (err as Error).message || '导入失败' })
                    }
                    if (fileInputRef.current) fileInputRef.current.value = ''
                    setTimeout(() => setImportStatus(null), 4000)
                  }}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4" />
                  导入
                </Button>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-3">
            <h4 className="text-sm font-medium text-gray-700">危险操作</h4>
            <div className="flex items-center justify-between p-3 rounded-lg border border-red-200 bg-red-50">
              <div className="text-sm">
                <span className="font-medium text-red-700">重置所有数据</span>
                <p className="text-xs text-red-500 mt-0.5">清除所有设备、类别和配置数据</p>
              </div>
              <Button variant="danger" size="sm" onClick={handleResetApp}>
                <RotateCcw className="w-4 h-4" />
                重置
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 关于 */}
      {tab === 'about' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200">
            <Settings className="w-8 h-8 text-primary-500" />
            <div>
              <h3 className="font-semibold text-gray-800">硬件信息管理工具</h3>
              <p className="text-xs text-gray-500">v{APP_VERSION}</p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl border border-gray-200 divide-y divide-gray-200 text-sm">
            <div className="flex px-4 py-2.5">
              <span className="text-gray-500 w-28">技术栈</span>
              <span className="text-gray-700">React + TypeScript + Vite + Tailwind CSS</span>
            </div>
            <div className="flex px-4 py-2.5">
              <span className="text-gray-500 w-28">数据库</span>
              <span className="text-gray-700">IndexedDB (Dexie.js)</span>
            </div>
            <div className="flex px-4 py-2.5">
              <span className="text-gray-500 w-28">AI 识别</span>
              <span className="text-gray-700">DeepSeek Chat API</span>
            </div>
            <div className="flex px-4 py-2.5">
              <span className="text-gray-500 w-28">内置类别</span>
              <span className="text-gray-700">{/* count from constants */}140+ 个子类别</span>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
