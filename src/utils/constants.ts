import { DeviceCategory, InterfaceType } from '../types/device'

// 父类别中文标签（用于分组显示）
export const PARENT_CATEGORY_LABEL: Record<DeviceCategory, string> = {
  [DeviceCategory.SENSOR]: '传感器类',
  [DeviceCategory.BOARD]: '核心板类',
  [DeviceCategory.COMM]: '通信模块类',
  [DeviceCategory.POWER]: '电源模块类',
  [DeviceCategory.STORAGE]: '存储模块类',
  [DeviceCategory.LIGHT]: '灯模块类',
  [DeviceCategory.ACTUATOR]: '执行器类',
  [DeviceCategory.CONNECTOR]: '连接器类',
  [DeviceCategory.OTHER]: '其他',
}

// 扁平类别列表(子类别直接作为类别)
export interface FlatCategory {
  label: string
  parentCategory: DeviceCategory
  group?: string   // 功能分组(用于折叠显示,如"开发板"、"存储卡")
}

export const CATEGORY_FLAT: FlatCategory[] = [
  // ========== 传感器类 ==========
  { label: '温度传感器', parentCategory: DeviceCategory.SENSOR },
  { label: '湿度传感器', parentCategory: DeviceCategory.SENSOR },
  { label: '压力传感器', parentCategory: DeviceCategory.SENSOR },
  { label: '气体传感器', parentCategory: DeviceCategory.SENSOR },
  { label: '光学传感器', parentCategory: DeviceCategory.SENSOR },
  { label: '运动传感器', parentCategory: DeviceCategory.SENSOR },
  { label: '声音传感器', parentCategory: DeviceCategory.SENSOR },
  { label: '红外传感器', parentCategory: DeviceCategory.SENSOR },
  { label: '超声波传感器', parentCategory: DeviceCategory.SENSOR },
  { label: '霍尔传感器', parentCategory: DeviceCategory.SENSOR },
  { label: '火焰传感器', parentCategory: DeviceCategory.SENSOR },
  { label: '人体感应传感器', parentCategory: DeviceCategory.SENSOR },
  { label: '触摸传感器', parentCategory: DeviceCategory.SENSOR },
  { label: '颜色传感器', parentCategory: DeviceCategory.SENSOR },
  { label: '陀螺仪传感器', parentCategory: DeviceCategory.SENSOR },
  { label: '加速度传感器', parentCategory: DeviceCategory.SENSOR },
  { label: '磁力传感器', parentCategory: DeviceCategory.SENSOR },
  { label: '烟雾传感器', parentCategory: DeviceCategory.SENSOR },
  { label: '酒精传感器', parentCategory: DeviceCategory.SENSOR },
  { label: '液位传感器', parentCategory: DeviceCategory.SENSOR },
  { label: '流量传感器', parentCategory: DeviceCategory.SENSOR },
  { label: '风速传感器', parentCategory: DeviceCategory.SENSOR },
  { label: 'PM2.5传感器', parentCategory: DeviceCategory.SENSOR },
  { label: '紫外线传感器', parentCategory: DeviceCategory.SENSOR },
  { label: '指纹传感器', parentCategory: DeviceCategory.SENSOR },
  { label: '心率传感器', parentCategory: DeviceCategory.SENSOR },
  { label: '语音识别模块', parentCategory: DeviceCategory.SENSOR },
  { label: '雨滴传感器', parentCategory: DeviceCategory.SENSOR },
  { label: '土壤湿度传感器', parentCategory: DeviceCategory.SENSOR },
  { label: '其他传感器', parentCategory: DeviceCategory.SENSOR },
  // ========== 核心板类 ==========
  { label: '开发板', parentCategory: DeviceCategory.BOARD, group: '开发板' },
  { label: 'ESP32开发板', parentCategory: DeviceCategory.BOARD, group: '开发板' },
  { label: 'STM32开发板', parentCategory: DeviceCategory.BOARD, group: '开发板' },
  { label: 'DSP开发板', parentCategory: DeviceCategory.BOARD, group: '开发板' },
  { label: 'ARM开发板', parentCategory: DeviceCategory.BOARD, group: '开发板' },
  { label: 'RISC-V开发板', parentCategory: DeviceCategory.BOARD, group: '开发板' },
  { label: '单片机', parentCategory: DeviceCategory.BOARD, group: '单片机' },
  { label: '51单片机', parentCategory: DeviceCategory.BOARD, group: '单片机' },
  { label: '核心板', parentCategory: DeviceCategory.BOARD },
  { label: '微控制器板', parentCategory: DeviceCategory.BOARD },
  { label: 'FPGA板', parentCategory: DeviceCategory.BOARD },
  { label: '树莓派', parentCategory: DeviceCategory.BOARD },
  { label: 'Arduino', parentCategory: DeviceCategory.BOARD },
  { label: 'PLC模块', parentCategory: DeviceCategory.BOARD },
  { label: 'NVIDIA Jetson', parentCategory: DeviceCategory.BOARD },
  { label: '嵌入式主板', parentCategory: DeviceCategory.BOARD },
  { label: '工控主板', parentCategory: DeviceCategory.BOARD },
  { label: '其他板卡', parentCategory: DeviceCategory.BOARD },
  // ========== 通信模块类 ==========
  { label: 'WiFi模块', parentCategory: DeviceCategory.COMM },
  { label: '蓝牙模块', parentCategory: DeviceCategory.COMM },
  { label: 'LoRa模块', parentCategory: DeviceCategory.COMM },
  { label: 'NB-IoT模块', parentCategory: DeviceCategory.COMM },
  { label: '4G/5G模块', parentCategory: DeviceCategory.COMM },
  { label: 'ZigBee模块', parentCategory: DeviceCategory.COMM },
  { label: 'NFC模块', parentCategory: DeviceCategory.COMM },
  { label: 'RFID模块', parentCategory: DeviceCategory.COMM },
  { label: 'GPS模块', parentCategory: DeviceCategory.COMM },
  { label: 'GSM模块', parentCategory: DeviceCategory.COMM },
  { label: '红外通信模块', parentCategory: DeviceCategory.COMM },
  { label: '串口通信模块', parentCategory: DeviceCategory.COMM },
  { label: 'USB通信模块', parentCategory: DeviceCategory.COMM },
  { label: '以太网模块', parentCategory: DeviceCategory.COMM },
  { label: '电台模块', parentCategory: DeviceCategory.COMM },
  { label: '声波通信模块', parentCategory: DeviceCategory.COMM },
  { label: '光纤模块', parentCategory: DeviceCategory.COMM },
  { label: '卫星通信模块', parentCategory: DeviceCategory.COMM },
  { label: '网桥模块', parentCategory: DeviceCategory.COMM },
  { label: '其他通信', parentCategory: DeviceCategory.COMM },
  // ========== 电源模块类 ==========
  { label: '升压模块', parentCategory: DeviceCategory.POWER, group: '电源转换' },
  { label: '降压模块', parentCategory: DeviceCategory.POWER, group: '电源转换' },
  { label: '稳压模块', parentCategory: DeviceCategory.POWER, group: '电源转换' },
  { label: '逆变器模块', parentCategory: DeviceCategory.POWER, group: '电源转换' },
  { label: '充电模块', parentCategory: DeviceCategory.POWER, group: '充电设备' },
  { label: '充电器', parentCategory: DeviceCategory.POWER, group: '充电设备' },
  { label: '无线充电模块', parentCategory: DeviceCategory.POWER, group: '充电设备' },
  { label: '电源管理', parentCategory: DeviceCategory.POWER },
  { label: '电池', parentCategory: DeviceCategory.POWER },
  { label: '太阳能电源模块', parentCategory: DeviceCategory.POWER },
  { label: '电池管理模块', parentCategory: DeviceCategory.POWER },
  { label: 'USB电源模块', parentCategory: DeviceCategory.POWER },
  { label: '适配器', parentCategory: DeviceCategory.POWER },
  { label: '电源滤波器', parentCategory: DeviceCategory.POWER },
  { label: '保险丝座', parentCategory: DeviceCategory.POWER },
  { label: '电源开关', parentCategory: DeviceCategory.POWER },
  { label: '电源监控模块', parentCategory: DeviceCategory.POWER },
  { label: '其他电源', parentCategory: DeviceCategory.POWER },
  // ========== 存储模块类 ==========
  { label: 'SD卡模块', parentCategory: DeviceCategory.STORAGE, group: '存储卡' },
  { label: 'TF卡模块', parentCategory: DeviceCategory.STORAGE, group: '存储卡' },
  { label: '存储卡', parentCategory: DeviceCategory.STORAGE, group: '存储卡' },
  { label: '内存模块', parentCategory: DeviceCategory.STORAGE, group: '内存' },
  { label: '内存条', parentCategory: DeviceCategory.STORAGE, group: '内存' },
  { label: 'Flash存储', parentCategory: DeviceCategory.STORAGE, group: '存储芯片' },
  { label: '存储芯片', parentCategory: DeviceCategory.STORAGE, group: '存储芯片' },
  { label: 'eMMC模块', parentCategory: DeviceCategory.STORAGE, group: '存储芯片' },
  { label: 'EEPROM', parentCategory: DeviceCategory.STORAGE },
  { label: 'U盘模块', parentCategory: DeviceCategory.STORAGE },
  { label: '硬盘', parentCategory: DeviceCategory.STORAGE },
  { label: '固态硬盘', parentCategory: DeviceCategory.STORAGE },
  { label: '其他存储', parentCategory: DeviceCategory.STORAGE },
  // ========== 灯模块类 ==========
  { label: 'LED灯板模块', parentCategory: DeviceCategory.LIGHT, group: 'LED灯' },
  { label: '全彩LED模块', parentCategory: DeviceCategory.LIGHT, group: 'LED灯' },
  { label: '灯条模块', parentCategory: DeviceCategory.LIGHT, group: 'LED灯' },
  { label: '背光模块', parentCategory: DeviceCategory.LIGHT, group: 'LED灯' },
  { label: '指示灯模块', parentCategory: DeviceCategory.LIGHT, group: 'LED灯' },
  { label: '显示屏模块', parentCategory: DeviceCategory.LIGHT, group: '显示模块' },
  { label: 'OLED模块', parentCategory: DeviceCategory.LIGHT, group: '显示模块' },
  { label: 'LCD模块', parentCategory: DeviceCategory.LIGHT, group: '显示模块' },
  { label: '像素屏模块', parentCategory: DeviceCategory.LIGHT, group: '显示模块' },
  { label: '数码管模块', parentCategory: DeviceCategory.LIGHT, group: '显示模块' },
  { label: '闪光灯模块', parentCategory: DeviceCategory.LIGHT },
  { label: '激光模块', parentCategory: DeviceCategory.LIGHT },
  { label: 'UV灯模块', parentCategory: DeviceCategory.LIGHT },
  { label: '红外补光灯', parentCategory: DeviceCategory.LIGHT },
  { label: '照明模块', parentCategory: DeviceCategory.LIGHT },
  { label: '其他灯模块', parentCategory: DeviceCategory.LIGHT },
  // ========== 执行器类 ==========
  { label: '电机驱动模块', parentCategory: DeviceCategory.ACTUATOR, group: '电机' },
  { label: '舵机', parentCategory: DeviceCategory.ACTUATOR, group: '电机' },
  { label: '步进电机', parentCategory: DeviceCategory.ACTUATOR, group: '电机' },
  { label: '直流电机', parentCategory: DeviceCategory.ACTUATOR, group: '电机' },
  { label: '无刷电机', parentCategory: DeviceCategory.ACTUATOR, group: '电机' },
  { label: '编码器电机', parentCategory: DeviceCategory.ACTUATOR, group: '电机' },
  { label: '继电器模块', parentCategory: DeviceCategory.ACTUATOR, group: '电磁驱动' },
  { label: '电磁阀', parentCategory: DeviceCategory.ACTUATOR, group: '电磁驱动' },
  { label: '电磁铁', parentCategory: DeviceCategory.ACTUATOR, group: '电磁驱动' },
  { label: '振动马达', parentCategory: DeviceCategory.ACTUATOR },
  { label: '蜂鸣器模块', parentCategory: DeviceCategory.ACTUATOR },
  { label: '扬声器模块', parentCategory: DeviceCategory.ACTUATOR },
  { label: '水泵驱动', parentCategory: DeviceCategory.ACTUATOR },
  { label: '风扇模块', parentCategory: DeviceCategory.ACTUATOR },
  { label: '气动元件', parentCategory: DeviceCategory.ACTUATOR },
  { label: '蠕动泵', parentCategory: DeviceCategory.ACTUATOR },
  { label: '其他执行器', parentCategory: DeviceCategory.ACTUATOR },
  // ========== 连接器类 ==========
  { label: '排针', parentCategory: DeviceCategory.CONNECTOR, group: '排针排母' },
  { label: '排母', parentCategory: DeviceCategory.CONNECTOR, group: '排针排母' },
  { label: '杜邦线', parentCategory: DeviceCategory.CONNECTOR, group: '线材' },
  { label: '面包板线', parentCategory: DeviceCategory.CONNECTOR, group: '线材' },
  { label: 'IDC排线', parentCategory: DeviceCategory.CONNECTOR, group: '线材' },
  { label: 'USB连接器', parentCategory: DeviceCategory.CONNECTOR, group: 'USB' },
  { label: 'TYPE-C连接器', parentCategory: DeviceCategory.CONNECTOR, group: 'USB' },
  { label: 'RJ45连接器', parentCategory: DeviceCategory.CONNECTOR, group: '网络/射频' },
  { label: 'RJ11连接器', parentCategory: DeviceCategory.CONNECTOR, group: '网络/射频' },
  { label: '同轴连接器', parentCategory: DeviceCategory.CONNECTOR, group: '网络/射频' },
  { label: 'BNC连接器', parentCategory: DeviceCategory.CONNECTOR, group: '网络/射频' },
  { label: '天线接口', parentCategory: DeviceCategory.CONNECTOR, group: '网络/射频' },
  { label: '接线端子', parentCategory: DeviceCategory.CONNECTOR },
  { label: 'FPC连接器', parentCategory: DeviceCategory.CONNECTOR },
  { label: '音频接口', parentCategory: DeviceCategory.CONNECTOR },
  { label: '电源接口', parentCategory: DeviceCategory.CONNECTOR },
  { label: '其他连接器', parentCategory: DeviceCategory.CONNECTOR },
]

