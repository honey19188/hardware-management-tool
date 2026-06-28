import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import DeviceForm from '../components/devices/DeviceForm'
import Card from '../components/common/Card'
import { useDeviceStore } from '../store/useDeviceStore'
import { Device } from '../types/device'
import { getDeviceById } from '../db/database'
import { motion } from 'framer-motion'

export default function EditDevice() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { updateDevice } = useDeviceStore()
  const [device, setDevice] = useState<Device | null>(null)
  const [loading, setLoading] = useState(true)

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

  const handleSubmit = async (updatedDevice: Device) => {
    await updateDevice(updatedDevice)
    navigate('/devices')
  }

  const handleCancel = () => {
    navigate('/devices')
  }

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
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

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card hover={false} padding="lg">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">编辑设备</h2>
              <p className="text-gray-600 font-mono">{device.id}</p>
            </div>

            <DeviceForm
              initialData={device}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          </Card>
        </motion.div>
      </div>
    </Layout>
  )
}