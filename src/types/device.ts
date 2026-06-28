// 设备类别枚举
export enum DeviceCategory {
  SENSOR = 'SENSOR',      // 传感器类
  BOARD = 'BOARD',        // 核心板类
  COMM = 'COMM',          // 通信模块类
  POWER = 'POWER',        // 电源模块类
  STORAGE = 'STORAGE',    // 存储模块类
  LIGHT = 'LIGHT',        // 灯模块类
  ACTUATOR = 'ACTUATOR',  // 执行器类
  CONNECTOR = 'CONNECTOR', // 连接器类
  OTHER = 'OTHER'         // 其他
}

// 接口类型枚举
export enum InterfaceType {
  UART = 'UART',
  SPI = 'SPI',
  I2C = 'I2C',
  I2S = 'I2S',
  ONE_WIRE = 'OneWire',
  CAN = 'CAN',
  RS232 = 'RS232',
  RS485 = 'RS485',
  USB = 'USB',
  ETHERNET = 'Ethernet',
  WIFI = 'WiFi',
  BLUETOOTH = 'Bluetooth',
  GPIO = 'GPIO',
  PWM = 'PWM',
  ADC = 'ADC',
  DAC = 'DAC',
  HDMI = 'HDMI',
  SDIO = 'SDIO',
  PCIE = 'PCIe',
  JTAG = 'JTAG',
  SWD = 'SWD',
  IR = 'IR',
  AUDIO_JACK = 'Audio Jack',
  S_PDIF = 'S/PDIF',
  MIPI = 'MIPI',
  LVDS = 'LVDS',
  OTHER = 'Other'
}

// 设备接口定义
export interface Device {
  // 基础信息(必填)
  id: string;                    // 设备ID: {CATEGORY}-{YYYYMMDD}-{序号}
  name: string;                  // 设备名称
  category: DeviceCategory;      // 设备类别
  customCategory?: string;        // 自定义类别名称(当category=OTHER时使用)
  subCategory?: string;           // 子类别(如:温度传感器、开发板、WiFi模块等)
  purchaseDate: string;          // 购买时间 (ISO 8601格式)
  storageDate: string;           // 入库时间 (ISO 8601格式)

  // 硬件规格信息(可选)
  coreModel?: string;            // 核心型号(如STM32F103, ESP32)
  macAddress?: string;           // MAC地址
  firmwareVersion?: string;     // 固件版本
  storageCapacity?: string;      // 存储容量(如256KB, 1MB)
  interfaces?: InterfaceType[];  // 接口类型
  workingVoltage?: string;       // 工作电压(如3.3V, 5V)
  powerConsumption?: string;     // 功耗参数
  package?: string;              // 封装形式(如LQFP48, BGA)
  manufacturer?: string;         // 生产厂家

  // 货架位置
  shelfNumber?: string;           // 货架号(如: A-01-03)

  // 数量管理
  quantity?: number;              // 总数量(合并重复设备时使用,默认1)
  damagedQuantity?: number;       // 损坏数量(报损使用,默认0)

  // 用途与项目归属
  purpose?: string;               // 用途(如:温湿度监测、音频采集等)
  project?: string;               // 所属项目(如:智能家居、环境监测系统等)

  // 元数据
  createdAt: string;             // 创建时间
  updatedAt: string;             // 最后更新时间
  notes?: string;                // 备注信息

  // 多分类标签(额外的类别归属,值为子类别名称)
  tags?: string[];               // 如 ["WiFi模块", "蓝牙模块"]
}

// Toast通知类型
export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

// 管理类别(自定义类别预置)
export interface ManagedCategory {
  id: string
  name: string
  createdAt: string
}

// 项目类别
export interface ProjectCategory {
  id: string
  name: string
  createdAt: string
}