import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { Home } from './pages/Home'
import { ProjectEditor } from './pages/ProjectEditor'
import { Toaster } from '@/components/ui/toaster'

import './index.css'

import './demos/ipc'
// If you want use Node.js, the`nodeIntegration` needs to be enabled in the Main process.
// import './demos/node'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/project/:id" element={<ProjectEditor />} />
      </Routes>
      <Toaster />
    </HashRouter>
  </React.StrictMode>,
)

postMessage({ payload: 'removeLoading' }, '*')
