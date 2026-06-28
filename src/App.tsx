import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import DeviceManagement from './pages/DeviceManagement'
import AddDevice from './pages/AddDevice'
import EditDevice from './pages/EditDevice'
import DeviceDetail from './pages/DeviceDetail'
import ConfigSheet from './pages/ConfigSheet'
import CategoryManager from './pages/CategoryManager'
import ProjectCategoryManager from './pages/ProjectCategoryManager'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/devices" replace />} />
        <Route path="/devices" element={<DeviceManagement />} />
        <Route path="/devices/add" element={<AddDevice />} />
        <Route path="/devices/edit/:id" element={<EditDevice />} />
        <Route path="/devices/:id" element={<DeviceDetail />} />
        <Route path="/config" element={<ConfigSheet />} />
        <Route path="/categories" element={<CategoryManager />} />
        <Route path="/projects" element={<ProjectCategoryManager />} />
      </Routes>
    </Router>
  )
}

export default App