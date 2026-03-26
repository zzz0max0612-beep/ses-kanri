'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

const supabase = createClient()
import { parseProject } from '@/lib/parseProject'

export default function NewProjectPage() {
  const router = useRouter()
  const [projectText, setProjectText] = useState('')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    project_name: '',
    client_name: '',
    provider_company: '',
    required_skills: '',
    start_date: '',
    end_date: '',
    prefecture: '',
    nearest_station: '',
    work_style: '',
    budget_min: '',
    budget_max: '',
    headcount: '',
    contract_type: '',
    work_hours: '',
    interview_count: '',
    age_limit: '',
    nationality: '',
    freelancer: '',
    supply_chain: '',
    status: '営業中',
    description: '',
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleParseProject = () => {
    const parsed = parseProject(projectText)
    setForm((prev) => ({
      ...prev,
      ...(parsed.project_name && { project_name: parsed.project_name }),
      ...(parsed.client_name && { client_name: parsed.client_name }),
      ...(parsed.provider_company && { provider_company: parsed.provider_company }),
      ...(parsed.required_skills && { required_skills: parsed.required_skills }),
      ...(parsed.start_date && { start_date: parsed.start_date }),
      ...(parsed.prefecture && { prefecture: parsed.prefecture }),
      ...(parsed.nearest_station && { nearest_station: parsed.nearest_station }),
      ...(parsed.work_style && { work_style: parsed.work_style }),
      ...(parsed.budget_min && { budget_min: parsed.budget_min }),
      ...(parsed.budget_max && { budget_max: parsed.budget_max }),
      ...(parsed.headcount && { headcount: parsed.headcount }),
      ...(parsed.contract_type && { contract_type: parsed.contract_type }),
      ...(parsed.work_hours && { work_hours: parsed.work_hours }),
      ...(parsed.interview_count && { interview_count: parsed.interview_count }),
      ...(parsed.age_limit && { age_limit: parsed.age_limit }),
      ...(parsed.nationality && { nationality: parsed.nationality }),
      ...(parsed.freelancer && { freelancer: parsed.freelancer }),
      ...(parsed.supply_chain && { supply_chain: parsed.supply_chain }),
      ...(parsed.description && { description: parsed.description }),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const splitToArray = (val: string) =>
      val.split(/[,、，\n]/).map((s) => s.trim()).filter(Boolean)

    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('projects').insert({
      created_by: user?.id ?? null,
      project_name: form.project_name,
      client_name: form.client_name || null,
      provider_company: form.provider_company || null,
      required_skills: splitToArray(form.required_skills),
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      prefecture: form.prefecture || null,
      nearest_station: form.nearest_station || null,
      work_style: form.work_style || null,
      budget_min: form.budget_min ? Number(form.budget_min) : null,
      budget_max: form.budget_max ? Number(form.budget_max) : null,
      headcount: form.headcount ? Number(form.headcount) : null,
      contract_type: form.contract_type || null,
      work_hours: form.work_hours || null,
      interview_count: form.interview_count || null,
      age_limit: form.age_limit || null,
      nationality: form.nationality || null,
      freelancer: form.freelancer || null,
      supply_chain: form.supply_chain || null,
      status: form.status,
      description: form.description || null,
    })

    if (error) {
      alert('登録に失敗しました')
      console.error(error)
    } else {
      router.push('/projects')
    }
    setLoading(false)
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">案件を追加</h1>

      {/* 案件情報貼り付け */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
        <label className="block text-sm font-medium mb-2">案件情報から自動入力（任意）</label>
        <textarea
          value={projectText}
          onChange={(e) => setProjectText(e.target.value)}
          rows={8}
          placeholder="案件情報のテキストをここに貼り付けてください"
          className="w-full border rounded px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={handleParseProject}
          disabled={!projectText.trim()}
          className="mt-2 bg-green-600 text-white px-4 py-1.5 rounded text-sm hover:bg-green-700 disabled:opacity-40"
        >
          項目に反映する
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* 基本情報 */}
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">基本情報</p>

        <div>
          <label className="block text-sm font-medium mb-1">案件名 *</label>
          <input name="project_name" value={form.project_name} onChange={handleChange} required
            className="w-full border rounded px-3 py-2" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">ステータス</label>
          <input name="status" value={form.status} onChange={handleChange}
            placeholder="例: 営業中、面談調整中、成約" className="w-full border rounded px-3 py-2" />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">クライアント名</label>
            <input name="client_name" value={form.client_name} onChange={handleChange}
              className="w-full border rounded px-3 py-2" />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">提供会社</label>
            <input name="provider_company" value={form.provider_company} onChange={handleChange}
              className="w-full border rounded px-3 py-2" />
          </div>
        </div>

        {/* スキル・要件 */}
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-2">スキル・要件</p>

        <div>
          <label className="block text-sm font-medium mb-1">必須スキル（カンマ or 読点区切り）</label>
          <textarea name="required_skills" value={form.required_skills} onChange={handleChange}
            rows={3} placeholder="例: Java、SQL、要件定義経験" className="w-full border rounded px-3 py-2" />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">契約形態</label>
            <input name="contract_type" value={form.contract_type} onChange={handleChange}
              placeholder="例: 準委任、派遣" className="w-full border rounded px-3 py-2" />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">精算幅</label>
            <input name="work_hours" value={form.work_hours} onChange={handleChange}
              placeholder="例: 140h〜180h" className="w-full border rounded px-3 py-2" />
          </div>
        </div>

        {/* 勤務条件 */}
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-2">勤務条件</p>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">開始日</label>
            <input name="start_date" type="date" value={form.start_date} onChange={handleChange}
              className="w-full border rounded px-3 py-2" />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">終了日</label>
            <input name="end_date" type="date" value={form.end_date} onChange={handleChange}
              className="w-full border rounded px-3 py-2" />
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">勤務地</label>
            <input name="prefecture" value={form.prefecture} onChange={handleChange}
              placeholder="例: 大阪" className="w-full border rounded px-3 py-2" />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">最寄り駅</label>
            <input name="nearest_station" value={form.nearest_station} onChange={handleChange}
              placeholder="例: 北浜駅" className="w-full border rounded px-3 py-2" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">勤務形態</label>
          <input name="work_style" value={form.work_style} onChange={handleChange}
            placeholder="例: 常駐、リモート可、ハイブリッド" className="w-full border rounded px-3 py-2" />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">単価 下限（円）</label>
            <input name="budget_min" type="number" value={form.budget_min} onChange={handleChange}
              placeholder="例: 600000" className="w-full border rounded px-3 py-2" />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">単価 上限（円）</label>
            <input name="budget_max" type="number" value={form.budget_max} onChange={handleChange}
              placeholder="例: 700000" className="w-full border rounded px-3 py-2" />
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">募集人数</label>
            <input name="headcount" type="number" value={form.headcount} onChange={handleChange}
              className="w-full border rounded px-3 py-2" />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">面談回数</label>
            <input name="interview_count" value={form.interview_count} onChange={handleChange}
              placeholder="例: 1回" className="w-full border rounded px-3 py-2" />
          </div>
        </div>

        {/* 制限事項 */}
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-2">制限事項</p>

        <div>
          <label className="block text-sm font-medium mb-1">商流制限</label>
          <input name="supply_chain" value={form.supply_chain} onChange={handleChange}
            placeholder="例: 貴社まで、貴社1社先まで、不問" className="w-full border rounded px-3 py-2" />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">年齢制限</label>
            <input name="age_limit" value={form.age_limit} onChange={handleChange}
              placeholder="例: 40代まで" className="w-full border rounded px-3 py-2" />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">外国籍</label>
            <input name="nationality" value={form.nationality} onChange={handleChange}
              placeholder="例: 不可、可" className="w-full border rounded px-3 py-2" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">個人事業主</label>
          <input name="freelancer" value={form.freelancer} onChange={handleChange}
            placeholder="例: 不可、可" className="w-full border rounded px-3 py-2" />
        </div>

        {/* 案件概要 */}
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-2">案件概要</p>

        <div>
          <label className="block text-sm font-medium mb-1">概要・詳細</label>
          <textarea name="description" value={form.description} onChange={handleChange}
            rows={6} className="w-full border rounded px-3 py-2" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
            {loading ? '登録中...' : '登録する'}
          </button>
          <button type="button" onClick={() => router.back()}
            className="border px-6 py-2 rounded hover:bg-gray-50">
            キャンセル
          </button>
        </div>
      </form>
    </main>
  )
}