// 按父类别分组的扁平类别(供DeviceFilter等组件使用)
export const CATEGORY_FLAT_GROUPS: Record<string, FlatCategory[]> = {}
for (const cat of CATEGORY_FLAT) {
  const group = PARENT_CATEGORY_LABEL[cat.parentCategory] || cat.parentCategory
  if (!CATEGORY_FLAT_GROUPS[group]) CATEGORY_FLAT_GROUPS[group] = []
  CATEGORY_FLAT_GROUPS[group].push(cat)
}

// 按父类别+功能子分组的三级结构(供DeviceForm折叠显示使用)
export type SubGroupEntry = { groupLabel: string; items: FlatCategory[] }
export const CATEGORY_NESTED_GROUPS: Record<string, SubGroupEntry[]> = {}
for (const [parentLabel, cats] of Object.entries(CATEGORY_FLAT_GROUPS)) {
  const subMap = new Map<string, FlatCategory[]>()
  const noGroupItems: FlatCategory[] = []
  for (const cat of cats) {
    if (cat.group) {
      if (!subMap.has(cat.group)) subMap.set(cat.group, [])
      subMap.get(cat.group)!.push(cat)
    } else {
      noGroupItems.push(cat)
    }
  }
  const entries: SubGroupEntry[] = []
  for (const [groupLabel, items] of subMap) {
    entries.push({ groupLabel, items })
  }
  if (noGroupItems.length > 0) {
    entries.push({ groupLabel: '', items: noGroupItems })
  }
  CATEGORY_NESTED_GROUPS[parentLabel] = entries
}

