'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Engineer, Project, Proposal, ProposalStatus } from '@/types'

const STATUSES: ProposalStatus[] = ['提案中', '面談調整中', '面談済', '成約', '見送り']

const statusColor: Record<ProposalStatus, string> = {
  '提案中': 'bg-blue-50 border-blue-200',
  '面談調整中': 'bg-yellow-50 border-yellow-200',
  '面談済': 'bg-purple-50 border-purple-200',
  '成約': 'bg-green-50 border-green-200',
  '見送り': 'bg-gray-50 border-gray-200',
}

const statusHeaderColor: Record<ProposalStatus, string> = {
  '提案中': 'bg-blue-100 text-blue-800',
  '面談調整中': 'bg-yellow-100 text-yellow-800',
  '面談済': 'bg-purple-100 text-purple-800',
  '成約': 'bg-green-100 text-green-800',
  '見送り': 'bg-gray-100 text-gray-600',
}

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [engineers, setEngineers] = useState<Engineer[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    engineer_id: '',
    project_id: '',
    proposed_date: new Date().toISOString().split('T')[0],
  })
  const [submitting, setSubmitting] = useState(false)

  const fetchProposals = async () => {
    const { data, error } = await supabase
      .from('proposals')
      .select('*, engineers(name, affiliation), projects(project_name, client_name)')
      .order('proposed_date', { ascending: false })

    if (error) console.error(error)
    else setProposals((data as Proposal[]) ?? [])
  }

  useEffect(() => {
    const init = async () => {
      await Promise.all([
        fetchProposals(),
        supabase.from('engineers').select('*').order('name').then(({ data }) => setEngineers(data ?? [])),
        supabase.from('projects').select('*').order('project_name').then(({ data }) => setProjects(data ?? [])),
      ])
      setLoading(false)
    }
    init()
  }, [])

  const handleStatusChange = async (proposal: Proposal, newStatus: ProposalStatus) => {
    const { error } = await supabase
      .from('proposals')
      .update({ status: newStatus })
      .eq('id', proposal.id)

    if (error) {
      alert('更新に失敗しました')
      return
    }
    setProposals((prev) =>
      prev.map((p) => (p.id === proposal.id ? { ...p, status: newStatus } : p))
    )
  }

  const handleDelete = async (id: string) => {
    if (!confirm('この提案を削除しますか？')) return
    const { error } = await supabase.from('proposals').delete().eq('id', id)
    if (error) alert('削除に失敗しました')
    else setProposals((prev) => prev.filter((p) => p.id !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const engineer = engineers.find((en) => en.id === form.engineer_id)
    const project = projects.find((pr) => pr.id === form.project_id)

    const { data, error } = await supabase
      .from('proposals')
      .insert({
        engineer_id: form.engineer_id,
        project_id: form.project_id,
        proposed_date: form.proposed_date,
        affiliation: engineer?.source_company ?? null,
        client_name: project?.client_name ?? null,
        status: '提案中',
      })
      .select('*, engineers(name, affiliation), projects(project_name, client_name)')
      .single()

    if (error) {
      alert('登録に失敗しました')
      console.error(error)
    } else {
      setProposals((prev) => [data as Proposal, ...prev])
      setShowModal(false)
      setForm({ engineer_id: '', project_id: '', proposed_date: new Date().toISOString().split('T')[0] })
    }
    setSubmitting(false)
  }

  const grouped = STATUSES.reduce<Record<ProposalStatus, Proposal[]>>((acc, s) => {
    acc[s] = proposals.filter((p) => p.status === s)
    return acc
  }, {} as Record<ProposalStatus, Proposal[]>)

  return (
    <main className="px-4 py-8">
      <div className="flex justify-between items-center mb-6 max-w-full">
        <h1 className="text-2xl font-bold">提案管理</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          ＋ 提案を追加
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">読み込み中...</p>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUSES.map((status) => (
            <div key={status} className="flex-shrink-0 w-64">
              <div className={`text-sm font-semibold px-3 py-1.5 rounded-t ${statusHeaderColor[status]}`}>
                {status}
                <span className="ml-2 text-xs font-normal opacity-70">
                  {grouped[status].length}件
                </span>
              </div>
              <div className="bg-gray-100 rounded-b p-2 flex flex-col gap-2 min-h-32">
                {grouped[status].map((proposal) => (
                  <ProposalCard
                    key={proposal.id}
                    proposal={proposal}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                    colorClass={statusColor[status]}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 新規提案モーダル */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4">提案を追加</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">要員 *</label>
                <select
                  value={form.engineer_id}
                  onChange={(e) => setForm({ ...form, engineer_id: e.target.value })}
                  required
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">選択してください</option>
                  {engineers.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}{e.affiliation ? `（${e.affiliation}）` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">案件 *</label>
                <select
                  value={form.project_id}
                  onChange={(e) => setForm({ ...form, project_id: e.target.value })}
                  required
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">選択してください</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.project_name}{p.client_name ? `（${p.client_name}）` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">提案日 *</label>
                <input
                  type="date"
                  value={form.proposed_date}
                  onChange={(e) => setForm({ ...form, proposed_date: e.target.value })}
                  required
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? '登録中...' : '登録する'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="border px-6 py-2 rounded hover:bg-gray-50"
                >
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}

type CardProps = {
  proposal: Proposal
  onStatusChange: (proposal: Proposal, status: ProposalStatus) => void
  onDelete: (id: string) => void
  colorClass: string
}

function ProposalCard({ proposal, onStatusChange, onDelete, colorClass }: CardProps) {
  const currentIndex = STATUSES.indexOf(proposal.status)
  const engineerName = proposal.engineers?.name ?? '不明'
  const projectName = proposal.projects?.project_name ?? '不明'

  return (
    <div className={`border rounded p-3 flex flex-col gap-1.5 text-sm bg-white ${colorClass}`}>
      <p className="font-semibold text-gray-900 leading-snug">{engineerName}</p>
      <p className="text-gray-600 text-xs leading-snug">{projectName}</p>
      {proposal.affiliation && (
        <p className="text-xs text-gray-500">所属: {proposal.affiliation}</p>
      )}
      {proposal.client_name && (
        <p className="text-xs text-gray-500">提案先: {proposal.client_name}</p>
      )}
      <p className="text-xs text-gray-400">{proposal.proposed_date}</p>

      {/* ステータス操作 */}
      <div className="flex flex-wrap gap-1 pt-1 border-t">
        {proposal.status === '面談済' ? (
          <>
            <button
              onClick={() => onStatusChange(proposal, '成約')}
              className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded hover:bg-green-200"
            >
              成約
            </button>
            <button
              onClick={() => onStatusChange(proposal, '見送り')}
              className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded hover:bg-gray-200"
            >
              見送り
            </button>
          </>
        ) : currentIndex < STATUSES.indexOf('面談済') ? (
          <button
            onClick={() => onStatusChange(proposal, STATUSES[currentIndex + 1])}
            className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded hover:bg-blue-200"
          >
            {STATUSES[currentIndex + 1]} →
          </button>
        ) : null}
        {currentIndex > 0 && proposal.status !== '成約' && proposal.status !== '見送り' && (
          <button
            onClick={() => onStatusChange(proposal, STATUSES[currentIndex - 1])}
            className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded hover:bg-gray-200"
          >
            ← 戻す
          </button>
        )}
        <button
          onClick={() => onDelete(proposal.id)}
          className="text-xs text-red-400 hover:text-red-600 ml-auto"
        >
          削除
        </button>
      </div>
    </div>
  )
}
