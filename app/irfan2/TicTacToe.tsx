'use client'

import { useEffect, useReducer, useRef, useState } from 'react'
import { findMatch, type Match } from './match'
import styles from './tictactoe.module.css'

type Mark = 'X' | 'O'
type Cell = Mark | null
type Mode = 'practice' | 'online'
type Phase = 'searching' | 'playing' | 'left' | 'error'
type Msg = { t: 'move'; r: number; i: number } | { t: 'again'; r: number } | { t: 'ping' } | { t: 'bye' }

type Game = {
  mode: Mode
  me: Mark
  board: Cell[]
  round: number
  score: { me: number; them: number; draw: number }
  readyMe: boolean
  readyThem: boolean
}
type Action =
  | { type: 'start'; mode: Mode; me: Mark }
  | { type: 'move'; mark: Mark; i: number; round: number }
  | { type: 'again'; who: 'me' | 'them'; round: number }

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
]
const EMPTY: Cell[] = Array(9).fill(null)
const other = (m: Mark): Mark => (m === 'X' ? 'O' : 'X')

// null while the round is still going; win is null for a draw
function result(b: Cell[]): { win: Cell; line: number[] } | null {
  for (const line of LINES) {
    const [a, c, d] = line
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return { win: b[a], line }
  }
  return b.every(Boolean) ? { win: null, line: [] } : null
}

// X starts the even rounds and O the odd ones, then they take turns
function turnOf(b: Cell[], round: number): Mark {
  const starter: Mark = round % 2 === 0 ? 'X' : 'O'
  return b.filter(Boolean).length % 2 === 0 ? starter : other(starter)
}

// The practice computer: wins or blocks when it can, but sometimes plays a random move so it can be beaten
function computerMove(b: Cell[], mark: Mark) {
  const free = b.flatMap((c, i) => (c ? [] : [i]))
  const pick = (list: number[]) => list[Math.floor(Math.random() * list.length)]
  if (Math.random() < 0.25) return pick(free)
  for (const m of [mark, other(mark)])
    for (const i of free) {
      const next = [...b]
      next[i] = m
      if (result(next)?.win === m) return i
    }
  if (!b[4]) return 4
  const corners = [0, 2, 6, 8].filter((i) => !b[i])
  return pick(corners.length ? corners : free)
}

function fresh(mode: Mode, me: Mark): Game {
  return { mode, me, board: EMPTY, round: 0, score: { me: 0, them: 0, draw: 0 }, readyMe: false, readyThem: false }
}

