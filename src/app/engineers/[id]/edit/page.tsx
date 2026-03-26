'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

const supabase = createClient()
import { parseSummary } from '@/lib/parseSummary'
import { cleanFileMetadata } from '@/lib/cleanFileMetadata'
import { SkillSheet } from '@/types'

const BUCKET = 'skill-sheets'

export default function EditEngineerPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [summaryText, setSummaryText] = useState('')
  const [skillSheetFile, setSkillSheetFile] = useState<File | null>(null)
  const [existingSheets, setExistingSheets] = useState<SkillSheet[]>([])
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [form, setForm] = useState({
    name: '',
    affiliation: '',
    source_company: '',
    age: '',
    gender: '',
    skills: '',
    certifications: '',
    processes: '',
    experience_years: '',
    available_date: '',
    prefecture: '',
    nearest_station: '',
    work_style: 'hybrid',
    rate_min: '',
    rate_max: '',
    sales_status: '営業中',
    notes: '',
  })

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: engineer }, { data: sheets }] = await Promise.all([
        supabase.from('engineers').select('*').eq('id', id).single(),
        supabase.from('skill_sheets').select('*').eq('engineer_id', id),
      ])

      if (!engineer) {
        alert('要員が見つかりません')
        router.push('/engineers')
        return
      }

      setForm({
        name: engineer.name ?? '',
        affiliation: engineer.affiliation ?? '',
        source_company: engineer.source_company ?? '',
        age: engineer.age != null ? String(engineer.age) : '',
        gender: engineer.gender ?? '',
        skills: (engineer.skills ?? []).join('、'),
        certifications: (engineer.certifications ?? []).join('、'),
        processes: (engineer.processes ?? []).join('、'),
        experience_years: engineer.experience_years != null ? String(engineer.experience_years) : '',
        available_date: engineer.available_date ?? '',
        prefecture: engineer.prefecture ?? '',
        nearest_station: engineer.nearest_station ?? '',
        work_style: engineer.work_style ?? 'hybrid',
        rate_min: engineer.rate_min != null ? String(engineer.rate_min) : '',
        rate_max: engineer.rate_max != null ? String(engineer.rate_max) : '',
        sales_status: engineer.sales_status ?? '営業中',
        notes: engineer.notes ?? '',
      })
      setExistingSheets(sheets ?? [])
      setInitializing(false)
    }

    fetchData()
  }, [id, router])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleParseSummary = () => {
    const parsed = parseSummary(summaryText)
    setForm((prev) => ({
      ...prev,
      ...(parsed.name && { name: parsed.name }),
      ...(parsed.affiliation && { affiliation: parsed.affiliation }),
      ...(parsed.age && { age: parsed.age }),
      ...(parsed.gender && { gender: parsed.gender }),
      ...(parsed.skills && { skills: parsed.skills }),
      ...(parsed.certifications && { certifications: parsed.certifications }),
      ...(parsed.processes && { processes: parsed.processes }),
      ...(parsed.experience_years && { experience_years: parsed.experience_years }),
      ...(parsed.available_date && { available_date: parsed.available_date }),
      ...(parsed.prefecture && { prefecture: parsed.prefecture }),
      ...(parsed.nearest_station && { nearest_station: parsed.nearest_station }),
      ...(parsed.work_style && { work_style: parsed.work_style }),
      ...(parsed.rate_min && { rate_min: parsed.rate_min }),
      ...(parsed.rate_max && { rate_max: parsed.rate_max }),
      ...(parsed.sales_status && { sales_status: parsed.sales_status }),
      ...(parsed.notes && { notes: parsed.notes }),
    }))
  }

  const splitToArray = (val: string) =>
    val.split(/[,、，]/).map((s) => s.trim()).filter(Boolean)

  const handleDeleteSheet = async (sheet: SkillSheet) => {
    if (!confirm(`「${sheet.file_name}」を削除しますか？`)) return
    await supabase.storage.from(BUCKET).remove([sheet.storage_path])
    await supabase.from('skill_sheets').delete().eq('id', sheet.id)
    setExistingSheets((prev) => prev.filter((s) => s.id !== sheet.id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error: updateError } = await supabase
      .from('engineers')
      .update({
        name: form.name,
        affiliation: form.affiliation || null,
        source_company: form.source_company || null,
        age: form.age ? Number(form.age) : null,
        gender: form.gender || null,
        skills: splitToArray(form.skills),
        certifications: splitToArray(form.certifications),
        processes: splitToArray(form.processes),
        experience_years: form.experience_years ? Number(form.experience_years) : null,
        available_date: form.available_date || null,
        prefecture: form.prefecture || null,
        nearest_station: form.nearest_station || null,
        work_style: form.work_style,
        rate_min: form.rate_min ? Number(form.rate_min) : null,
        rate_max: form.rate_max ? Number(form.rate_max) : null,
        sales_status: form.sales_status || null,
        notes: form.notes || null,
      })
      .eq('id', id)

    if (updateError) {
      alert('更新に失敗しました')
      console.error(updateError)
      setLoading(false)
      return
    }

    if (skillSheetFile) {
      try {
        const cleanedFile = await cleanFileMetadata(skillSheetFile)
        const ext = cleanedFile.name.split('.').pop() ?? 'bin'
        const safeFileName = `${crypto.randomUUID()}.${ext}`
        const storagePath = `${id}/${safeFileName}`

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(storagePath, cleanedFile, { upsert: true })

        if (uploadError) {
          console.error('ファイルアップロードエラー:', uploadError)
          alert('要員情報は更新しましたが、ファイルのアップロードに失敗しました')
        } else {
          await supabase.from('skill_sheets').insert({
            engineer_id: id,
            file_name: cleanedFile.name,
            storage_path: storagePath,
          })
        }
      } catch (err) {
        console.error('メタデータ削除エラー:', err)
        alert('要員情報は更新しましたが、ファイル処理に失敗しました')
      }
    }

    router.push('/engineers')
    setLoading(false)
  }

  if (initializing) {
    return <main className="max-w-xl mx-auto px-4 py-8"><p className="text-gray-500">読み込み中...</p></main>
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">要員を編集</h1>

      {/* サマリー貼り付け */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
        <label className="block text-sm font-medium mb-2">サマリーから上書き入力（任意）</label>
        <textarea
          value={summaryText}
          onChange={(e) => setSummaryText(e.target.value)}
          rows={6}
          placeholder="サマリーテキストをここに貼り付けてください"
          className="w-full border rounded px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={handleParseSummary}
          disabled={!summaryText.trim()}
          className="mt-2 bg-green-600 text-white px-4 py-1.5 rounded text-sm hover:bg-green-700 disabled:opacity-40"
        >
          項目に反映する
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* 基本情報 */}
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">基本情報</p>

        <div>
          <label className="block text-sm font-medium mb-1">名前 *</label>
          <input name="name" value={form.name} onChange={handleChange} required
            className="w-full border rounded px-3 py-2" />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">年齢</label>
            <input name="age" type="number" value={form.age} onChange={handleChange}
              className="w-full border rounded px-3 py-2" />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">性別</label>
            <select name="gender" value={form.gender} onChange={handleChange}
              className="w-full border rounded px-3 py-2">
              <option value="">未選択</option>
              <option value="男性">男性</option>
              <option value="女性">女性</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">所属会社名</label>
          <input name="source_company" value={form.source_company} onChange={handleChange}
            placeholder="例: 株式会社〇〇" className="w-full border rounded px-3 py-2" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">所属（何次請け）</label>
          <input name="affiliation" value={form.affiliation} onChange={handleChange}
            placeholder="例: 1次、2次" className="w-full border rounded px-3 py-2" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">営業状況</label>
          <select name="sales_status" value={form.sales_status} onChange={handleChange}
            className="w-full border rounded px-3 py-2">
            <option value="営業中">営業中</option>
            <option value="並行営業中">並行営業中</option>
            <option value="稼働中">稼働中</option>
            <option value="調整中">調整中</option>
            <option value="停止中">停止中</option>
          </select>
        </div>

        {/* スキル */}
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-2">スキル</p>

        <div>
          <label className="block text-sm font-medium mb-1">スキル（カンマ or 読点区切り）</label>
          <input name="skills" value={form.skills} onChange={handleChange}
            placeholder="例: Java、React、AWS" className="w-full border rounded px-3 py-2" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">保有資格（カンマ or 読点区切り）</label>
          <input name="certifications" value={form.certifications} onChange={handleChange}
            placeholder="例: 基本情報技術者、AWS SAA" className="w-full border rounded px-3 py-2" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">対応工程（カンマ or 読点区切り）</label>
          <input name="processes" value={form.processes} onChange={handleChange}
            placeholder="例: 要件定義、基本設計、開発、テスト" className="w-full border rounded px-3 py-2" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">経験年数</label>
          <input name="experience_years" type="number" value={form.experience_years}
            onChange={handleChange} className="w-full border rounded px-3 py-2" />
        </div>

        {/* 稼働条件 */}
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-2">稼働条件</p>

        <div>
          <label className="block text-sm font-medium mb-1">稼働可能日</label>
          <input name="available_date" type="date" value={form.available_date}
            onChange={handleChange} className="w-full border rounded px-3 py-2" />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">都道府県</label>
            <input name="prefecture" value={form.prefecture} onChange={handleChange}
              placeholder="例: 東京都" className="w-full border rounded px-3 py-2" />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">最寄り駅</label>
            <input name="nearest_station" value={form.nearest_station} onChange={handleChange}
              placeholder="例: 渋谷駅" className="w-full border rounded px-3 py-2" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">勤務形態</label>
          <select name="work_style" value={form.work_style} onChange={handleChange}
            className="w-full border rounded px-3 py-2">
            <option value="hybrid">ハイブリッド</option>
            <option value="remote">リモート</option>
            <option value="onsite">常駐</option>
          </select>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">希望単価 下限（円）</label>
            <input name="rate_min" type="number" value={form.rate_min} onChange={handleChange}
              placeholder="例: 700000" className="w-full border rounded px-3 py-2" />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">希望単価 上限（円）</label>
            <input name="rate_max" type="number" value={form.rate_max} onChange={handleChange}
              placeholder="例: 750000" className="w-full border rounded px-3 py-2" />
          </div>
        </div>

        {/* スキルシート */}
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-2">スキルシート</p>

        {existingSheets.length > 0 && (
          <div className="flex flex-col gap-1">
            {existingSheets.map((sheet) => (
              <div key={sheet.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-600 truncate">📄 {sheet.file_name}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteSheet(sheet)}
                  className="text-red-500 hover:text-red-700 text-xs ml-2 shrink-0"
                >
                  削除
                </button>
              </div>
            ))}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">
            新しいファイルを追加（PDF / Excel）
          </label>
          <input
            type="file"
            accept=".pdf,.xlsx,.xls"
            onChange={(e) => setSkillSheetFile(e.target.files?.[0] ?? null)}
            className="w-full border rounded px-3 py-2 text-sm"
          />
          {skillSheetFile && (
            <p className="text-xs text-gray-500 mt-1">
              選択中: {skillSheetFile.name}（保存時にメタデータを自動削除します）
            </p>
          )}
        </div>

        {/* 備考 */}
        <div>
          <label className="block text-sm font-medium mb-1">備考</label>
          <textarea name="notes" value={form.notes} onChange={handleChange}
            rows={4} className="w-full border rounded px-3 py-2" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
            {loading ? '保存中...' : '保存する'}
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
