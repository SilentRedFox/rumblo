import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sb } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import styles from './Hub.module.css'

export default function Hub() {
  const { profile, progression } = useAuth()
  const [scramDone, setScramDone] = useState(false)
  const [scramScore, setScramScore] = useState(null)
  const navigate = useNavigate()
  const name = profile?.display_name || profile?.username || 'Player'
  const streak = progression?.current_streak || 0

  useEffect(() => { checkTodayScram() }, [profile])

  async function checkTodayScram() {
    if (!profile) return
    const today = new Date().toISOString().split('T')[0]
    const { data: challenge } = await sb.from('daily_challenges').select('id').eq('challenge_date', today).eq('is_published', true).single()
    if (!challenge) return
    const { data: attempt } = await sb.from('challenge_attempts').select('correct_answers_count').eq('user_id', profile.id).eq('daily_challenge_id', challenge.id).maybeSingle()
    if (attempt) { setScramDone(true); setScramScore(attempt.correct_answers_count) }
  }

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <div className={styles.logo}>rumblo</div>
        <button className={styles.avatarBtn} onClick={() => navigate('/profile')}>{name.slice(0,2).toUpperCase()}</button>
      </nav>
      <div className={styles.content}>
        <div className={styles.greeting}>
          <span className={styles.label}>Good to see you</span>
          <h1>{name}</h1>
        </div>
        <div className={styles.streakBar}>
          <span className={styles.streakIcon}>🔥</span>
          <div className={styles.streakInfo}>
            <strong>{streak === 1 ? '1 day streak' : `${streak} day streak`}</strong>
            <span>Keep it up — play today's challenges</span>
          </div>
        </div>
        <p className={styles.sectionLabel}>Today's Challenges</p>
        <button className={`${styles.challengeCard} ${scramDone ? styles.done : ''}`} onClick={() => !scramDone && navigate('/scram')} disabled={scramDone}>
          <div className={styles.cardLeft}>
            <div className={styles.cardName}>SCRAM</div>
            <div className={styles.cardDesc}>Name as many as you can in 60s</div>
          </div>
          {scramDone ? <div className={styles.doneChip}>✓ {scramScore}</div> : <div className={styles.playChip}>PLAY</div>}
        </button>
        <div className={`${styles.challengeCard} ${styles.soon}`}>
          <div className={styles.cardLeft}>
            <div className={styles.cardName}>RANKLE</div>
            <div className={styles.cardDesc}>Coming soon</div>
          </div>
          <div className={styles.soonChip}>SOON</div>
        </div>
      </div>
    </div>
  )
}