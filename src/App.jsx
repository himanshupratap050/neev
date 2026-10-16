import { Routes, Route, Link } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Signup from './pages/Signup'
import Login from './pages/Login'
import PostRequirement from './pages/PostRequirement'
import { useAuth } from './context/AuthContext'

function Home() {
  const { user, profile, loading } = useAuth()
  if (loading) return <p className="p-6">Loading...</p>
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-4xl font-bold text-amber-brand">NEEV (नींव)</h1>
      <p className="text-slate-500">Har Nirman Ki Shuruat</p>
      {user ? (
        <p className="text-slate-brand">Logged in: {profile?.name ?? '...'} ({profile?.role ?? '...'})</p>
      ) : (
        <div className="flex gap-3">
          <Link to="/login" className="rounded-xl bg-slate-brand px-5 py-3 font-semibold text-white">Login</Link>
          <Link to="/signup" className="rounded-xl bg-amber-brand px-5 py-3 font-semibold text-white">Sign up</Link>
        </div>
      )}
    </div>
  )
}

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/post" element={<ProtectedRoute role="customer"><PostRequirement /></ProtectedRoute>} />
      </Routes>
    </>
  )
}