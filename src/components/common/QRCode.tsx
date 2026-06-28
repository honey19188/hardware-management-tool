import { QRCodeSVG } from 'qrcode.react'
import { Download } from 'lucide-react'
import Button from './Button'

interface QRCodeProps {
  value: string
  size?: number
  deviceId: string
}

export default function QRCode({ value, size = 200, deviceId }: QRCodeProps) {
  const downloadQRCode = () => {
    const svg = document.getElementById('qrcode-svg')
    if (!svg) return

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = size + 20
    canvas.height = size + 50

    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const svgData = new XMLSerializer().serializeToString(svg)
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, 10, 10, size, size)
      ctx.fillStyle = '#333'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(deviceId, canvas.width / 2, size + 35)

      const pngUrl = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = pngUrl
      a.download = `${deviceId}_qrcode.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
    img.src = url
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="bg-white p-3 rounded-lg shadow-inner">
        <QRCodeSVG
          id="qrcode-svg"
          value={value}
          size={size}
          level="L"
          includeMargin={true}
        />
      </div>
      <Button
        variant="secondary"
        size="sm"
        onClick={downloadQRCode}
        className="flex items-center gap-2"
      >
        <Download className="w-4 h-4" />
        下载
      </Button>
    </div>
  )
}
