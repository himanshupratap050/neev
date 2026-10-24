import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Signup from './pages/Signup'
import Login from './pages/Login'
import PostRequirement from './pages/PostRequirement'
import MyRequests from './pages/MyRequests'
import ProviderLeads from './pages/ProviderLeads'
import ProviderQuotes from './pages/ProviderQuotes'
import Admin from './pages/Admin'

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/post" element={<ProtectedRoute role="customer"><PostRequirement /></ProtectedRoute>} />
          <Route path="/my-requests" element={<ProtectedRoute role="customer"><MyRequests /></ProtectedRoute>} />
          <Route path="/leads" element={<ProtectedRoute role="provider"><ProviderLeads /></ProtectedRoute>} />
          <Route path="/my-quotes" element={<ProtectedRoute role="provider"><ProviderQuotes /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute role="admin"><Admin /></ProtectedRoute>} />
        </Routes>
      </main>
    </>
  )
}