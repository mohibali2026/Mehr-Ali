'use client'

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import type { FormEvent } from 'react'
import styles from './tictactoe.module.css'

type Mark = 'X' | 'O'
type Cell = Mark | null
type Players = Record<Mark, string>
// One finished game. It keeps names rather than marks, so the story still reads right if the players swap X and O.
// way is the winning line (an index into LINES), or -1 for a draw.
type Result = { winner: string | null; loser: string | null; mark: Mark | null; way: number; quick: boolean }
type Saved = { last: Players; stories: Record<string, Result[]> }

// The stories stay on this device
const STORE = 'irfan2-tic-tac-toe'

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
]
const LINE_NAMES = [
  'in the top row', 'in the middle row', 'in the bottom row',
  'down the left side', 'down the middle', 'down the right side',
  'from corner to corner', 'from corner to corner',
]
const EMPTY: Cell[] = Array(9).fill(null)
const other = (m: Mark): Mark => (m === 'X' ? 'O' : 'X')

// Each pair of players has their own story, whoever plays X or O
const pairKey = (p: Players) =>
  [p.X, p.O]
    .map((n) => n.toLowerCase())
    .sort()
    .join(' & ')

// null while the game is still going; mark is null for a draw
function outcome(b: Cell[]): { mark: Mark | null; way: number } | null {
  for (let way = 0; way < LINES.length; way++) {
    const [a, c, d] = LINES[way]
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return { mark: b[a], way }
  }
  return b.every(Boolean) ? { mark: null, way: -1 } : null
}

// X starts the odd games and O the even ones, then they take turns
function turnOf(b: Cell[], round: number): Mark {
  const starter: Mark = round % 2 === 0 ? 'X' : 'O'
  return b.filter(Boolean).length % 2 === 0 ? starter : other(starter)
}

const wins = (story: Result[], name: string) => story.filter((r) => r.winner === name).length

// Turns game number i into a sentence, looking back at the games before it
function tell(story: Result[], i: number) {
  const r = story[i]
  const before = story.slice(0, i)
  const prev = before[before.length - 1]

  if (!r.winner || !r.loser) {
    if (i === 0) return 'The first game was a draw! Nobody got three in a row.'
    if (prev && !prev.winner) return 'Another draw! These two know all of each other’s tricks.'
    return 'A draw! Nobody got three in a row.'
  }

  const { winner: w, loser: l } = r
  let streak = 0
  for (let j = i; j >= 0 && story[j].winner === w; j--) streak++

  const opener =
    i === 0
      ? `${w} won the very first game`
      : prev?.winner === l
        ? `${w} got revenge on ${l}`
        : streak > 1
          ? `${w} won again`
          : `${w} beat ${l}`
  let text = `${opener} with three ${r.mark}’s ${LINE_NAMES[r.way]}!`
  if (r.quick) text += ' The fastest win possible! ⚡'

  const wNow = wins(before, w) + 1
  const lNow = wins(before, l)
  if (streak >= 3) text += ` That’s ${streak} wins in a row! 🔥`
  else if (wNow === lNow) text += ` The score is tied, ${wNow}–${lNow}.`
  else if (i > 0 && wNow - 1 === lNow) text += ` ${w} takes the lead, ${wNow}–${lNow}.`
  return text
}

// The saved stories live in localStorage. React reads them through useSyncExternalStore,
// so the first render matches the server's HTML and the saved names appear right after.
let cache: string | null | undefined
const listeners = new Set<() => void>()

function readSaved() {
  if (cache === undefined) {
    try {
      cache = localStorage.getItem(STORE)
    } catch {
      cache = null
    }
  }
  return cache
}

