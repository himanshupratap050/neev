import { Routes, Route, Link } from 'react-router-dom'
import Signup from './pages/Signup'
import Login from './pages/Login'
import { useAuth } from './context/AuthContext'
import { supabase } from './lib/supabase'

function Home() {
  const { user, profile, loading } = useAuth()
  if (loading) return <p className="p-6">Loading...</p>
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 px-4">
      <h1 className="text-4xl font-bold text-amber-brand">NEEV (नींव)</h1>
      <p className="text-slate-500">
        {user ? `Logged in: ${profile?.name ?? '...'} (${profile?.role ?? '...'})` : 'Logged out'}
      </p>
      {user ? (
        <button
          onClick={() => supabase.auth.signOut()}
          className="rounded-xl bg-slate-brand px-5 py-3 font-semibold text-white"
        >
          Logout
        </button>
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
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
    </Routes>
  )
}