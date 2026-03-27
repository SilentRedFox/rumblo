import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import styles from './Profile.module.css'

export default function Profile() {
  const { user, profile, progression, signOut } = useAuth()
  const navigate = useNavigate()
  const name = profile?.display_name || profile?.username || 'Player'

  async function handleSignOut() { await signOut(); navigate('/auth') }

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <button className={styles.backBtn} onClick={() => navigate('/')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Back
        </button>
        <div className={styles.logo}>rumblo</div>
        <div style={{ width: 60 }} />
      </nav>
      <div className={`${styles.body} fade-in`}>
        <div className={styles.profileHeader}>
          <div className={styles.avatar}>{name.slice(0,2).toUpperCase()}</div>
          <div className={styles.profileInfo}><h2>{name}</h2><span>{user?.email}</span></div>
        </div>
        <p className={styles.sectionLabel}>Your stats</p>
        <div className={styles.statsGrid}>
          <div className={styles.statTile}><div className={styles.val}>{progression?.current_streak || 0}</div><div className={styles.lbl}>🔥 Current streak</div></div>
          <div className={styles.statTile}><div className={styles.val}>{progression?.longest_streak || 0}</div><div className={styles.lbl}>Best streak</div></div>
          <div className={styles.statTile}><div className={styles.val}>{progression?.level || 1}</div><div className={styles.lbl}>Level</div></div>
          <div className={styles.statTile}><div className={styles.val}>{progression?.xp || 0}</div><div className={styles.lbl}>Total XP</div></div>
        </div>
        <button className={styles.signOutBtn} onClick={handleSignOut}>Sign out</button>
      </div>
    </div>
  )
}