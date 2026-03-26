'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Engineer, SkillSheet } from '@/types'
import { generateSummary } from '@/lib/parseSummary'
import { supabase } from '@/lib/supabase'

const BUCKET = 'skill-sheets'

type Props = {
  engineer: Engineer
  skillSheets: SkillSheet[]
  onDelete: (id: string) => void
  activeProposalCount?: number
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

export default function EngineerCard({ engineer, skillSheets, onDelete, activeProposalCount = 0 }: Props) {
  const router = useRouter()
  const [showSummary, setShowSummary] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleOpenFile = (sheet: SkillSheet) => {
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(sheet.storage_path)
    window.open(data.publicUrl, '_blank')
  }

  const summary = generateSummary(engineer)

  const handleCopy = () => {
    navigator.clipboard.writeText(summary)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const rateStr = engineer.rate_min != null
    ? engineer.rate_max != null
      ? `${engineer.rate_min.toLocaleString()}〜${engineer.rate_max.toLocaleString()}円/月`
      : `${engineer.rate_min.toLocaleString()}円/月`
    : null

  const statusColor = engineer.sales_status
    ? (salesStatusColor[engineer.sales_status] ?? 'bg-gray-100 text-gray-500')
    : 'bg-gray-100 text-gray-500'

  return (
    <div className="bg-white rounded-lg shadow p-4 flex flex-col gap-2">
      {/* ヘッダー */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-lg font-bold">
            {engineer.name}
            {engineer.age && <span className="text-sm font-normal text-gray-500 ml-2">{engineer.age}歳</span>}
            {engineer.gender && <span className="text-sm font-normal text-gray-500 ml-1">{engineer.gender}</span>}
          </h2>
          {engineer.source_company && (
            <p className="text-sm text-gray-500">所属会社: {engineer.source_company}</p>
          )}
          {engineer.affiliation && (
            <p className="text-sm text-gray-500">{engineer.affiliation}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
            {workStyleLabel[engineer.work_style] ?? engineer.work_style}
          </span>
          {engineer.sales_status && (
            <span className={`text-xs px-2 py-0.5 rounded ${statusColor}`}>
              {engineer.sales_status}
            </span>
          )}
          {activeProposalCount > 0 && (
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
              提案中 {activeProposalCount}件
            </span>
          )}
        </div>
      </div>

      {/* スキル */}
      {engineer.skills.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {engineer.skills.map((skill) => (
            <span key={skill} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
              {skill}
            </span>
          ))}
        </div>
      )}

      {/* 工程 */}
      {engineer.processes.length > 0 && (
        <p className="text-xs text-gray-500">工程: {engineer.processes.join('　')}</p>
      )}

      {/* 資格 */}
      {engineer.certifications.length > 0 && (
        <p className="text-xs text-gray-500">資格: {engineer.certifications.join('、')}</p>
      )}

      {/* 稼働情報 */}
      <div className="text-sm text-gray-600 flex flex-col gap-0.5">
        {engineer.available_date && <p>稼働可能日: {engineer.available_date}</p>}
        {(engineer.prefecture || engineer.nearest_station) && (
          <p>勤務地: {[engineer.prefecture, engineer.nearest_station].filter(Boolean).join(' / ')}</p>
        )}
        {rateStr && <p>希望単価: {rateStr}</p>}
        {engineer.experience_years != null && <p>経験年数: {engineer.experience_years}年</p>}
      </div>

      {/* 備考 */}
      {engineer.notes && (
        <p className="text-sm text-gray-500 border-t pt-2 whitespace-pre-wrap line-clamp-3">
          {engineer.notes}
        </p>
      )}

      {/* スキルシート */}
      {skillSheets.length > 0 && (
        <div className="border-t pt-2">
          <p className="text-xs font-medium text-gray-500 mb-1">スキルシート</p>
          <div className="flex flex-col gap-1">
            {skillSheets.map((sheet) => (
              <button
                key={sheet.id}
                onClick={() => handleOpenFile(sheet)}
                className="text-xs text-blue-600 hover:text-blue-800 text-left truncate"
              >
                📄 {sheet.file_name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* サマリー表示 */}
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

      <div className="flex justify-between items-center border-t pt-2">
        <button
          onClick={() => setShowSummary((v) => !v)}
          className="text-sm text-blue-500 hover:text-blue-700"
        >
          {showSummary ? 'サマリーを閉じる' : 'サマリーを展開'}
        </button>
        <div className="flex gap-3">
          <button
            onClick={() => router.push(`/engineers/${engineer.id}/edit`)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            編集
          </button>
          <button
            onClick={() => onDelete(engineer.id)}
            className="text-sm text-red-500 hover:text-red-700"
          >
            削除
          </button>
        </div>
      </div>
    </div>
  )
}
