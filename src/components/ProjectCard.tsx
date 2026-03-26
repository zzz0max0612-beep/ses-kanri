'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Project } from '@/types'
import { generateProjectSummary } from '@/lib/parseProject'
import MatchingPanel from '@/components/MatchingPanel'

type Props = {
  project: Project
  onDelete: (id: string) => void
  activeProposalCount?: number
}

const workStyleLabel: Record<string, string> = {
  remote: 'リモート',
  onsite: '常駐',
  hybrid: 'ハイブリッド',
}

const statusColor: Record<string, string> = {
  '営業中': 'bg-green-100 text-green-700',
  '面談調整中': 'bg-yellow-100 text-yellow-700',
  '面談中': 'bg-blue-100 text-blue-700',
  '成約': 'bg-purple-100 text-purple-700',
  '終了': 'bg-gray-100 text-gray-500',
}

export default function ProjectCard({ project, onDelete, activeProposalCount = 0 }: Props) {
  const router = useRouter()
  const [showSummary, setShowSummary] = useState(false)
  const [showDescription, setShowDescription] = useState(false)
  const [copied, setCopied] = useState(false)

  const summary = generateProjectSummary(project)

  const handleCopy = () => {
    navigator.clipboard.writeText(summary)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const budgetStr = project.budget_min
    ? project.budget_max
      ? `${project.budget_min.toLocaleString()}〜${project.budget_max.toLocaleString()}円`
      : `${project.budget_min.toLocaleString()}円〜`
    : project.budget_max
    ? `〜${project.budget_max.toLocaleString()}円`
    : null

  const colorClass = project.status ? (statusColor[project.status] ?? 'bg-gray-100 text-gray-500') : 'bg-gray-100 text-gray-500'

  return (
    <div className="bg-white rounded-lg shadow p-4 flex flex-col gap-2">
      {/* ヘッダー */}
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold leading-snug">{project.project_name}</h2>
          <div className="flex flex-wrap gap-1 mt-0.5">
            {project.client_name && (
              <span className="text-xs text-gray-500">{project.client_name}</span>
            )}
            {project.provider_company && (
              <span className="text-xs text-gray-400">/ {project.provider_company}</span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {project.status && (
            <span className={`text-xs px-2 py-0.5 rounded ${colorClass}`}>
              {project.status}
            </span>
          )}
          {project.work_style && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
              {workStyleLabel[project.work_style] ?? project.work_style}
            </span>
          )}
          {activeProposalCount > 0 && (
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
              提案 {activeProposalCount}名
            </span>
          )}
        </div>
      </div>

      {/* 必須スキル */}
      {project.required_skills.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {project.required_skills.map((skill) => (
            <span key={skill} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
              {skill}
            </span>
          ))}
        </div>
      )}

      {/* 基本情報 */}
      <div className="text-sm text-gray-600 flex flex-col gap-0.5">
        {(project.prefecture || project.nearest_station) && (
          <p>場所: {[project.prefecture, project.nearest_station].filter(Boolean).join(' / ')}</p>
        )}
        {project.start_date && <p>開始: {project.start_date}</p>}
        {budgetStr && <p>単価: {budgetStr}</p>}
        {project.work_hours && <p>精算: {project.work_hours}</p>}
        {project.headcount && <p>募集: {project.headcount}名</p>}
        {project.contract_type && <p>契約: {project.contract_type}</p>}
        {project.supply_chain && <p>商流: {project.supply_chain}</p>}
        {project.interview_count && <p>面談: {project.interview_count}</p>}
        {project.age_limit && <p>年齢: {project.age_limit}</p>}
        {project.nationality && <p>外国籍: {project.nationality}</p>}
        {project.freelancer && <p>個人事業主: {project.freelancer}</p>}
      </div>

      {/* 案件概要（折りたたみ） */}
      {project.description && (
        <div className="border-t pt-2">
          <button
            onClick={() => setShowDescription((v) => !v)}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            {showDescription ? '概要を閉じる ▲' : '概要を見る ▼'}
          </button>
          {showDescription && (
            <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">{project.description}</p>
          )}
        </div>
      )}

      {/* サマリー出力 */}
      {showSummary && (
        <div className="border-t pt-2">
          <pre className="text-xs bg-gray-50 rounded p-2 whitespace-pre-wrap break-all text-gray-900">
            {summary}
          </pre>
          <button onClick={handleCopy} className="mt-1 text-xs text-blue-600 hover:text-blue-800">
            {copied ? 'コピーしました！' : 'クリップボードにコピー'}
          </button>
        </div>
      )}

      <MatchingPanel project={project} />

      <div className="flex justify-between items-center border-t pt-2">
        <button
          onClick={() => setShowSummary((v) => !v)}
          className="text-sm text-blue-500 hover:text-blue-700"
        >
          {showSummary ? 'サマリーを閉じる' : 'サマリーを展開'}
        </button>
        <div className="flex gap-3">
          <button
            onClick={() => router.push(`/projects/${project.id}/edit`)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            編集
          </button>
          <button
            onClick={() => onDelete(project.id)}
            className="text-sm text-red-500 hover:text-red-700"
          >
            削除
          </button>
        </div>
      </div>
    </div>
  )
}
