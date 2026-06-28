import { useNavigate, useLocation } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import DeviceForm from '../components/devices/DeviceForm'
import Card from '../components/common/Card'
import { useDeviceStore } from '../store/useDeviceStore'
import { Device } from '../types/device'
import { Sparkles } from 'lucide-react'

export default function AddDevice() {
  const navigate = useNavigate()
  const location = useLocation()
  const { addDevice } = useDeviceStore()

  // 来自智能识别的预填充数据
  const smartData = (location.state as any)?.smartData as Partial<Device> | undefined

  const handleSubmit = async (device: Device) => {
    await addDevice(device)
    navigate('/devices')
  }

  const handleCancel = () => {
    navigate('/devices')
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <Card hover={false} padding="lg">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
              {smartData ? (
                <><Sparkles className="w-6 h-6 text-accent-500" /> 智能添加 - 确认设备信息</>
              ) : (
                '添加新设备'
              )}
            </h2>
            <p className="text-gray-600">
              {smartData
                ? 'AI 已识别出设备信息，请核对并补充其他字段后提交'
                : '填写设备信息以添加到管理系统中'
              }
            </p>
          </div>

          <DeviceForm
            initialData={smartData as Device}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </Card>
      </div>
    </Layout>
  )
}
