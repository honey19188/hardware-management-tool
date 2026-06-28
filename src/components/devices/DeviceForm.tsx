import { useState, useEffect } from 'react'
import { Device, DeviceCategory, InterfaceType, ManagedCategory } from '../../types/device'
import { CATEGORY_FLAT, CATEGORY_NESTED_GROUPS, INTERFACE_CONFIG } from '../../utils/constants'
import { generateDeviceId } from '../../utils/idGenerator'
import { format } from 'date-fns'
import Input from '../common/Input'
import Button from '../common/Button'
import * as db from '../../db/database'

interface DeviceFormProps {
  initialData?: Device
  onSubmit: (device: Device) => Promise<void>
  onCancel: () => void
}

export default function DeviceForm({ initialData, onSubmit, onCancel }: DeviceFormProps) {
  // 初始选中的扁平类别(第一个)
  const defaultFlat = CATEGORY_FLAT[0]
  const [formData, setFormData] = useState<Partial<Device>>({
    name: initialData?.name || '',
    category: initialData?.category || defaultFlat.parentCategory,
    subCategory: initialData?.subCategory || defaultFlat.label,
    purchaseDate: initialData?.purchaseDate || format(new Date(), 'yyyy-MM-dd'),
    storageDate: initialData?.storageDate || format(new Date(), 'yyyy-MM-dd'),
    coreModel: initialData?.coreModel || '',
    macAddress: initialData?.macAddress || '',
    firmwareVersion: initialData?.firmwareVersion || '',
    storageCapacity: initialData?.storageCapacity || '',
    interfaces: initialData?.interfaces || [],
    workingVoltage: initialData?.workingVoltage || '',
    powerConsumption: initialData?.powerConsumption || '',
    package: initialData?.package || '',
    manufacturer: initialData?.manufacturer || '',
    notes: initialData?.notes || '',
    purpose: initialData?.purpose || '',
    project: initialData?.project || '',
    customCategory: initialData?.customCategory || '',
    shelfNumber: initialData?.shelfNumber || '',
  })

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [managedCategories, setManagedCategories] = useState<ManagedCategory[]>([])
  const [customMode, setCustomMode] = useState(!!initialData?.customCategory)
  // 默认展开所有子分组
  const allGroupKeys = Object.entries(CATEGORY_NESTED_GROUPS).flatMap(([group, subGroups]) =>
    subGroups.filter(sg => sg.groupLabel).map(sg => `${group}::${sg.groupLabel}`)
  )
  const [expandedSubGroups, setExpandedSubGroups] = useState<Set<string>>(new Set(allGroupKeys))
  const toggleSubGroup = (key: string) => {
    setExpandedSubGroups(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      return next
    })
  }
  // 多分类标签
  const [tags, setTags] = useState<string[]>(initialData?.tags || [])

  // 是否从扁平列表中选择
  const selectedFlat = CATEGORY_FLAT.find(c => c.label === formData.subCategory && c.parentCategory === formData.category)

  // 统一多类别切换(首次选择为主类别,后续为标签)
  const handleToggleCategory = (flat: typeof CATEGORY_FLAT[0]) => {
    const label = flat.label
    const isPrimary = selectedFlat?.label === label
    const isTag = tags.includes(label)

    if (isPrimary) {
      const newTags = [...tags]
      if (newTags.length > 0) {
        const promoted = newTags.shift()!
        setFormData({
          ...formData,
          category: CATEGORY_FLAT.find(c => c.label === promoted)?.parentCategory || flat.parentCategory,
          subCategory: promoted,
          customCategory: undefined,
        })
        setTags(newTags)
      } else {
        setFormData({
          ...formData,
          category: flat.parentCategory,
          subCategory: flat.label,
          customCategory: undefined,
        })
      }
    } else if (isTag) {
      setTags(tags.filter(t => t !== label))
    } else {
      if (!selectedFlat) {
        setFormData({
          ...formData,
          category: flat.parentCategory,
          subCategory: label,
          customCategory: undefined,
        })
      } else {
        setTags([...tags, label])
      }
    }
    setCustomMode(false)
  }

  // 取消所有选择(切换到"其他")
  const handleClearSelection = () => {
    setFormData({
      ...formData,
      category: DeviceCategory.OTHER,
      subCategory: undefined,
      customCategory: '',
    })
    setTags([])
    setCustomMode(false)
  }

  const isItemSelected = (label: string) => selectedFlat?.label === label || tags.includes(label)

  // 加载管理类别
  useEffect(() => {
    if (formData.category === DeviceCategory.OTHER) {
      db.getAllCategories().then(setManagedCategories)
    }
  }, [formData.category])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name?.trim()) {
      newErrors.name = '设备名称为必填项'
    }

    if (!formData.purchaseDate) {
      newErrors.purchaseDate = '购买时间为必填项'
    }

    if (!formData.storageDate) {
      newErrors.storageDate = '入库时间为必填项'
    }

    if (formData.macAddress && formData.macAddress.trim()) {
      const macPattern = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$|^([0-9A-Fa-f]{12})$/
      if (!macPattern.test(formData.macAddress)) {
        newErrors.macAddress = 'MAC地址格式不正确'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)

    try {
      let deviceId = initialData?.id
      if (!deviceId) {
        deviceId = await generateDeviceId(formData.category as DeviceCategory)
      }

      const device: Device = {
        id: deviceId,
        name: formData.name!,
        category: formData.category as DeviceCategory,
        quantity: formData.quantity || 1,
        purchaseDate: formData.purchaseDate!,
        storageDate: formData.storageDate!,
        coreModel: formData.coreModel,
        macAddress: formData.macAddress,
        firmwareVersion: formData.firmwareVersion,
        storageCapacity: formData.storageCapacity,
        interfaces: formData.interfaces,
        workingVoltage: formData.workingVoltage,
        powerConsumption: formData.powerConsumption,
        package: formData.package,
        manufacturer: formData.manufacturer,
        notes: formData.notes,
        purpose: formData.purpose,
        project: formData.project,
        customCategory: formData.customCategory,
        subCategory: formData.subCategory,
        shelfNumber: formData.shelfNumber,
        tags,  // 多分类标签
        createdAt: initialData?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await onSubmit(device)
    } catch (error) {
      console.error('Submit error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInterfaceChange = (interfaceType: InterfaceType) => {
    const currentInterfaces = formData.interfaces || []
    const newInterfaces = currentInterfaces.includes(interfaceType)
      ? currentInterfaces.filter(i => i !== interfaceType)
      : [...currentInterfaces, interfaceType]
    setFormData({ ...formData, interfaces: newInterfaces })
  }

  // 接口智能识别规则
  const INTERFACE_DETECTION_RULES: { keywords: string[]; type: InterfaceType }[] = [
    { keywords: ['uart', 'ttl', 'ch340', 'ch341', 'cp210', 'ft232', 'pl2303', 'max232', 'rs232'], type: InterfaceType.UART },
    { keywords: ['rs485', 'max485'], type: InterfaceType.RS485 },
    { keywords: ['spi', 'ssd1306', 'st7789', 'ili9341', 'max7219', 'nrf24'], type: InterfaceType.SPI },
    { keywords: ['i2c', 'iic', 'i²c', 'i2c'], type: InterfaceType.I2C },
    { keywords: ['i2s', 'max98357', 'inmp441', 'es8388'], type: InterfaceType.I2S },
    { keywords: ['onewire', 'one-wire', 'ds18b20', 'dht11', 'dht22'], type: InterfaceType.ONE_WIRE },
    { keywords: ['can', 'mcp2515', 'tja1050'], type: InterfaceType.CAN },
    { keywords: ['usb', 'type-c', 'typec', 'ch340', 'ch341', 'cp210'], type: InterfaceType.USB },
    { keywords: ['ethernet', 'lan', 'rj45', 'enc28j60', 'w5500', 'w5100'], type: InterfaceType.ETHERNET },
    { keywords: ['wifi', 'wi-fi', 'wlan', 'esp8266', 'esp32', 'esp-'], type: InterfaceType.WIFI },
    { keywords: ['bluetooth', 'ble', 'bt', 'hc-05', 'hc-06', 'hc05', 'hc06'], type: InterfaceType.BLUETOOTH },
    { keywords: ['pwm', 'servo', '舵机'], type: InterfaceType.PWM },
    { keywords: ['adc', '模拟'], type: InterfaceType.ADC },
    { keywords: ['dac'], type: InterfaceType.DAC },
    { keywords: ['hdmi'], type: InterfaceType.HDMI },
    { keywords: ['sdio', 'sd', 'tf', 'microsd'], type: InterfaceType.SDIO },
    { keywords: ['jtag'], type: InterfaceType.JTAG },
    { keywords: ['swd', 'swim'], type: InterfaceType.SWD },
    { keywords: ['ir', '红外', '遥控'], type: InterfaceType.IR },
    { keywords: ['oled', 'lcd', '屏幕', '显示', 'tft'], type: InterfaceType.SPI },
    { keywords: ['camera', '摄像头', 'ov2640', 'ov5640'], type: InterfaceType.MIPI },
    { keywords: ['lvds'], type: InterfaceType.LVDS },
    { keywords: ['audio', 'mic', '喇叭', '扬声器', '功放', 'max98357', 'inmp441'], type: InterfaceType.I2S },
  ]

  // 根据设备名称自动识别接口类型
  const detectInterfaces = (name: string): InterfaceType[] => {
    if (!name) return []
    const lower = name.toLowerCase()
    const detected = new Set<InterfaceType>()
    for (const rule of INTERFACE_DETECTION_RULES) {
      if (rule.keywords.some(k => lower.includes(k))) {
        detected.add(rule.type)
      }
    }
    return Array.from(detected)
  }

  // 设备名变化时自动检测接口
  useEffect(() => {
    const name = formData.name || ''
    if (name.length < 2) return
    const timer = setTimeout(() => {
      const detected = detectInterfaces(name)
      if (detected.length > 0) {
        setFormData(prev => {
          const current = prev.interfaces || []
          const merged = new Set([...current, ...detected])
          return { ...prev, interfaces: Array.from(merged) }
        })
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [formData.name])

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 设备类别选择 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          设备类别 <span className="text-gray-400 font-normal">(可多选,首次选择为主类别)</span>
        </label>
        {/* 已选类别展示 */}
        {selectedFlat && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-primary-50 text-primary-700 border border-primary-200">
              {selectedFlat.label} <span className="text-primary-300">(主)</span>
              <button
                type="button"
                onClick={() => handleToggleCategory(selectedFlat)}
                className="hover:text-red-500 transition-colors"
              >
                ×
              </button>
            </span>
            {tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-accent-50 text-accent-700 border border-accent-200"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleToggleCategory(CATEGORY_FLAT.find(c => c.label === tag)!)}
                  className="hover:text-red-500 transition-colors"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        {/* 扁平类别分组(按功能子分组折叠) */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          {Object.entries(CATEGORY_NESTED_GROUPS).map(([group, subGroups]) => (
            <div key={group}>
              <div className="text-xs font-semibold text-gray-500 mb-2 tracking-wider">{group}</div>
              <div className="space-y-1 pl-1">
                {subGroups.map(sg => (
                  <div key={sg.groupLabel || `nogroup-${group}`}>
                    {sg.groupLabel ? (
                      <>
                        <button
                          type="button"
                          onClick={() => toggleSubGroup(`${group}::${sg.groupLabel}`)}
                          className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                            expandedSubGroups.has(`${group}::${sg.groupLabel}`)
                              ? 'text-gray-700 bg-gray-50'
                              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <span className={`text-[10px] transition-transform duration-200 ${
                            expandedSubGroups.has(`${group}::${sg.groupLabel}`) ? 'text-primary-500' : ''
                          }`}>
                            {expandedSubGroups.has(`${group}::${sg.groupLabel}`) ? '▼' : '▶'}
                          </span>
                          <span>{sg.groupLabel}</span>
                          <span className="ml-auto text-gray-300 text-[10px] bg-gray-100 px-1.5 py-0.5 rounded-full">
                            {sg.items.length}
                          </span>
                        </button>
                        {expandedSubGroups.has(`${group}::${sg.groupLabel}`) && (
                          <div className="flex flex-wrap gap-2 pl-4 pt-1 pb-1.5 border-l-2 border-primary-100 ml-1.5">
                            {sg.items.map(flat => (
                              <button
                                key={flat.label}
                                type="button"
                                onClick={() => handleToggleCategory(flat)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                                  isItemSelected(flat.label)
                                    ? selectedFlat?.label === flat.label
                                      ? 'bg-primary-600 text-white shadow-sm shadow-primary-200'
                                      : 'bg-accent-600 text-white shadow-sm shadow-accent-200'
                                    : 'bg-white text-gray-600 hover:bg-primary-50 hover:text-primary-700 border border-gray-200 hover:border-primary-300'
                                }`}
                              >
                                {flat.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-wrap gap-2 pl-1">
                        {sg.items.map(flat => (
                          <button
                            key={flat.label}
                            type="button"
                            onClick={() => handleToggleCategory(flat)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                            isItemSelected(flat.label)
                              ? selectedFlat?.label === flat.label
                                ? 'bg-primary-600 text-white shadow-sm shadow-primary-200'
                                : 'bg-accent-600 text-white shadow-sm shadow-accent-200'
                              : 'bg-white text-gray-600 hover:bg-primary-50 hover:text-primary-700 border border-gray-200 hover:border-primary-300'
                          }`}
                          >
                            {flat.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>  {/* closes space-y-1 */}
            </div>
          ))}
          {/* "其他"按钮 */}
          <div>
            <div className="text-xs font-semibold text-gray-500 mb-2 tracking-wider">其他</div>
            <button
              type="button"
              onClick={handleClearSelection}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                formData.category === DeviceCategory.OTHER
                  ? 'bg-primary-600 text-white shadow-sm shadow-primary-200'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200 hover:border-gray-300'
              }`}
            >
              自定义类别
            </button>
          </div>
        </div>  {/* closes bg-white rounded-xl */}
        {/* 自定义类别输入(当选择"其他"时) */}
        {formData.category === DeviceCategory.OTHER && (
          <div className="mt-3 space-y-2">
            {!customMode ? (
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">选择类别</label>
                  <select
                    value={formData.customCategory || ''}
                    onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                    className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-700"
                  >
                    <option value="">-- 请选择 --</option>
                    {managedCategories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => { setCustomMode(true); setFormData({ ...formData, customCategory: '' }) }}
                  className="px-3 py-2 text-sm text-primary-600 hover:text-primary-700 whitespace-nowrap"
                >
                  手动输入
                </button>
              </div>
            ) : (
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Input
                    label="自定义类别名称"
                    value={formData.customCategory || ''}
                    onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                    placeholder="如: 显示模块、电机驱动"
                  />
                </div>
                {managedCategories.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCustomMode(false)}
                    className="px-3 py-2 text-sm text-primary-600 hover:text-primary-700 whitespace-nowrap"
                  >
                    从列表选择
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>  {/* closes 设备类别选择 */}

      {/* 基本信息 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="设备名称 *"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          error={errors.name}
          placeholder="如: 温度传感器DHT11"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">数量</label>
          <input
            type="number"
            min={1}
            value={formData.quantity || 1}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10)
              setFormData({ ...formData, quantity: isNaN(val) || val < 1 ? 1 : val })
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-700"
          />
        </div>

        <Input
          label="购买时间 *"
          type="date"
          value={formData.purchaseDate}
          onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
          error={errors.purchaseDate}
        />

        <Input
          label="入库时间 *"
          type="date"
          value={formData.storageDate}
          onChange={(e) => setFormData({ ...formData, storageDate: e.target.value })}
          error={errors.storageDate}
        />
      </div>

      {/* 货架号 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="货架号"
          value={formData.shelfNumber}
          onChange={(e) => setFormData({ ...formData, shelfNumber: e.target.value })}
          placeholder="如: A-01-03"
        />
      </div>

      {/* 硬件规格信息 */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">硬件规格信息</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="核心型号"
            value={formData.coreModel}
            onChange={(e) => setFormData({ ...formData, coreModel: e.target.value })}
            placeholder="如: STM32F103, ESP32"
          />

          <Input
            label="MAC地址"
            value={formData.macAddress}
            onChange={(e) => setFormData({ ...formData, macAddress: e.target.value })}
            error={errors.macAddress}
            placeholder="如: AA:BB:CC:DD:EE:FF"
          />

          <Input
            label="固件版本"
            value={formData.firmwareVersion}
            onChange={(e) => setFormData({ ...formData, firmwareVersion: e.target.value })}
            placeholder="如: v1.0.0"
          />

          <Input
            label="存储容量"
            value={formData.storageCapacity}
            onChange={(e) => setFormData({ ...formData, storageCapacity: e.target.value })}
            placeholder="如: 256KB, 1MB"
          />

          <Input
            label="工作电压"
            value={formData.workingVoltage}
            onChange={(e) => setFormData({ ...formData, workingVoltage: e.target.value })}
            placeholder="如: 3.3V, 5V"
          />

          <Input
            label="功耗参数"
            value={formData.powerConsumption}
            onChange={(e) => setFormData({ ...formData, powerConsumption: e.target.value })}
            placeholder="如: 10mA"
          />

          <Input
            label="封装形式"
            value={formData.package}
            onChange={(e) => setFormData({ ...formData, package: e.target.value })}
            placeholder="如: LQFP48, BGA"
          />

          <Input
            label="生产厂家"
            value={formData.manufacturer}
            onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
            placeholder="如: STMicroelectronics"
          />
        </div>

        {/* 接口类型 */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            接口类型
          </label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(INTERFACE_CONFIG).map(([key, config]) => (
              <button
                key={key}
                type="button"
                onClick={() => handleInterfaceChange(key as InterfaceType)}
                className={`flex flex-col items-center px-4 py-2 rounded-lg text-sm font-medium transition-all min-w-[90px] ${
                  formData.interfaces?.includes(key as InterfaceType)
                    ? 'bg-accent-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>{config.label}</span>
                <span className={`text-[10px] leading-tight ${
                  formData.interfaces?.includes(key as InterfaceType) ? 'text-white/80' : 'text-gray-400'
                }`}>{config.labelCn}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 用途与项目归属 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-6">
        <Input
          label="用途"
          value={formData.purpose}
          onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
          placeholder="如: 温湿度监测、音频采集"
        />
        <Input
          label="所属项目"
          value={formData.project}
          onChange={(e) => setFormData({ ...formData, project: e.target.value })}
          placeholder="如: 智能家居、环境监测系统"
        />
      </div>

      {/* 备注 */}
      <Input
        label="备注"
        value={formData.notes}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        placeholder="其他补充信息"
      />

      {/* 操作按钮 */}
      <div className="flex gap-3 justify-end pt-6 border-t">
        <Button variant="ghost" onClick={onCancel}>
          取消
        </Button>
        <Button variant="primary" loading={loading} type="submit">
          {initialData ? '更新设备' : '添加设备'}
        </Button>
      </div>
    </form>
  )
}