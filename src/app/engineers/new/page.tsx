'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { parseSummary } from '@/lib/parseSummary'
import { cleanFileMetadata } from '@/lib/cleanFileMetadata'

const BUCKET = 'skill-sheets'

export default function NewEngineerPage() {
  const router = useRouter()
  const [summaryText, setSummaryText] = useState('')
  const [skillSheetFile, setSkillSheetFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // 1. 要員を登録
    const { data: engineer, error: insertError } = await supabase
      .from('engineers')
      .insert({
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
      .select()
      .single()

    if (insertError || !engineer) {
      alert('登録に失敗しました')
      console.error(insertError)
      setLoading(false)
      return
    }

    // 2. スキルシートのアップロード
    if (skillSheetFile) {
      try {
        const cleanedFile = await cleanFileMetadata(skillSheetFile)
        const ext = cleanedFile.name.split('.').pop() ?? 'bin'
        // ファイル名を英数字のみ（UUID+拡張子）にしてSupabase Storageに保存
        const safeFileName = `${crypto.randomUUID()}.${ext}`
        const storagePath = `${engineer.id}/${safeFileName}`

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(storagePath, cleanedFile, { upsert: true })

        if (uploadError) {
          console.error('ファイルアップロードエラー:', uploadError)
          alert('要員登録は完了しましたが、ファイルのアップロードに失敗しました')
        } else {
          // 元のファイル名はDBに保存
          await supabase.from('skill_sheets').insert({
            engineer_id: engineer.id,
            file_name: cleanedFile.name,
            storage_path: storagePath,
          })
        }
      } catch (err) {
        console.error('メタデータ削除エラー:', err)
        alert('要員登録は完了しましたが、ファイル処理に失敗しました')
      }
    }

    router.push('/engineers')
    setLoading(false)
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">要員を追加</h1>

      {/* サマリー貼り付け */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
        <label className="block text-sm font-medium mb-2">サマリーから自動入力（任意）</label>
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

        <div>
          <label className="block text-sm font-medium mb-1">
            ファイルを添付（PDF / Excel）
          </label>
          <input
            type="file"
            accept=".pdf,.xlsx,.xls"
            onChange={(e) => setSkillSheetFile(e.target.files?.[0] ?? null)}
            className="w-full border rounded px-3 py-2 text-sm"
          />
          {skillSheetFile && (
            <p className="text-xs text-gray-500 mt-1">
              選択中: {skillSheetFile.name}（登録時にメタデータを自動削除します）
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
