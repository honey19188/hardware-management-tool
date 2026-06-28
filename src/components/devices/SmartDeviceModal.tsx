import { useState, useEffect } from 'react'
import Modal from '../common/Modal'
import Button from '../common/Button'
import { Sparkles, Loader2, Check, AlertCircle, ArrowRight, Settings } from 'lucide-react'
import { getApiKey, identifyDevice, IdentifyResult } from '../../utils/deepseek'
import { DeviceCategory, Device } from '../../types/device'
import { PARENT_CATEGORY_LABEL, CATEGORY_FLAT } from '../../utils/constants'
import { format } from 'date-fns'

// 中文父类别 → DeviceCategory 映射
function parseCategory(chinese: string): DeviceCategory {
  const entry = Object.entries(PARENT_CATEGORY_LABEL).find(([, label]) => label === chinese)
  return entry ? (entry[0] as DeviceCategory) : DeviceCategory.OTHER
}

interface SmartDeviceModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (data: Partial<Device>) => void
  onOpenAdvanced: () => void
}

export default function SmartDeviceModal({ isOpen, onClose, onConfirm, onOpenAdvanced }: SmartDeviceModalProps) {
  const [deviceInput, setDeviceInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<IdentifyResult | null>(null)

  useEffect(() => {
    if (isOpen) {
      setDeviceInput('')
      setError('')
      setResult(null)
    }
  }, [isOpen])

  const handleIdentify = async () => {
    if (!deviceInput.trim()) return
    if (!getApiKey()) {
      setError('请先在「高级 → API 配置」中设置 DeepSeek API Key')
      return
    }
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await identifyDevice(deviceInput.trim())
      setResult(res)
    } catch (err: any) {
      setError(err.message || '识别失败')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = () => {
    if (!result) return

    const category = parseCategory(result.category)
    const matchedFlat = CATEGORY_FLAT.find(f => f.label === result.subCategory)
    const actualCategory = matchedFlat?.parentCategory || category
    const tags = (result.tags || []).filter(t => t !== result.subCategory)

    const device: Partial<Device> = {
      name: result.name || deviceInput.trim(),
      category: actualCategory,
      subCategory: result.subCategory || undefined,
      tags: tags.length > 0 ? tags : undefined,
      coreModel: result.coreModel || undefined,
      manufacturer: result.manufacturer || undefined,
      workingVoltage: result.workingVoltage || undefined,
      purpose: result.purpose || undefined,
      project: result.project || undefined,
      notes: result.notes || undefined,
      purchaseDate: format(new Date(), 'yyyy-MM-dd'),
      storageDate: format(new Date(), 'yyyy-MM-dd'),
    }

    onConfirm(device)
    handleClose()
  }

  const handleClose = () => {
    setDeviceInput('')
    setError('')
    setResult(null)
    onClose()
  }

  const handleOpenAdvanced = () => {
    handleClose()
    onOpenAdvanced()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="智能添加设备" size="lg">
      <div className="space-y-5">
        {/* 无 API Key 警告 */}
        {!getApiKey() && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
            <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">未配置 API Key</p>
              <p className="text-amber-600 mb-2">需要先配置 DeepSeek API Key 才能使用智能识别功能</p>
              <button
                type="button"
                onClick={handleOpenAdvanced}
                className="inline-flex items-center gap-1 text-amber-700 font-medium underline hover:text-amber-800"
              >
                <Settings className="w-3.5 h-3.5" />
                前往「高级 → API 配置」
              </button>
            </div>
          </div>
        )}

        {/* 输入设备信息 */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-accent-50 border border-accent-200">
          <Sparkles className="w-5 h-5 text-accent-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-accent-800">
            <p className="font-medium mb-1">输入设备型号或名称</p>
            <p className="text-accent-600">
              支持输入芯片型号、模块名称、开发板型号等，AI 会自动识别并填充详细信息
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={deviceInput}
            onChange={(e) => setDeviceInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleIdentify()}
            placeholder="如: ESP32-S3、DHT11、STM32F103C8T6"
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            autoFocus
          />
        </div>

        {/* 快捷示例 */}
        <div className="flex flex-wrap gap-2">
          {['DHT11', 'ESP32-S3', 'STM32F103', 'WS2812B', 'CH340', 'MAX30102'].map(sample => (
            <button
              key={sample}
              type="button"
              onClick={() => setDeviceInput(sample)}
              className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-primary-100 hover:text-primary-700 transition-colors"
            >
              {sample}
            </button>
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={handleClose}>取消</Button>
          <Button variant="primary" onClick={handleIdentify} disabled={!deviceInput.trim() || loading}>
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> 识别中...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> 识别</>
            )}
          </Button>
        </div>

        {/* 识别结果 */}
        {result && (
          <div className="border-t border-gray-200 pt-4 space-y-4">
            <div className="flex items-center gap-2 text-green-600 bg-green-50 rounded-xl px-4 py-3 border border-green-200">
              <Check className="w-5 h-5" />
              <span className="text-sm font-medium">识别成功！请确认以下信息</span>
            </div>

            <div className="bg-gray-50 rounded-xl border border-gray-200 divide-y divide-gray-200 text-sm">
              <Row label="设备名称" value={result.name} />
              <Row label="父类别" value={result.category} />
              <Row label="子类别" value={result.subCategory} />
              {result.tags && result.tags.length > 0 && (
                <Row label="多分类标签" value={result.tags.join('、')} />
              )}
              <Row label="核心型号" value={result.coreModel} />
              <Row label="生产厂家" value={result.manufacturer} />
              <Row label="工作电压" value={result.workingVoltage} />
              <Row label="用途" value={result.purpose} />
              <Row label="备注" value={result.notes} />
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => { setResult(null); setDeviceInput('') }}>重新输入</Button>
              <Button variant="primary" onClick={handleConfirm}>
                <ArrowRight className="w-4 h-4" />
                添加到表单
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex px-4 py-2.5">
      <span className="text-gray-500 w-24 flex-shrink-0">{label}</span>
      <span className="text-gray-800 font-medium">{value || <span className="text-gray-300">-</span>}</span>
    </div>
  )
}
