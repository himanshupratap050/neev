import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext()
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(u) {
    if (!u) { setProfile(null); return }
    const { data } = await supabase
      .from('profiles').select('*').eq('id', u.id).maybeSingle()
    setProfile(data)
  }

  // Always reads the current signed-in user, never an outdated copy
  async function reloadProfile() {
    const { data } = await supabase.auth.getUser()
    await loadProfile(data.user)
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const u = data.session?.user ?? null
      setUser(u)
      await loadProfile(u)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user ?? null
      setUser(u)
      setTimeout(() => loadProfile(u), 0)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, profile, loading, reloadProfile }}>
      {children}
    </AuthContext.Provider>
  )
} import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext()
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)

    async function loadProfile(u) {
        if (!u) { setProfile(null); return }
        const { data } = await supabase
            .from('profiles').select('*').eq('id', u.id).maybeSingle()
        setProfile(data)
    }

    // Always reads the current signed-in user, never an outdated copy
    async function reloadProfile() {
        const { data } = await supabase.auth.getUser()
        await loadProfile(data.user)
    }

    useEffect(() => {
        supabase.auth.getSession().then(async ({ data }) => {
            const u = data.session?.user ?? null
            setUser(u)
            await loadProfile(u)
            setLoading(false)
        })
        const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
            const u = session?.user ?? null
            setUser(u)
            setTimeout(() => loadProfile(u), 0)
        })
        return () => sub.subscription.unsubscribe()
    }, [])

    return (
        <AuthContext.Provider value={{ user, profile, loading, reloadProfile }}>
            {children}
        </AuthContext.Provider>
    )
}