function writeSaved(saved: Saved) {
  cache = JSON.stringify(saved)
  try {
    localStorage.setItem(STORE, cache)
  } catch {
    // Private browsing can block storage. The game still works, it just forgets the stories on reload.
  }
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function parse(raw: string | null): Saved | null {
  try {
    const saved = raw ? (JSON.parse(raw) as Saved) : null
    return saved?.last && saved.stories ? saved : null
  } catch {
    return null
  }
}

function MarkIcon({ mark }: { mark: Mark }) {
  return mark === 'X' ? (
    <svg viewBox="0 0 100 100" className={`${styles.mark} ${styles.x}`}>
      <path d="M22 22 L78 78" />
      <path d="M78 22 L22 78" className={styles.second} />
    </svg>
  ) : (
    <svg viewBox="0 0 100 100" className={`${styles.mark} ${styles.o}`}>
      <circle cx="50" cy="50" r="29" />
    </svg>
  )
}

export default function TicTacToe() {
  const raw = useSyncExternalStore(subscribe, readSaved, () => null)
  const saved = useMemo(() => parse(raw), [raw])
  const stories = saved?.stories ?? {}
  const storyOf = (p: Players) => stories[pairKey(p)] ?? []

  const [players, setPlayers] = useState<Players | null>(null)
  // The names typed so far; until someone types, the last players' names are filled in
  const [typed, setTyped] = useState<Players | null>(null)
  const [board, setBoard] = useState<Cell[]>(EMPTY)
  const [round, setRound] = useState(0)
  const [confirmErase, setConfirmErase] = useState(false)
  const listRef = useRef<HTMLOListElement>(null)

  const story = players ? storyOf(players) : []

  // Keep the newest part of the story in view
  useEffect(() => {
    const list = listRef.current
    if (list) list.scrollTop = list.scrollHeight
  }, [story.length, players])

  if (!players) {
    const draft = typed ?? saved?.last ?? { X: '', O: '' }
    const names = { X: draft.X.trim(), O: draft.O.trim() }
    const sameNames = !!names.X && names.X.toLowerCase() === names.O.toLowerCase()
    const canStart = !!names.X && !!names.O && !sameNames
    const played = canStart ? storyOf(names).length : 0

    const start = (e: FormEvent) => {
      e.preventDefault()
      if (!canStart) return
      writeSaved({ last: names, stories })
      setPlayers(names)
      setBoard(EMPTY)
      setRound(played)
    }

    return (
      <main className={styles.app}>
        <form className={styles.setup} onSubmit={start}>
          <p className={styles.eyebrow}>{"// Irfan's Tic-Tac-Toe"}</p>
          <h1 className={styles.title}>Who’s playing?</h1>
          {(['X', 'O'] as const).map((m, i) => (
            <label key={i} className={styles.field}>
              <span className={styles.badge}>
                <MarkIcon mark={m} />
              </span>
              <input
                value={draft[m]}
                onChange={(e) => setTyped({ ...draft, [m]: e.target.value })}
                placeholder={`Player ${i + 1} name`}
                aria-label={`Player ${i + 1} name, plays ${m}`}
                maxLength={16}
                autoComplete="off"
                enterKeyHint={m === 'X' ? 'next' : 'go'}
              />
            </label>
          ))}
          {sameNames && <p className={styles.small}>Please use two different names.</p>}
          <button type="submit" className={`${styles.btn} ${styles.primary}`} disabled={!canStart}>
            Start
          </button>
          {played > 0 && (
            <p className={styles.small}>
              {names.X} and {names.O} have played {played} {played === 1 ? 'game' : 'games'}. The story continues!
            </p>
          )}
        </form>
      </main>
    )
  }

  const over = outcome(board)
  const turn = turnOf(board, round)
  const draws = story.filter((r) => !r.winner).length

  const play = (i: number) => {
    if (over || board[i]) return
    const next = [...board]
    next[i] = turn
    setBoard(next)
    const end = outcome(next)
    if (!end) return
    const won = end.mark
    const result: Result = {
      winner: won && players[won],
      loser: won && players[other(won)],
      mark: won,
      way: end.way,
      // Five moves in the whole game is the quickest anyone can win
      quick: !!won && next.filter(Boolean).length === 5,
    }
    writeSaved({ last: players, stories: { ...stories, [pairKey(players)]: [...story, result] } })
  }

  const again = () => {
    setBoard(EMPTY)
    setRound(story.length)
  }

  // Erasing the story needs a second tap
  const erase = () => {
    if (!confirmErase) {
      setConfirmErase(true)
      setTimeout(() => setConfirmErase(false), 3000)
      return
    }
    setConfirmErase(false)
    writeSaved({ last: players, stories: { ...stories, [pairKey(players)]: [] } })
    setBoard(EMPTY)
    setRound(0)
  }

  let status: string
  if (over) status = over.mark ? `${players[over.mark]} wins! 🎉` : 'Draw!'
  else status = `${players[turn]}’s turn`

  return (
    <main className={styles.app}>
      <div className={styles.play}>
        <section className={styles.game}>
          <p className={styles.eyebrow}>{"// Irfan's Tic-Tac-Toe"}</p>

          <div className={styles.score}>
            <div className={!over && turn === 'X' ? styles.active : ''}>
              <span>{players.X} · X</span>
              <strong>{wins(story, players.X)}</strong>
            </div>
            <div>
              <span>Draws</span>
              <strong>{draws}</strong>
            </div>
            <div className={!over && turn === 'O' ? styles.active : ''}>
              <span>{players.O} · O</span>
              <strong>{wins(story, players.O)}</strong>
            </div>
          </div>

          <div className={styles.board}>
            {board.map((cell, i) => (
              <button
                key={i}
                className={`${styles.cell} ${over && over.way >= 0 && LINES[over.way].includes(i) ? styles.win : ''}`}
                onClick={() => play(i)}
                disabled={!!over || !!cell}
                aria-label={cell ?? `Square ${i + 1}`}
              >
                {cell && <MarkIcon mark={cell} />}
              </button>
            ))}
          </div>

          <p className={styles.status}>{status}</p>

          <div className={styles.actions}>
            {over && (
              <button className={`${styles.btn} ${styles.primary}`} onClick={again}>
                Play again
              </button>
            )}
            <button
              className={styles.btn}
              onClick={() => {
                setTyped(null)
                setPlayers(null)
              }}
            >
              Change players
            </button>
          </div>
        </section>

        <aside className={styles.story}>
          <div className={styles.storyHead}>
            <p className={styles.eyebrow}>{'// The story so far'}</p>
            {story.length > 0 && (
              <button className={styles.link} onClick={erase}>
                {confirmErase ? 'Tap again to erase' : 'New story'}
              </button>
            )}
          </div>
          {story.length === 0 ? (
            <p className={styles.small}>No games yet. The story starts with the first move!</p>
          ) : (
            <ol ref={listRef} className={styles.chapters}>
              {story.map((_, i) => (
                <li key={i}>
                  <span>Game {i + 1}</span>
                  <p>{tell(story, i)}</p>
                </li>
              ))}
            </ol>
          )}
        </aside>
      </div>
    </main>
  )
}
