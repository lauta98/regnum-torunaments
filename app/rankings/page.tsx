import { redirect } from 'next/navigation'

export default function RankingsPage() {
  redirect('/jugadores?vista=ranking')
}