// 接口类型配置
export const INTERFACE_CONFIG: Record<InterfaceType, { label: string; labelCn: string }> = {
  [InterfaceType.UART]: { label: 'UART', labelCn: '串口' },
  [InterfaceType.SPI]: { label: 'SPI', labelCn: '串行外设接口' },
  [InterfaceType.I2C]: { label: 'I2C', labelCn: 'I²C总线' },
  [InterfaceType.I2S]: { label: 'I2S', labelCn: '音频总线' },
  [InterfaceType.ONE_WIRE]: { label: 'OneWire', labelCn: '单总线' },
  [InterfaceType.CAN]: { label: 'CAN', labelCn: '控制器局域网' },
  [InterfaceType.RS232]: { label: 'RS232', labelCn: '串行接口' },
  [InterfaceType.RS485]: { label: 'RS485', labelCn: '差分串行接口' },
  [InterfaceType.USB]: { label: 'USB', labelCn: '通用串行总线' },
  [InterfaceType.ETHERNET]: { label: 'Ethernet', labelCn: '以太网' },
  [InterfaceType.WIFI]: { label: 'WiFi', labelCn: '无线网络' },
  [InterfaceType.BLUETOOTH]: { label: 'Bluetooth', labelCn: '蓝牙' },
  [InterfaceType.GPIO]: { label: 'GPIO', labelCn: '通用输入输出' },
  [InterfaceType.PWM]: { label: 'PWM', labelCn: '脉宽调制' },
  [InterfaceType.ADC]: { label: 'ADC', labelCn: '模数转换' },
  [InterfaceType.DAC]: { label: 'DAC', labelCn: '数模转换' },
  [InterfaceType.HDMI]: { label: 'HDMI', labelCn: '高清多媒体接口' },
  [InterfaceType.SDIO]: { label: 'SDIO', labelCn: '安全数字输入输出' },
  [InterfaceType.PCIE]: { label: 'PCIe', labelCn: '高速扩展总线' },
  [InterfaceType.JTAG]: { label: 'JTAG', labelCn: '联合测试行动组' },
  [InterfaceType.SWD]: { label: 'SWD', labelCn: '串行线调试' },
  [InterfaceType.IR]: { label: 'IR', labelCn: '红外' },
  [InterfaceType.AUDIO_JACK]: { label: 'Audio Jack', labelCn: '音频接口' },
  [InterfaceType.S_PDIF]: { label: 'S/PDIF', labelCn: '数字音频接口' },
  [InterfaceType.MIPI]: { label: 'MIPI', labelCn: '移动行业处理器接口' },
  [InterfaceType.LVDS]: { label: 'LVDS', labelCn: '低压差分信号' },
  [InterfaceType.OTHER]: { label: 'Other', labelCn: '其他' },
}

// 数据库名称
export const DB_NAME = 'HardwareManagementDB'
export const DB_VERSION = 19
export const STORE_NAME = 'devices'
export const CATEGORIES_STORE = 'categories'
export const PROJECTS_STORE = 'projects'

// Toast默认持续时间
export const TOAST_DURATION = 3000

// 获取设备显示用类别名称
export function getCategoryLabel(device: { category: DeviceCategory; customCategory?: string; subCategory?: string }): string {
  // 有子类别时直接显示子类别
  if (device.subCategory) return device.subCategory
  // 自定义类别
  if (device.category === DeviceCategory.OTHER && device.customCategory) return device.customCategory
  return PARENT_CATEGORY_LABEL[device.category] || device.category
}
