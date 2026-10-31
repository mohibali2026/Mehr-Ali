import type { DataConnection, Peer, PeerError } from 'peerjs'

// Players find each other through a few shared "lobby" names on the free PeerJS server.
// The first player to take a lobby name waits there and the next player connects to it.
// After that the two browsers talk directly, and the lobby name is given back for the next pair.
const LOBBY = 'mehralialtaf-irfan2-lobby-'
// More than one lobby, so a player whose browser froze while waiting can't block everyone else
const SLOTS = 3
const TIMEOUT = 8000

export type Match = { peer: Peer; conn: DataConnection; host: boolean }

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const errorType = (e: unknown) => (e as PeerError<string>)?.type

export function findMatch() {
  let cancelled = false
  const peers = new Set<Peer>()

  const drop = (p: Peer) => {
    peers.delete(p)
    p.destroy()
  }

  const cancel = () => {
    cancelled = true
    for (const p of peers) p.destroy()
    peers.clear()
  }

  const open = (PeerClass: typeof Peer, id?: string) =>
    new Promise<Peer>((resolve, reject) => {
      if (cancelled) return reject(new Error('cancelled'))
      const p = id ? new PeerClass(id, { debug: 0 }) : new PeerClass({ debug: 0 })
      peers.add(p)
      let opened = false
      p.on('open', () => {
        opened = true
        resolve(p)
      })
      p.on('error', (e) => {
        if (opened) return
        drop(p)
        reject(e)
      })
    })

  // Wait in the lobby until someone connects. Anyone after the first is told the game is full.
  const host = (p: Peer) =>
    new Promise<DataConnection>((resolve, reject) => {
      let taken = false
      p.on('connection', (conn) => {
        if (taken) {
          conn.on('open', () => {
            conn.send({ t: 'busy' })
            setTimeout(() => conn.close(), 500)
          })
          return
        }
        taken = true
        const timer = setTimeout(() => {
          taken = false
          conn.close()
        }, TIMEOUT)
        conn.on('open', () => {
          clearTimeout(timer)
          conn.send({ t: 'hello' })
          resolve(conn)
        })
      })
      p.on('close', () => reject(new Error('closed')))
      p.on('disconnected', () => {
        if (!taken) reject(new Error('lost the server'))
      })
    })

  // Knock on a lobby. Resolves with the connection once the host says hello, or null if nobody answers.
  const join = (p: Peer, id: string) =>
    new Promise<DataConnection | null>((resolve) => {
      let settled = false
      const conn = p.connect(id, { reliable: true })
      const done = (c: DataConnection | null) => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        p.off('error', onError)
        if (!c) conn.close()
        resolve(c)
      }
      const timer = setTimeout(() => done(null), TIMEOUT)
      const onError = (e: PeerError<string>) => {
        if (e.type === 'peer-unavailable') done(null)
      }
      p.on('error', onError)
      conn.on('data', (msg) => {
        const t = (msg as { t?: string }).t
        if (t === 'hello') done(conn)
        else if (t === 'busy') done(null)
      })
      conn.on('close', () => done(null))
    })

  const run = async (): Promise<Match> => {
    const { Peer: PeerClass } = await import('peerjs')
    let guest: Peer | null = null

    const finish = (match: Match) => {
      // The lobby name is given back; the game connection stays open
      match.peer.disconnect()
      for (const p of peers) if (p !== match.peer) drop(p)
      peers.clear()
      return match
    }

    while (!cancelled) {
      for (let slot = 0; slot < SLOTS && !cancelled; slot++) {
        const id = LOBBY + slot
        let lobby: Peer | null = null
        try {
          lobby = await open(PeerClass, id)
        } catch (e) {
          if (errorType(e) !== 'unavailable-id') throw e
        }
        if (lobby) {
          try {
            return finish({ peer: lobby, conn: await host(lobby), host: true })
          } catch {
            drop(lobby)
            continue
          }
        }
        guest ??= await open(PeerClass)
        const conn = await join(guest, id)
        if (conn && !cancelled) return finish({ peer: guest, conn, host: false })
      }
      await sleep(800 + Math.random() * 1200)
    }
    throw new Error('cancelled')
  }

  const promise = run().catch((e) => {
    cancel()
    throw e
  })
  return { promise, cancel, isCancelled: () => cancelled }
}
