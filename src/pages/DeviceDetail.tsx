import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import QRCode from '../components/common/QRCode'
import { Device, DeviceCategory } from '../types/device'
import { getDeviceById, deleteDevice } from '../db/database'
import { INTERFACE_CONFIG, getCategoryLabel } from '../utils/constants'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { Edit, Trash2, ArrowLeft, Calendar, Cpu, Wifi, Battery, HardDrive, Package, Radio, Layers, MinusCircle, AlertTriangle, Wrench, Lightbulb, Zap, Cable } from 'lucide-react'
import Modal from '../components/common/Modal'
import { useDeviceStore } from '../store/useDeviceStore'

const categoryIcons = {
  [DeviceCategory.SENSOR]: Radio,
  [DeviceCategory.BOARD]: Cpu,
  [DeviceCategory.COMM]: Wifi,
  [DeviceCategory.POWER]: Battery,
  [DeviceCategory.STORAGE]: HardDrive,
  [DeviceCategory.LIGHT]: Lightbulb,
  [DeviceCategory.ACTUATOR]: Zap,
  [DeviceCategory.CONNECTOR]: Cable,
  [DeviceCategory.OTHER]: Package,
}

export default function DeviceDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addToast, loadDevices, splitDevice, reportDamaged, repairDevice } = useDeviceStore()
  const [device, setDevice] = useState<Device | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [damageModalOpen, setDamageModalOpen] = useState(false)
  const [repairModalOpen, setRepairModalOpen] = useState(false)
  const [damageCount, setDamageCount] = useState(1)

  useEffect(() => {
    const loadDevice = async () => {
      if (id) {
        const deviceData = await getDeviceById(id)
        if (deviceData) {
          setDevice(deviceData)
        } else {
          navigate('/devices')
        }
      }
      setLoading(false)
    }
    loadDevice()
  }, [id, navigate])

  const handleDelete = async () => {
    if (id) {
      await deleteDevice(id)
      await loadDevices()
      addToast('success', '设备删除成功')
      navigate('/devices')
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto space-y-6">
          <Card hover={false}>
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </Card>
        </div>
      </Layout>
    )
  }

  if (!device) {
    return null
  }

  const Icon = categoryIcons[device.category]
  const qrValue = device.id

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 返回按钮和操作按钮 */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <Link
            to="/devices"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            返回列表
          </Link>

          <div className="flex gap-2 flex-wrap">
            {((device.quantity || 1) - (device.damagedQuantity || 0)) > 0 && (
              <Button variant="ghost" size="sm" onClick={() => { setDamageCount(1); setDamageModalOpen(true); }}>
                <AlertTriangle className="w-4 h-4" />
                报损
              </Button>
            )}
            {(device.damagedQuantity || 0) > 0 && (
              <Button variant="ghost" size="sm" onClick={() => { setDamageCount(1); setRepairModalOpen(true); }}>
                <Wrench className="w-4 h-4" />
                修复
              </Button>
            )}
            {(device.quantity || 1) > 1 && (
              <Button variant="ghost" size="sm" onClick={async () => {
                await splitDevice(device.id)
                const updated = await getDeviceById(device.id)
                if (updated) setDevice(updated)
              }}>
                <MinusCircle className="w-4 h-4" />
                拆分
              </Button>
            )}
            <Link to={`/devices/edit/${device.id}`}>
              <Button variant="secondary" size="sm">
                <Edit className="w-4 h-4" />
                编辑
              </Button>
            </Link>
            <Button variant="danger" size="sm" onClick={() => setDeleteModalOpen(true)}>
              <Trash2 className="w-4 h-4" />
              删除
            </Button>
          </div>
        </motion.div>

        {/* 设备基本信息 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card hover={false} padding="lg">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-xl bg-primary-100 flex items-center justify-center">
                  <Icon className="w-8 h-8 text-primary-600" />
                </div>
              </div>

              <div className="flex-grow">
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-3 py-1 text-sm font-medium rounded-full bg-primary-100 text-primary-700">
                    {getCategoryLabel(device)}
                  </span>
                  {device.subCategory && (
                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-600">
                      {device.subCategory}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-800">{device.name}</h1>
                  {(device.quantity || 1) > 1 && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent-600 text-white text-sm font-bold">
                      <Layers className="w-4 h-4" />
                      ×{device.quantity}
                    </span>
                  )}
                  {(device.damagedQuantity || 0) > 0 && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-600 text-white text-sm font-bold">
                      <AlertTriangle className="w-4 h-4" />
                      {device.damagedQuantity}损坏
                    </span>
                  )}
                </div>
                <p className="font-mono text-lg text-gray-600 mb-4">{device.id}</p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">
                      <span className="font-medium">购买:</span> {format(new Date(device.purchaseDate), 'yyyy-MM-dd')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">
                      <span className="font-medium">入库:</span> {format(new Date(device.storageDate), 'yyyy-MM-dd')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Layers className="w-4 h-4" />
                    <span className="text-sm">
                      <span className="font-medium">可用:</span>
                      <span className="font-bold text-green-600 ml-1">
                        {(device.quantity || 1) - (device.damagedQuantity || 0)}
                      </span>
                      <span className="text-gray-400 mx-1">/</span>
                      <span>{(device.quantity || 1)}</span>
                    </span>
                  </div>
                  {(device.damagedQuantity || 0) > 0 && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <span className="text-sm">
                        <span className="font-medium">损坏:</span>
                        <span className="font-bold text-red-600 ml-1">{device.damagedQuantity}</span>
                      </span>
                    </div>
                  )}
                  {device.purpose && (
                    <div className="flex items-center gap-2 text-gray-600 col-span-2">
                      <span className="text-sm">
                        <span className="font-medium">用途:</span> {device.purpose}
                      </span>
                    </div>
                  )}
                  {device.project && (
                    <div className="flex items-center gap-2 text-gray-600 col-span-2">
                      <span className="text-sm">
                        <span className="font-medium">所属项目:</span> {device.project}
                      </span>
                    </div>
                  )}
                  {device.shelfNumber && (
                    <div className="flex items-center gap-2 text-gray-600 col-span-2">
                      <span className="text-sm">
                        <span className="font-medium">货架号:</span> {device.shelfNumber}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* 二维码展示 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card hover={false} padding="lg">
            <h2 className="text-xl font-bold text-gray-800 mb-6">设备二维码</h2>
            <div className="flex justify-center">
              <QRCode
                value={qrValue}
                deviceId={device.id}
              />
            </div>
          </Card>
        </motion.div>

        {/* 硬件规格信息 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card hover={false} padding="lg">
            <h2 className="text-xl font-bold text-gray-800 mb-6">硬件规格信息</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {device.coreModel && (
                <div className="border rounded-lg px-4 py-3">
                  <p className="text-sm text-gray-500 mb-1">核心型号</p>
                  <p className="font-medium text-gray-800">{device.coreModel}</p>
                </div>
              )}

              {device.macAddress && (
                <div className="border rounded-lg px-4 py-3">
                  <p className="text-sm text-gray-500 mb-1">MAC地址</p>
                  <p className="font-mono font-medium text-gray-800">{device.macAddress}</p>
                </div>
              )}

              {device.firmwareVersion && (
                <div className="border rounded-lg px-4 py-3">
                  <p className="text-sm text-gray-500 mb-1">固件版本</p>
                  <p className="font-medium text-gray-800">{device.firmwareVersion}</p>
                </div>
              )}

              {device.storageCapacity && (
                <div className="border rounded-lg px-4 py-3">
                  <p className="text-sm text-gray-500 mb-1">存储容量</p>
                  <p className="font-medium text-gray-800">{device.storageCapacity}</p>
                </div>
              )}

              {device.workingVoltage && (
                <div className="border rounded-lg px-4 py-3">
                  <p className="text-sm text-gray-500 mb-1">工作电压</p>
                  <p className="font-medium text-gray-800">{device.workingVoltage}</p>
                </div>
              )}

              {device.powerConsumption && (
                <div className="border rounded-lg px-4 py-3">
                  <p className="text-sm text-gray-500 mb-1">功耗参数</p>
                  <p className="font-medium text-gray-800">{device.powerConsumption}</p>
                </div>
              )}

              {device.package && (
                <div className="border rounded-lg px-4 py-3">
                  <p className="text-sm text-gray-500 mb-1">封装形式</p>
                  <p className="font-medium text-gray-800">{device.package}</p>
                </div>
              )}

              {device.manufacturer && (
                <div className="border rounded-lg px-4 py-3">
                  <p className="text-sm text-gray-500 mb-1">生产厂家</p>
                  <p className="font-medium text-gray-800">{device.manufacturer}</p>
                </div>
              )}
            </div>

            {device.interfaces && device.interfaces.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-2">接口类型</p>
                <div className="flex flex-wrap gap-2">
                  {device.interfaces.map(interfaceType => (
                    <span
                      key={interfaceType}
                      className="px-3 py-1.5 text-sm rounded-full bg-accent-100 text-accent-700 flex flex-col items-center"
                    >
                      <span>{INTERFACE_CONFIG[interfaceType].label}</span>
                      <span className="text-[10px] text-accent-500/70">{INTERFACE_CONFIG[interfaceType].labelCn}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {device.notes && (
              <div className="mt-4 border rounded-lg px-4 py-3">
                <p className="text-sm text-gray-500 mb-1">备注</p>
                <p className="text-gray-800">{device.notes}</p>
              </div>
            )}
          </Card>
        </motion.div>

        {/* 时间线 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card hover={false} padding="lg">
            <h2 className="text-xl font-bold text-gray-800 mb-6">时间记录</h2>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                <div>
                  <p className="text-sm text-gray-500">创建时间</p>
                  <p className="font-medium text-gray-800">
                    {format(new Date(device.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                <div>
                  <p className="text-sm text-gray-500">最后更新</p>
                  <p className="font-medium text-gray-800">
                    {format(new Date(device.updatedAt), 'yyyy-MM-dd HH:mm:ss')}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* 删除确认对话框 */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="确认删除"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            确定要删除设备 <span className="font-mono font-medium">{device.id}</span> 吗?此操作不可撤销。
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setDeleteModalOpen(false)}>
              取消
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              删除
            </Button>
          </div>
        </div>
      </Modal>

      {/* 报损对话框 */}
      <Modal
        isOpen={damageModalOpen}
        onClose={() => setDamageModalOpen(false)}
        title="设备报损"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm text-gray-500">设备:</span>
            <span className="font-medium text-gray-800">{device.name}</span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-500">总数</p>
              <p className="text-xl font-bold text-gray-800">{device.quantity || 1}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-green-600">可用</p>
              <p className="text-xl font-bold text-green-700">{(device.quantity || 1) - (device.damagedQuantity || 0)}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-3">
              <p className="text-red-600">已损坏</p>
              <p className="text-xl font-bold text-red-700">{device.damagedQuantity || 0}</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">报损数量</label>
            <input
              type="number"
              min={1}
              max={(device.quantity || 1) - (device.damagedQuantity || 0)}
              value={damageCount}
              onChange={(e) => setDamageCount(Math.min(
                Math.max(1, Number(e.target.value) || 1),
                (device.quantity || 1) - (device.damagedQuantity || 0)
              ))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-gray-400 mt-1">最大可报损 {(device.quantity || 1) - (device.damagedQuantity || 0)} 个</p>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={() => setDamageModalOpen(false)}>
              取消
            </Button>
            <Button variant="danger" onClick={async () => {
              await reportDamaged(device.id, damageCount)
              const updated = await getDeviceById(device.id)
              if (updated) setDevice(updated)
              setDamageModalOpen(false)
            }}>
              确认报损
            </Button>
          </div>
        </div>
      </Modal>

      {/* 修复对话框 */}
      <Modal
        isOpen={repairModalOpen}
        onClose={() => setRepairModalOpen(false)}
        title="设备修复"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm text-gray-500">设备:</span>
            <span className="font-medium text-gray-800">{device.name}</span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-500">总数</p>
              <p className="text-xl font-bold text-gray-800">{device.quantity || 1}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-green-600">可用</p>
              <p className="text-xl font-bold text-green-700">{(device.quantity || 1) - (device.damagedQuantity || 0)}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-3">
              <p className="text-red-600">已损坏</p>
              <p className="text-xl font-bold text-red-700">{device.damagedQuantity || 0}</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">修复数量</label>
            <input
              type="number"
              min={1}
              max={device.damagedQuantity || 0}
              value={damageCount}
              onChange={(e) => setDamageCount(Math.min(
                Math.max(1, Number(e.target.value) || 1),
                device.damagedQuantity || 0
              ))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-gray-400 mt-1">最大可修复 {device.damagedQuantity || 0} 个</p>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={() => setRepairModalOpen(false)}>
              取消
            </Button>
            <Button variant="primary" onClick={async () => {
              await repairDevice(device.id, damageCount)
              const updated = await getDeviceById(device.id)
              if (updated) setDevice(updated)
              setRepairModalOpen(false)
            }}>
              确认修复
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  )
}