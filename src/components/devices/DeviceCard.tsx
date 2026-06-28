import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Device } from '../../types/device'
import { getCategoryLabel, INTERFACE_CONFIG } from '../../utils/constants'
import { Trash2, Eye, AlertTriangle, Box, HardDrive, Zap, Radio, Package as PackageIcon, Cpu as Chip } from 'lucide-react'

interface DeviceCardProps {
  device: Device
  onDelete: (id: string) => void
  index?: number
}

// 类别对应的顶部渐变条颜色
const categoryGradients: Record<string, string> = {
  '传感器类': 'from-sky-400 to-sky-500',
  '核心板类': 'from-violet-400 to-violet-500',
  '通信模块类': 'from-cyan-400 to-cyan-500',
  '执行器类': 'from-orange-400 to-orange-500',
  '电源模块类': 'from-amber-400 to-amber-500',
  '存储模块类': 'from-emerald-400 to-emerald-500',
  '灯模块类': 'from-rose-400 to-rose-500',
  '连接器类': 'from-teal-400 to-teal-500',
  '其他': 'from-gray-400 to-gray-500',
}

const categoryBadgeColors: Record<string, string> = {
  '传感器类': 'bg-sky-50 text-sky-700 border-sky-200',
  '核心板类': 'bg-violet-50 text-violet-700 border-violet-200',
  '通信模块类': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  '电源模块类': 'bg-amber-50 text-amber-700 border-amber-200',
  '存储模块类': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  '灯模块类': 'bg-rose-50 text-rose-700 border-rose-200',
  '执行器类': 'bg-orange-50 text-orange-700 border-orange-200',
  '连接器类': 'bg-teal-50 text-teal-700 border-teal-200',
  '其他': 'bg-gray-100 text-gray-700 border-gray-200',
}

