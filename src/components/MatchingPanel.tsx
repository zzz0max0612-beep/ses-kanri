'use client'

import { useState } from 'react'
import { Project, Engineer } from '@/types'
import { createClient } from '@/lib/supabase-browser'

const supabase = createClient()

type MatchResult = {
  engineer_id: string
  score: number
  matched_skills: string[]
  reason: string
}

type Props = {
  project: Project
}

const workStyleLabel: Record<string, string> = {
  remote: 'リモート',
  onsite: '常駐',
  hybrid: 'ハイブリッド',
}

const salesStatusColor: Record<string, string> = {
  '営業中': 'bg-green-100 text-green-700',
  '並行営業中': 'bg-yellow-100 text-yellow-700',
  '稼働中': 'bg-blue-100 text-blue-700',
  '調整中': 'bg-orange-100 text-orange-700',
  '停止中': 'bg-gray-100 text-gray-500',
}

const rankColor = ['text-yellow-500', 'text-gray-400', 'text-amber-600', 'text-gray-500', 'text-gray-500']
const rankLabel = ['1st', '2nd', '3rd', '4th', '5th']

export default function MatchingPanel({ project }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [matches, setMatches] = useState<(MatchResult & { engineer: Engineer })[]>([])
  const [error, setError] = useState('')

  const handleMatch = async () => {
    if (open) {
      setOpen(false)
      return
    }

    setLoading(true)
    setError('')
    setMatches([])

    const { data: engineers, error: fetchError } = await supabase
      .from('engineers')
      .select('*')

    if (fetchError || !engineers || engineers.length === 0) {
      setError('要員データの取得に失敗しました')
      setLoading(false)
      return
    }

    const res = await fetch('/api/matching', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project, engineers }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(`エラー: ${data.error ?? res.status}`)
      console.error('API error:', data)
      setLoading(false)
      return
    }
    const results: MatchResult[] = data.matches ?? []

    const enriched = results
      .slice(0, 5)
      .map((m) => ({
        ...m,
        engineer: engineers.find((e) => e.id === m.engineer_id) as Engineer,
      }))
      .filter((m) => m.engineer)

    setMatches(enriched)
    setOpen(true)
    setLoading(false)
  }

  return (
    <div className="border-t pt-2">
      <button
        onClick={handleMatch}
        disabled={loading}
        className="text-sm text-purple-600 hover:text-purple-800 disabled:opacity-50"
      >
        {loading ? '解析中...' : open ? 'マッチングを閉じる' : 'マッチング確認'}
      </button>

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

      {open && matches.length > 0 && (
        <div className="mt-3 flex flex-col gap-3">
          {matches.map((m, i) => (
            <div key={m.engineer_id} className="border rounded p-3 bg-gray-50">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${rankColor[i]}`}>{rankLabel[i]}</span>
                  <span className="font-semibold text-gray-900 text-sm">{m.engineer.name}</span>
                  {m.engineer.sales_status && (
                    <span className={`text-xs px-1.5 py-0.5 rounded ${salesStatusColor[m.engineer.sales_status] ?? 'bg-gray-100 text-gray-500'}`}>
                      {m.engineer.sales_status}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-lg font-bold text-purple-700">{m.score}</span>
                  <span className="text-xs text-gray-400">点</span>
                </div>
              </div>

              {/* スコアバー */}
              <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                <div
                  className="bg-purple-500 h-1.5 rounded-full"
                  style={{ width: `${m.score}%` }}
                />
              </div>

              {/* 一致スキル */}
              {m.matched_skills.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {m.matched_skills.map((skill) => (
                    <span key={skill} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              {/* 補足情報 */}
              <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-1.5">
                {m.engineer.experience_years != null && (
                  <span>経験 {m.engineer.experience_years}年</span>
                )}
                {m.engineer.work_style && (
                  <span>{workStyleLabel[m.engineer.work_style] ?? m.engineer.work_style}</span>
                )}
                {m.engineer.available_date && (
                  <span>稼働 {m.engineer.available_date}</span>
                )}
              </div>

              {/* 理由 */}
              <p className="text-xs text-gray-600 leading-relaxed">{m.reason}</p>
            </div>
          ))}
        </div>
      )}

      {open && matches.length === 0 && !loading && (
        <p className="text-xs text-gray-500 mt-2">マッチする要員が見つかりませんでした</p>
      )}
    </div>
  )
}
