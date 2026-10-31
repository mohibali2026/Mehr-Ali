import type { Metadata } from 'next'
import TicTacToe from './TicTacToe'

export const metadata: Metadata = {
  title: "Irfan's Tic-Tac-Toe",
  description: 'Two players, one screen. Enter your names, play, and every game becomes part of the story.',
}

export default function Irfan2() {
  return <TicTacToe />
}
