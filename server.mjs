import http from 'http'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { createInterface } from 'readline'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST_DIR = path.join(__dirname, 'dist')
const PORT = 5173

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.webp': 'image/webp',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
}

function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase()
  const contentType = MIME[ext] || 'application/octet-stream'

  const candidates = [
    filePath,
    path.join(filePath, 'index.html'),
  ]

  for (const target of candidates) {
    try {
      if (fs.existsSync(target) && fs.statSync(target).isFile()) {
        const content = fs.readFileSync(target)
        res.writeHead(200, { 'Content-Type': contentType })
        res.end(content)
        return
      }
    } catch {}
  }

  // SPA fallback
  const fallback = path.join(DIST_DIR, 'index.html')
  if (fs.existsSync(fallback)) {
    const content = fs.readFileSync(fallback)
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(content)
  } else {
    res.writeHead(500)
    res.end('500 - dist/index.html not found')
  }
}

function askUser() {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => {
    console.log('')
    console.log('══════════════════════════════════════════════')
    console.log('  硬件信息管理工具 v1.2')
    console.log('══════════════════════════════════════════════')
    console.log('')
    console.log('  请选择启动方式：')
    console.log('')
    console.log('  [1] 本机访问    → http://localhost:5173')
    console.log('  [2] 局域网访问  → http://IP:5173 (其他设备可连接)')
    console.log('')
    rl.question('  请输入数字 (1 或 2): ', (answer) => {
      rl.close()
      resolve(answer.trim() === '2' ? '0.0.0.0' : '127.0.0.1')
    })
  })
}

function getLocalIP() {
  try {
    const interfaces = os.networkInterfaces()
    for (const name of Object.getOwnPropertyNames(interfaces)) {
      const ifaces = interfaces[name]
      if (!ifaces) continue
      for (const iface of ifaces) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address
        }
      }
    }
  } catch {}
  return '未知'
}

async function main() {
  if (!fs.existsSync(DIST_DIR)) {
    console.error('\n  错误: dist/ 目录不存在！请先运行 npm run build 构建项目。\n')
    process.exit(1)
  }

  const host = await askUser()
  const localIP = getLocalIP()

  const server = http.createServer((req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405)
      res.end()
      return
    }

    let urlPath = req.url.split('?')[0].split('#')[0]
    if (urlPath === '/') urlPath = '/index.html'

    const filePath = path.join(DIST_DIR, urlPath)

    if (!filePath.startsWith(DIST_DIR)) {
      res.writeHead(403)
      res.end('403 Forbidden')
      return
    }

    serveFile(res, filePath)
  })

  server.listen(PORT, host, () => {
    console.log('')
    console.log('══════════════════════════════════════════════')
    console.log('  服务已启动！')
    console.log('')
    if (host === '0.0.0.0') {
      console.log(`  本机访问:    http://localhost:${PORT}`)
      console.log(`  局域网访问:  http://${localIP}:${PORT}`)
    } else {
      console.log(`  访问地址:    http://localhost:${PORT}`)
    }
    console.log('')
    console.log('  按 Ctrl+C 停止服务')
    console.log('══════════════════════════════════════════════')
    console.log('')

    try {
      const url = `http://localhost:${PORT}`
      const cmd = process.platform === 'win32'
        ? `start "" "${url}"`
        : process.platform === 'darwin'
          ? `open "${url}"`
          : `xdg-open "${url}"`
      execSync(cmd, { stdio: 'ignore', timeout: 2000 })
    } catch {}
  })
}

main().catch((err) => {
  console.error('\n  启动失败:', err.message, '\n')
  process.exit(1)
})
