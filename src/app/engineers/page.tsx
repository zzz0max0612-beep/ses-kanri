'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import { Engineer, SkillSheet } from '@/types'
import EngineerCard from '@/components/EngineerCard'

const supabase = createClient()

const ACTIVE_STATUSES = ['提案中', '面談中', '合格', '稼働中']

export default function EngineersPage() {
  const [engineers, setEngineers] = useState<Engineer[]>([])
  const [skillSheets, setSkillSheets] = useState<Record<string, SkillSheet[]>>({})
  const [proposalCounts, setProposalCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  const fetchEngineers = async () => {
    const { data: engineerData, error } = await supabase
      .from('engineers')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      setLoading(false)
      return
    }

    // 表示名を取得してマージ
    const createdByIds = (engineerData ?? []).map((e) => e.created_by).filter(Boolean)
    let displayNameMap: Record<string, string> = {}
    if (createdByIds.length > 0) {
      const { data: usersData } = await supabase
        .from('users')
        .select('id, display_name')
        .in('id', createdByIds)
      for (const u of usersData ?? []) {
        displayNameMap[u.id] = u.display_name
      }
    }

    const engineersWithName = (engineerData ?? []).map((e) => ({
      ...e,
      created_by_name: e.created_by ? (displayNameMap[e.created_by] ?? null) : null,
    }))
    setEngineers(engineersWithName)

    // スキルシートをまとめて取得
    if (engineerData && engineerData.length > 0) {
      const ids = engineerData.map((e) => e.id)
      const { data: sheetData } = await supabase
        .from('skill_sheets')
        .select('*')
        .in('engineer_id', ids)

      // engineer_id でグループ化
      const grouped: Record<string, SkillSheet[]> = {}
      for (const sheet of sheetData ?? []) {
        if (!grouped[sheet.engineer_id]) grouped[sheet.engineer_id] = []
        grouped[sheet.engineer_id].push(sheet)
      }
      setSkillSheets(grouped)

      // 進行中の提案件数を取得
      const { data: proposalData } = await supabase
        .from('proposals')
        .select('engineer_id, status')
        .in('engineer_id', ids)
        .in('status', ACTIVE_STATUSES)

      const counts: Record<string, number> = {}
      for (const p of proposalData ?? []) {
        counts[p.engineer_id] = (counts[p.engineer_id] ?? 0) + 1
      }
      setProposalCounts(counts)
    }

    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('この要員を削除しますか？')) return
    const { error } = await supabase.from('engineers').delete().eq('id', id)
    if (error) {
      alert('削除に失敗しました')
    } else {
      setEngineers((prev) => prev.filter((e) => e.id !== id))
    }
  }

  useEffect(() => {
    fetchEngineers()
  }, [])

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">要員一覧</h1>
        <Link
          href="/engineers/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          ＋ 要員を追加
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-400">読み込み中...</p>
      ) : engineers.length === 0 ? (
        <p className="text-gray-400">要員が登録されていません。</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {engineers.map((engineer) => (
            <EngineerCard
              key={engineer.id}
              engineer={engineer}
              skillSheets={skillSheets[engineer.id] ?? []}
              onDelete={handleDelete}
              activeProposalCount={proposalCounts[engineer.id] ?? 0}
            />
          ))}
        </div>
      )}
    </main>
  )
}