export default function DeviceCard({ device, onDelete, index = 0 }: DeviceCardProps) {
  const qty = device.quantity || 1
  const damaged = device.damagedQuantity || 0
  const outOfStock = !device.quantity || device.quantity <= 0
  const allDamaged = outOfStock && device.damagedQuantity && device.damagedQuantity > 0
  const catLabel = getCategoryLabel(device)
  const gradient = categoryGradients[catLabel] || 'from-gray-400 to-gray-500'
  const badgeColor = categoryBadgeColors[catLabel] || 'bg-gray-100 text-gray-700 border-gray-200'

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={{ y: -6 }}
      className={`group relative bg-white rounded-xl border shadow-sm
                 hover:shadow-xl hover:shadow-gray-200/60 transition-all duration-300 ease-out overflow-hidden ${
                   outOfStock
                     ? 'border-red-200 bg-red-50/30 hover:border-red-300 hover:shadow-red-200/40'
                     : 'border-gray-100 hover:border-primary-100'
                 }`}
    >
      {/* 顶部渐变装饰条 */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient} opacity-80`} />

      {/* 悬浮发光效果 */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none
                      bg-gradient-to-br from-primary-50/30 via-transparent to-transparent" />

      <div className="relative p-5">
        {/* 顶部行：类别 + 数量 + 损坏 */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${badgeColor} transition-colors`}>
              <Box className="w-3 h-3" />
              {catLabel}
            </span>
            {outOfStock && !allDamaged && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-600 text-white text-xs font-bold border border-red-700 shadow-sm shadow-red-300/50 animate-pulse">
                <AlertTriangle className="w-3 h-3" />
                缺货
              </span>
            )}
            {outOfStock && allDamaged && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-600 text-white text-xs font-bold border border-red-700 shadow-sm shadow-red-300/50 animate-pulse">
                <AlertTriangle className="w-3 h-3" />
                全部损坏
              </span>
            )}
            {qty > 1 && (
              <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full bg-gradient-to-br from-accent-500 to-accent-600 text-white text-xs font-bold shadow-sm shadow-accent-200/50">
                ×{qty}
              </span>
            )}
            {damaged > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-xs font-medium">
                <AlertTriangle className="w-3 h-3" />
                {damaged}损坏
              </span>
            )}
            {device.shelfNumber && (
              <span className="text-xs text-gray-400 ml-auto">
                货架: {device.shelfNumber}
              </span>
            )}
          </div>
        </div>

        {/* 多分类标签 */}
        {device.tags && device.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2.5">
            {device.tags.map(tag => (
              <span key={tag} className="inline-block px-2 py-0.5 text-[10px] font-medium rounded-full bg-accent-50/70 text-accent-600 border border-accent-200/70">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* 设备名称 */}
        <h3 className="text-base font-semibold text-gray-800 mb-2 line-clamp-2 group-hover:text-primary-700 transition-colors duration-200">
          {device.name}
        </h3>

        {/* 信息区域 */}
        <div className="mb-4">
          <p className="font-mono text-xs text-gray-400 bg-gray-50 rounded-md px-2 py-1 inline-block mb-2">{device.id}</p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            {device.coreModel && (
              <p className="flex items-center gap-1.5 text-sm text-gray-500 min-w-0">
                <Chip className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="font-medium text-gray-600 shrink-0">型号:</span>
                <span className="truncate">{device.coreModel}</span>
              </p>
            )}
            {device.manufacturer && (
              <p className="flex items-center gap-1.5 text-sm text-gray-500 min-w-0">
                <span className="font-medium text-gray-600 shrink-0">厂家:</span>
                <span className="truncate">{device.manufacturer}</span>
              </p>
            )}
            {device.workingVoltage && (
              <p className="flex items-center gap-1.5 text-sm text-gray-500 min-w-0">
                <Zap className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="font-medium text-gray-600 shrink-0">电压:</span>
                <span className="truncate">{device.workingVoltage}</span>
              </p>
            )}
            {device.powerConsumption && (
              <p className="flex items-center gap-1.5 text-sm text-gray-500 min-w-0">
                <span className="font-medium text-gray-600 shrink-0">功耗:</span>
                <span className="truncate">{device.powerConsumption}</span>
              </p>
            )}
            {device.firmwareVersion && (
              <p className="flex items-center gap-1.5 text-sm text-gray-500 min-w-0 col-span-2">
                <Radio className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="font-medium text-gray-600 shrink-0">固件:</span>
                <span className="truncate">{device.firmwareVersion}</span>
              </p>
            )}
            {device.storageCapacity && (
              <p className="flex items-center gap-1.5 text-sm text-gray-500 min-w-0">
                <HardDrive className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="font-medium text-gray-600 shrink-0">存储:</span>
                <span className="truncate">{device.storageCapacity}</span>
              </p>
            )}
            {device.package && (
              <p className="flex items-center gap-1.5 text-sm text-gray-500 min-w-0">
                <PackageIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="font-medium text-gray-600 shrink-0">封装:</span>
                <span className="truncate">{device.package}</span>
              </p>
            )}
            {device.purpose && (
              <p className="flex items-center gap-1.5 text-sm text-gray-500 min-w-0 col-span-2">
                <span className="font-medium text-gray-600 shrink-0">用途:</span>
                <span className="truncate">{device.purpose}</span>
              </p>
            )}
            {device.project && (
              <p className="flex items-center gap-1.5 text-sm text-gray-500 min-w-0 col-span-2">
                <span className="font-medium text-gray-600 shrink-0">项目:</span>
                <span className="truncate">{device.project}</span>
              </p>
            )}
          </div>
        </div>

        {/* 接口类型 */}
        {device.interfaces && device.interfaces.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2.5">
            {device.interfaces.map(iface => (
              <span key={iface} className="inline-block px-1.5 py-0.5 text-[10px] font-medium rounded bg-gray-100 text-gray-500 border border-gray-200">
                {INTERFACE_CONFIG[iface]?.label || iface}
              </span>
            ))}
          </div>
        )}

        {/* 备注 */}
        {device.notes && (
          <p className="text-xs text-gray-400 italic border-t border-gray-100 pt-2.5 mb-4 leading-relaxed line-clamp-2">
            {device.notes}
          </p>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-2 pt-2 border-t border-gray-50">
          <Link
            to={`/devices/${device.id}`}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all duration-150"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">查看详情</span>
          </Link>
          <button
            onClick={() => onDelete(device.id)}
            className="flex items-center justify-center px-4 py-2 text-xs font-medium text-red-600 bg-red-50/50 hover:bg-red-100 rounded-lg transition-all duration-150"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