function reduce(g: Game, a: Action): Game {
  switch (a.type) {
    case 'start':
      return fresh(a.mode, a.me)
    case 'move': {
      if (a.round !== g.round || g.board[a.i] || result(g.board) || turnOf(g.board, g.round) !== a.mark) return g
      const board = [...g.board]
      board[a.i] = a.mark
      const r = result(board)
      const s = g.score
      const score = !r ? s : r.win === null ? { ...s, draw: s.draw + 1 } : r.win === g.me ? { ...s, me: s.me + 1 } : { ...s, them: s.them + 1 }
      return { ...g, board, score }
    }
    case 'again': {
      if (a.round !== g.round || !result(g.board)) return g
      const next = { ...g, readyMe: g.readyMe || a.who === 'me', readyThem: g.readyThem || a.who === 'them' }
      // Online, a new round starts once both players asked for it
      if (g.mode === 'practice' || (next.readyMe && next.readyThem))
        return { ...next, board: EMPTY, round: g.round + 1, readyMe: false, readyThem: false }
      return next
    }
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
  const [phase, setPhase] = useState<Phase>('searching')
  const [game, dispatch] = useReducer(reduce, fresh('practice', 'X'))
  const matchRef = useRef<Match | null>(null)

  // Look for another player. Meanwhile the board is a practice game against the computer.
  useEffect(() => {
    if (phase !== 'searching') return
    dispatch({ type: 'start', mode: 'practice', me: 'X' })
    let search: ReturnType<typeof findMatch> | null = null

    const begin = () => {
      const s = findMatch()
      search = s
      s.promise.then(
        (match) => {
          if (s.isCancelled()) return match.peer.destroy()
          matchRef.current = match
          dispatch({ type: 'start', mode: 'online', me: match.host ? 'X' : 'O' })
          setPhase('playing')
        },
        (err: Error) => {
          if (s.isCancelled()) return
          console.error(err)
          setPhase('error')
        },
      )
    }
    const stop = () => {
      search?.cancel()
      search = null
    }
    // Leave the lobby while the page is hidden, so nobody gets matched with an empty tab
    const onVisibility = () => {
      if (document.hidden) stop()
      else if (!search) begin()
    }

    if (!document.hidden) begin()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      stop()
    }
  }, [phase])

  // Talk to the other player
  useEffect(() => {
    if (phase !== 'playing' || !matchRef.current) return
    const { peer, conn, host } = matchRef.current
    const them: Mark = host ? 'O' : 'X'
    let lastHeard = Date.now()

    const leave = () => setPhase((p) => (p === 'playing' ? 'left' : p))
    const onData = (raw: unknown) => {
      lastHeard = Date.now()
      const m = raw as Msg
      if (m.t === 'move') dispatch({ type: 'move', mark: them, i: m.i, round: m.r })
      else if (m.t === 'again') dispatch({ type: 'again', who: 'them', round: m.r })
      else if (m.t === 'bye') leave()
    }
    const send = (m: Msg) => {
      if (conn.open) conn.send(m)
    }
    // A closed iPad tab doesn't always say goodbye, so treat 10 quiet seconds as leaving
    const beat = setInterval(() => {
      send({ t: 'ping' })
      if (Date.now() - lastHeard > 10000) leave()
    }, 2000)
    const sayBye = () => send({ t: 'bye' })

    conn.on('data', onData)
    conn.on('close', leave)
    conn.on('error', leave)
    window.addEventListener('pagehide', sayBye)
    return () => {
      clearInterval(beat)
      window.removeEventListener('pagehide', sayBye)
      sayBye()
      conn.off('data', onData)
      conn.off('close', leave)
      conn.off('error', leave)
      setTimeout(() => peer.destroy(), 300)
      matchRef.current = null
    }
  }, [phase])

  // The practice computer takes its turn
  useEffect(() => {
    if (game.mode !== 'practice' || result(game.board)) return
    const ai = other(game.me)
    if (turnOf(game.board, game.round) !== ai) return
    const timer = setTimeout(
      () => dispatch({ type: 'move', mark: ai, i: computerMove(game.board, ai), round: game.round }),
      450,
    )
    return () => clearTimeout(timer)
  }, [game])

  const online = game.mode === 'online'
  const over = result(game.board)
  const myTurn = !over && turnOf(game.board, game.round) === game.me
  const them = online ? 'Them' : 'Computer'

  const play = (i: number) => {
    if (!myTurn || game.board[i]) return
    dispatch({ type: 'move', mark: game.me, i, round: game.round })
    if (online) matchRef.current?.conn.send({ t: 'move', r: game.round, i })
  }

  const again = () => {
    dispatch({ type: 'again', who: 'me', round: game.round })
    if (online) matchRef.current?.conn.send({ t: 'again', r: game.round })
  }

  let line: string
  if (over) line = over.win === null ? 'Draw!' : over.win === game.me ? 'You win! 🎉' : online ? 'They win!' : 'The computer wins!'
  else if (myTurn) line = 'Your turn'
  else line = online ? 'Their turn…' : 'Computer is thinking…'

  return (
    <main className={styles.app}>
      <header className={styles.head}>
        <p className={styles.eyebrow}>{"// Irfan's Tic-Tac-Toe"}</p>
        {phase === 'searching' && (
          <p className={styles.status}>
            <span className={styles.pulse} />
            Looking for a player… practice with the computer while you wait
          </p>
        )}
        {phase === 'playing' && (
          <p className={styles.status}>
            <span className={`${styles.pulse} ${styles.live}`} />
            Playing online · you are {game.me}
          </p>
        )}
      </header>

      <div className={styles.score}>
        <div>
          <span>You · {game.me}</span>
          <strong>{game.score.me}</strong>
        </div>
        <div>
          <span>Draws</span>
          <strong>{game.score.draw}</strong>
        </div>
        <div>
          <span>
            {them} · {other(game.me)}
          </span>
          <strong>{game.score.them}</strong>
        </div>
      </div>

      <div className={styles.board}>
        {game.board.map((cell, i) => (
          <button
            key={i}
            className={`${styles.cell} ${over?.line.includes(i) ? styles.win : ''}`}
            onClick={() => play(i)}
            disabled={!myTurn || !!cell}
            aria-label={cell ?? `Square ${i + 1}`}
          >
            {cell && <MarkIcon mark={cell} />}
          </button>
        ))}
      </div>

      <div className={styles.foot}>
        <p className={styles.line}>{line}</p>
        {over &&
          (game.readyMe ? (
            <p className={styles.small}>Waiting for them to press Play again…</p>
          ) : (
            <button className={`${styles.btn} ${styles.primary}`} onClick={again}>
              Play again
            </button>
          ))}
        {over && game.readyThem && !game.readyMe && <p className={styles.small}>They want to play again!</p>}
      </div>

      {(phase === 'left' || phase === 'error') && (
        <div className={styles.overlay}>
          <div className={styles.card}>
            <p>
              {phase === 'left'
                ? 'The other player left the game.'
                : "Couldn't reach the game server. Check your internet connection."}
            </p>
            <button className={`${styles.btn} ${styles.primary}`} onClick={() => setPhase('searching')}>
              Find a new player
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
