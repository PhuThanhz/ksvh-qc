import { spawn } from 'child_process'
import { writeFileSync, mkdirSync } from 'fs'

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const PORT = 9222

mkdirSync('/tmp/screenshots', { recursive: true })

let versionData = null
try {
  const res = await fetch(`http://127.0.0.1:${PORT}/json/version`)
  if (res.ok) versionData = await res.json()
} catch {}

let chrome = null
if (!versionData) {
  console.log('Starting headless Chrome...')
  chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=' + PORT,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=/tmp/chrome-test-profile-' + Date.now(),
  ], { stdio: 'ignore' })

  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 300))
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`)
      if (res.ok) {
        versionData = await res.json()
        break
      }
    } catch {}
  }
}

if (!versionData) {
  console.error('Failed to connect to Chrome CDP')
  chrome.kill()
  process.exit(1)
}

console.log('Connected to Chrome CDP. Webview URL:', versionData.webSocketDebuggerUrl)

// Create a new target/tab
const newTargetRes = await fetch(`http://127.0.0.1:${PORT}/json/new?http://localhost:5273/login`, { method: 'PUT' })
const target = await newTargetRes.json()
console.log('Target created:', target.id)

const ws = new WebSocket(target.webSocketDebuggerUrl)
let msgId = 1
const callbacks = new Map()

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data)
  if (msg.id && callbacks.has(msg.id)) {
    const cb = callbacks.get(msg.id)
    callbacks.delete(msg.id)
    cb(msg.result, msg.error)
  }
}

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = msgId++
    callbacks.set(id, (res, err) => {
      if (err) reject(new Error(err.message || JSON.stringify(err)))
      else resolve(res)
    })
    ws.send(JSON.stringify({ id, method, params }))
  })
}

await new Promise((r) => (ws.onopen = r))
console.log('WebSocket opened')

await send('Page.enable')
await send('Runtime.enable')

const consoleLogs = []
ws.addEventListener('message', (event) => {
  const msg = JSON.parse(event.data)
  if (msg.method === 'Runtime.consoleAPICalled') {
    consoleLogs.push({ type: msg.params.type, args: msg.params.args?.map(a => a.value || a.description) })
  }
  if (msg.method === 'Runtime.exceptionThrown') {
    console.error('Browser Exception:', msg.params.exceptionDetails)
    consoleLogs.push({ type: 'exception', details: msg.params.exceptionDetails })
  }
})

// Helper to take screenshot
async function screenshot(filename, width = 1440, height = 900) {
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 768,
  })
  await new Promise((r) => setTimeout(r, 500))
  const data = await send('Page.captureScreenshot', { format: 'png' })
  writeFileSync(`/tmp/screenshots/${filename}`, Buffer.from(data.data, 'base64'))
  console.log(`Saved /tmp/screenshots/${filename} (${width}x${height})`)
}

// Wait for login form to load
await new Promise((r) => setTimeout(r, 2000))
await screenshot('login_1440.png', 1440, 900)

// Perform login
console.log('Submitting login...')
const loginResult = await send('Runtime.evaluate', {
  expression: `
    (async () => {
      const userInput = document.querySelector('input[id*="username"]') || document.querySelector('input[placeholder*="tài khoản"]') || document.querySelector('input[type="text"]');
      const passInput = document.querySelector('input[type="password"]');
      const submitBtn = document.querySelector('button[type="submit"]');
      
      if (userInput && passInput && submitBtn) {
        // Trigger React input value changes
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        nativeInputValueSetter.call(userInput, 'admin');
        userInput.dispatchEvent(new Event('input', { bubbles: true }));
        
        nativeInputValueSetter.call(passInput, 'Admin@123');
        passInput.dispatchEvent(new Event('input', { bubbles: true }));
        
        await new Promise(r => setTimeout(r, 300));
        submitBtn.click();
        return 'clicked';
      }
      return 'inputs not found';
    })()
  `,
  awaitPromise: true,
})
console.log('Login action result:', loginResult.result.value)

// Wait for navigation after login
await new Promise((r) => setTimeout(r, 3000))

const routesToTest = [
  { path: '/admin/findings', name: 'findings' },
  { path: '/admin/inspections', name: 'inspections' },
  { path: '/admin/criteria-groups', name: 'criteria_groups' },
]

const viewports = [
  { width: 1440, height: 900, name: '1440' },
  { width: 1024, height: 768, name: '1024' },
  { width: 768, height: 1024, name: '768' },
  { width: 375, height: 812, name: '375' },
]

for (const r of routesToTest) {
  console.log(`Navigating to ${r.path}...`)
  await send('Page.navigate', { url: `http://localhost:5273${r.path}` })
  await new Promise((r) => setTimeout(r, 2000))

  for (const vp of viewports) {
    await screenshot(`${r.name}_${vp.name}.png`, vp.width, vp.height)
  }
}

console.log('Completed smoke tests!')
console.log('Errors caught during run:', consoleLogs.filter(l => l.type === 'error' || l.type === 'exception'))

if (chrome) chrome.kill()
process.exit(0)
