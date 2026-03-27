import { createContext, useContext, useEffect, useState } from 'react'
import { sb } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [progression, setProgression] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    sb.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) loadUserData(session.user)
      else setLoading(false)
    })
    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      if (session?.user) loadUserData(session.user)
      else { setUser(null); setProfile(null); setProgression(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function loadUserData(authUser) {
    setUser(authUser)
    const [{ data: prof }, { data: prog }] = await Promise.all([
      sb.from('profiles').select('*').eq('id', authUser.id).single(),
      sb.from('progression').select('*').eq('user_id', authUser.id).single(),
    ])
    setProfile(prof)
    setProgression(prog)
    setLoading(false)
  }

  async function refreshProgression() {
    if (!user) return
    const { data } = await sb.from('progression').select('*').eq('user_id', user.id).single()
    setProgression(data)
  }

  async function signOut() { await sb.auth.signOut() }

  return (
    <AuthContext.Provider value={{ user, profile, progression, loading, loadUserData, refreshProgression, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)