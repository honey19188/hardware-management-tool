import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  HardDrive, Plus, Upload, FileSpreadsheet, ClipboardList, Layers,
  Search, X, Settings, FolderKanban,
} from 'lucide-react'
import { exportDevicesToExcel } from '../../utils/excelExport'
import { useDeviceStore } from '../../store/useDeviceStore'

interface HeaderProps {
  onImportClick: () => void
  onAdvancedClick: () => void
}

export default function Header({ onImportClick, onAdvancedClick }: HeaderProps) {
  const location = useLocation()
  const isConfigPage = location.pathname === '/config'
  const showSearch = location.pathname === '/devices' || location.pathname === '/' || location.pathname === '/config'
  const { searchDevices } = useDeviceStore()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    searchDevices(value)
  }

  const handleClear = () => {
    setSearchQuery('')
    searchDevices('')
  }

  const handleExport = async () => {
    await exportDevicesToExcel()
  }

  return (
    <header className="sticky top-0 z-40">
      {/* 渐变背景层 */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-700 via-primary-600 to-primary-800 shadow-lg" />
      {/* 装饰粒子层 */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px),
                            radial-gradient(circle at 80% 30%, white 1px, transparent 1px)`,
          backgroundSize: '40px 40px, 30px 30px',
        }}
      />
      {/* 下方阴影光晕 */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-3/4 h-6 bg-gradient-to-b from-primary-500/20 to-transparent blur-xl" />

      <div className="relative max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo 区 */}
          <Link to="/devices" className="group flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-white/20 rounded-xl blur-sm group-hover:blur-md transition-all duration-300" />
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 group-hover:bg-white/25 transition-all duration-300">
                <HardDrive className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                硬件信息管理工具
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/20 text-white/80 border border-white/10">
                  v1.2
                </span>
              </h1>
              <p className="text-xs text-primary-200/80 hidden sm:block">单片机设备管理系统</p>
            </div>
          </Link>

          {/* 右侧操作区 */}
          <div className="flex items-center gap-2">
            {/* 搜索框 */}
            {showSearch && (
              <div className="relative flex items-center">
                <Search className="absolute left-3 w-4 h-4 text-white/50" />
                <input
                  type="text"
                  placeholder="搜索设备名称、ID、型号..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-48 lg:w-64 pl-9 pr-8 py-2 rounded-lg text-sm bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:bg-white/20 focus:border-white/30 transition-all duration-200"
                />
                {searchQuery && (
                  <button
                    onClick={handleClear}
                    className="absolute right-2 p-0.5 rounded text-white/50 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* 导航链接 */}
            <Link
              to={isConfigPage ? '/devices' : '/config'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isConfigPage
                  ? 'bg-green-500/20 text-green-200 border border-green-400/30'
                  : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/10'
              }`}
            >
              {isConfigPage ? <HardDrive className="w-4 h-4" /> : <ClipboardList className="w-4 h-4" />}
              <span className="hidden sm:inline">{isConfigPage ? '设备管理' : '配置单'}</span>
            </Link>

            <Link
              to="/categories"
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200"
              title="类别管理"
            >
              <Layers className="w-4 h-4" />
              <span className="hidden sm:inline">类别</span>
            </Link>

            <Link
              to="/projects"
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200"
              title="项目管理"
            >
              <FolderKanban className="w-4 h-4" />
              <span className="hidden sm:inline">项目</span>
            </Link>

            {/* 操作按钮组 */}
            <Link to="/devices/add">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-white text-primary-700 hover:bg-primary-50 hover:shadow-lg active:scale-95 transition-all duration-200 shadow-md">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">添加</span>
              </button>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              <button
                onClick={onAdvancedClick}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200"
                title="高级设置"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden lg:inline">高级</span>
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200"
                title="导出Excel"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span className="hidden lg:inline">导出</span>
              </button>
              <button
                onClick={onImportClick}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200"
                title="导入数据"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden lg:inline">导入</span>
              </button>
            </div>

            {/* 移动端菜单提示 */}
            <div className="md:hidden flex items-center gap-1">
              <button
                onClick={onAdvancedClick}
                className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all"
                title="高级"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
