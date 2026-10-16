import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ role, children }) {
    const { user, profile, loading } = useAuth()
    if (loading) return <p className="p-6">Loading...</p>
    if (!user) return <Navigate to="/login" />
    if (role && profile?.role !== role) return <Navigate to="/" />
    return children
}