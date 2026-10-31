import type { Metadata } from 'next'
import TicTacToe from './TicTacToe'

export const metadata: Metadata = {
  title: "Irfan's Tic-Tac-Toe",
  description: 'Play Tic-Tac-Toe with whoever else is on this page.',
}

export default function Irfan2() {
  return <TicTacToe />
}
