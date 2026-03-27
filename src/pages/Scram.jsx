import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { sb } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { matchAnswer } from '../lib/matching'
import styles from './Scram.module.css'

const DURATION = 60

export default function Scram() {
  const [screen, setScreen] = useState('intro')
  const [challenge, setChallenge] = useState(null)
  const [timeLeft, setTimeLeft] = useState(DURATION)
  const [input, setInput] = useState('')
  const [correctAnswers, setCorrectAnswers] = useState([])
  const [allSubmitted, setAllSubmitted] = useState([])
  const [feedback, setFeedback] = useState({ msg: '', type: '' })
  const [shake, setShake] = useState(false)
  const [warnFlash, setWarnFlash] = useState(false)
  const inputRef = useRef(null)
  const timerRef = useRef(null)
  const feedbackRef = useRef(null)
  const correctRef = useRef([])
  const navigate = useNavigate()
  const { user, refreshProgression } = useAuth()

  useEffect(() => { loadChallenge() }, [])

  useEffect(() => {
    correctRef.current = correctAnswers
  }, [correctAnswers])

  async function loadChallenge() {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await sb
      .from('daily_challenges')
      .select('*')
      .eq('challenge_date', today)
      .eq('is_published', true)
      .single()
    setChallenge(data)
  }

  function startGame() {
    setCorrectAnswers([])
    correctRef.current = []
    setAllSubmitted([])
    setInput('')
    setFeedback({ msg: '', type: '' })
    setTimeLeft(DURATION)
    setScreen('game')
    setTimeout(() => inputRef.current?.focus(), 100)

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          setScreen('result')
          saveResult(correctRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  async function saveResult(finalAnswers) {
    if (!user || !challenge) return
    const score = finalAnswers.length
    const total = challenge.accepted_answers_count || 0
    const pct = total > 0 ? Math.round((score / total) * 100) : 0
    try {
      await sb.from('challenge_attempts').insert({
        user_id: user.id,
        daily_challenge_id: challenge.id,
        challenge_type_id: challenge.challenge_type_id,
        category_id: challenge.category_id,
        subcategory_id: challenge.subcategory_id,
        challenge_date: challenge.challenge_date,
        completed: true,
        won: score > 0,
        score: pct,
        raw_score: score,
        correct_answers_count: score,
        total_possible: total,
        attempt_data: { answers_correct: finalAnswers },
        completed_at: new Date().toISOString(),
      })
      await sb.rpc('award_xp', { p_user_id: user.id, p_xp: score * 10 })
      await sb.rpc('update_streak', { p_user_id: user.id })
      await refreshProgression()
    } catch (err) {
      console.error('Error saving:', err)
    }
  }

  function setFeedbackMsg(msg, type) {
    clearTimeout(feedbackRef.current)
    setFeedback({ msg, type })
    if (msg) feedbackRef.current = setTimeout(() => setFeedback({ msg: '', type: '' }), 2000)
  }

  function handleSubmit() {
    if (!challenge || !input.trim()) return
    const accepted = challenge.content?.accepted_answers || []
    const result = matchAnswer(input, accepted, correctRef.current)

    if (result.result === 'correct') {
      const updated = [...correctRef.current, result.canonical]
      setCorrectAnswers(updated)
      correctRef.current = updated
      setAllSubmitted(prev => [...prev, { input, canonical: result.canonical, correct: true }])
      setInput('')
      setFeedback({ msg: '', type: '' })
    } else if (result.result === 'duplicate') {
      setFeedbackMsg('Already got that one!', 'warning')
      triggerShake()
    } else if (result.result === 'close') {
      setAllSubmitted(prev => [...prev, { input, correct: false }])
      setWarnFlash(true)
      setTimeout(() => setWarnFlash(false), 600)
      setFeedbackMsg('Not quite — check your spelling', 'warning')
    } else {
      setAllSubmitted(prev => [...prev, { input, correct: false }])
      triggerShake()
    }
  }

  function triggerShake() {
    setShake(true)
    setTimeout(() => setShake(false), 400)
  }

  function handleQuit() {
    if (confirm('Quit Scram? Your progress will be lost.')) {
      clearInterval(timerRef.current)
      navigate('/')
    }
  }

  const pct = (timeLeft / DURATION) * 100
  const barClass = timeLeft <= 10 ? styles.danger : timeLeft <= 20 ? styles.warning : ''
  const score = correctAnswers.length
  const total = challenge?.accepted_answers_count || 0
  const scorePct = total > 0 ? Math.round((score / total) * 100) : 0
  const resultMsg =
    scorePct >= 80 ? 'Outstanding! 🎉' :
    scorePct >= 60 ? 'Great effort! 💪' :
    scorePct >= 40 ? 'Not bad at all!' :
    scorePct >= 20 ? 'Keep practising!' : 'Better luck next time!'

  if (screen === 'intro') return (
    <div className={styles.introPage}>
      <nav className={styles.nav}>
        <button className={styles.backBtn} onClick={() => navigate('/')}>
          <BackIcon /> Back
        </button>
        <div className={styles.logo}>rumblo</div>
        <div style={{ width: 60 }} />
      </nav>
      <div className={`${styles.introBody} fade-in`}>
        <div className={styles.badge}><span className={styles.badgeLetter}>S</span></div>
        <h1>SCRAM</h1>
        <p>Name as many things as you can from a category in 60 seconds.</p>
        <div className={styles.introActions}>
          <button className={styles.btnPrimary} onClick={startGame}>START GAME</button>
          <button className={styles.btnSecondary} onClick={() => alert('Type any answer and press Enter.\nClose spellings still count.\n60 seconds — go!')}>HOW TO PLAY</button>
        </div>
      </div>
    </div>
  )

  if (screen === 'game') return (
    <div className={styles.gamePage}>
      <nav className={styles.gameNav}>
        <button className={styles.backBtn} onClick={handleQuit}><BackIcon /></button>
        <div className={styles.gameLogo}>scram</div>
        <div style={{ width: 40 }} />
      </nav>
      <div className={styles.timerWrap}>
        <div className={styles.timerSecs}>{timeLeft}</div>
        <div className={styles.timerTrack}>
          <div className={`${styles.timerFill} ${barClass}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className={styles.gameBody}>
        <div className={styles.categoryLabel}>{challenge?.content?.category_label || 'Category'}</div>
        <div className={styles.inputWrap}>
          <input
            ref={inputRef}
            className={`${styles.gameInput} ${shake ? styles.shake : ''} ${warnFlash ? styles.warnFlash : ''}`}
            type="text" placeholder="Type answer..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
          />
          {input && (
            <button className={styles.clearBtn} onClick={() => { setInput(''); inputRef.current?.focus() }}>✕</button>
          )}
        </div>
        <div className={`${styles.feedbackMsg} ${feedback.type === 'warning' ? styles.feedbackWarning : ''}`}>
          {feedback.msg}
        </div>
        <div className={styles.scoreLine}>
          <span className={styles.scoreCount}>{score}</span>
          <span className={styles.scoreLabel}>correct</span>
        </div>
        <div className={styles.answersGrid}>
          {correctAnswers.map((a, i) => <div key={i} className={styles.answerPill}>{a}</div>)}
        </div>
      </div>
    </div>
  )

  return (
    <div className={styles.resultPage}>
      <nav className={styles.nav}>
        <div className={styles.logo}>rumblo</div>
      </nav>
      <div className={`${styles.resultBody} fade-in`}>
        <div className={styles.scoreWrap}>
          <p className={styles.resultLabel}>Your score</p>
          <div className={styles.bigScore}>{score}</div>
          <p className={styles.resultMsg}>{resultMsg}</p>
        </div>
        <div className={styles.divider} />
        <div className={styles.statsGrid}>
          <div className={styles.statCard}><div className={styles.statVal}>{score}</div><div className={styles.statLbl}>Correct answers</div></div>
          <div className={styles.statCard}><div className={styles.statVal}>{total}</div><div className={styles.statLbl}>Total possible</div></div>
        </div>
        {correctAnswers.length > 0 && (
          <div className={styles.yourAnswers}>
            <p className={styles.yourAnswersLabel}>Your answers</p>
            <div className={styles.resultPills}>
              {correctAnswers.map((a, i) => <div key={i} className={styles.resultPill}>{a}</div>)}
            </div>
          </div>
        )}
        <button className={styles.btnPrimary} onClick={() => navigate('/')}>Back to challenges</button>
      </div>
    </div>
  )
}

function BackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 12H5M12 5l-7 7 7 7"/>
    </svg>
  )
}