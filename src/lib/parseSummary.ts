import { Engineer } from '@/types'

type FormValues = {
  name: string
  affiliation: string
  age: string
  gender: string
  skills: string
  certifications: string
  processes: string
  experience_years: string
  available_date: string
  prefecture: string
  nearest_station: string
  work_style: 'remote' | 'onsite' | 'hybrid'
  rate_min: string
  rate_max: string
  sales_status: string
  notes: string
}

/**
 * 複数ラベル候補で抽出（全角スペース・末尾スペース・■【】対応）
 */
function extractByLabels(text: string, labels: string[]): string {
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const flexible = escaped.replace(/[　\s]+/g, '[　\\s]*')

    // 【ラベル】パターン（末尾スペース許容）
    const bracketMatch = text.match(
      new RegExp(`【${flexible}[　\\s]*】[　\\s]*[:：]?[　\\s]*(.+)`)
    )
    if (bracketMatch) return bracketMatch[1].trim()

    // ■ラベルパターン
    const squareMatch = text.match(
      new RegExp(`■${flexible}[　\\s]*[:：]?[　\\s]*(.+)`)
    )
    if (squareMatch) return squareMatch[1].trim()

    // 行頭 ラベル：パターン
    const plainMatch = text.match(
      new RegExp(`^${flexible}[　\\s]*[:：][　\\s]*(.+)`, 'm')
    )
    if (plainMatch) return plainMatch[1].trim()
  }
  return ''
}

export function parseSummary(text: string): Partial<FormValues> {
  // 氏名
  const shimei = extractByLabels(text, ['氏名', '氏　名', '氏　　名', 'イニシャル', '名前', '名 前'])
  const name = shimei ? shimei.split(/[\/／]/).map((s) => s.trim())[0] : ''

  // 年齢
  const nenreiRaw = extractByLabels(text, ['年齢', '年 齢', '年　齢'])
  const ageMatch = nenreiRaw.match(/(\d+)/)
  const age = ageMatch ? ageMatch[1] : ''

  // 性別
  const gender = extractByLabels(text, ['性別', '性 別', '性　別'])

  // 所属
  const affiliation = extractByLabels(text, ['所属', '所　属', '所 属'])

  // スキル（得意技術 + DB）
  const skillMain = extractByLabels(text, ['得意技術', 'スキル', '言語', '主なスキル'])
  const skillDB = extractByLabels(text, ['ＤＢ', 'DB', 'データベース'])
  const skills = [skillMain, skillDB].filter(Boolean).join('、')

  // 資格
  const certRaw = extractByLabels(text, ['資格', '保有資格', '取得資格', '資格・認定'])
  const certifications = certRaw

  // 対応工程
  const processRaw = extractByLabels(text, ['工程', '対応工程', 'フェーズ', '対応フェーズ', '担当工程'])
  const processes = processRaw

  // IT経験年数
  const itKeikenRaw = extractByLabels(text, [
    'IT経験年数', 'ＩＴ経験年数', 'IT経験', 'ＩＴ経験', '経験年数',
  ])
  const experienceMatch = itKeikenRaw.match(/(\d+)\s*年/)
  const experience_years = experienceMatch ? experienceMatch[1] : ''

  // 稼働開始日
  const kadoRaw = extractByLabels(text, [
    '稼動開始', '稼働開始', '稼働開始日', '稼動開始日',
    '稼　働', '稼　動', '稼働可能', '稼動可能', '開始日',
    'スタート時期', 'スタート', '参画時期', '参画可能時期',
  ])
  let available_date = ''
  if (kadoRaw.includes('即日') || kadoRaw.includes('即時')) {
    available_date = new Date().toISOString().split('T')[0]
  } else {
    const dateMatch = kadoRaw.match(/(\d{4})[\/\-年](\d{1,2})(?:[\/\-月](\d{1,2}))?/)
    if (dateMatch) {
      const y = dateMatch[1]
      const m = dateMatch[2].padStart(2, '0')
      const d = (dateMatch[3] ?? '01').padStart(2, '0')
      available_date = `${y}-${m}-${d}`
    }
  }

  // 最寄駅・都道府県
  const stationRaw = extractByLabels(text, [
    '最寄駅', '最　寄駅', '最　寄', '最寄り駅', '最寄', '最 寄 駅',
  ])
  const stationMatch = stationRaw.match(/([^\s　]+駅)/)
  const nearest_station = stationMatch ? stationMatch[1] : stationRaw.split(/[　\s]/)[0]
  const prefMatch =
    stationRaw.match(/[（(]([^）)]+[都道府県])/) ??
    stationRaw.match(/([^\s　（(]+[都道府県])/)
  const prefecture = prefMatch ? prefMatch[1] : ''

  // 単金レンジ（"70～75万" → rate_min=700000, rate_max=750000）
  const tankinRaw = extractByLabels(text, [
    '単金', '単　金', '希望単金', '単価', '単　価', '希望単価',
  ])
  let rate_min = ''
  let rate_max = ''
  const rangeMatch = tankinRaw.match(/(\d+)[～〜~](\d+)\s*万/)
  const singleMatch = tankinRaw.match(/(\d+)\s*万/)
  const directMatch = tankinRaw.match(/(\d{4,})/)
  if (rangeMatch) {
    rate_min = String(Number(rangeMatch[1]) * 10000)
    rate_max = String(Number(rangeMatch[2]) * 10000)
  } else if (singleMatch) {
    rate_min = String(Number(singleMatch[1]) * 10000)
  } else if (directMatch) {
    rate_min = directMatch[1].replace(/,/g, '')
  }

  // 営業状況
  const sales_status = extractByLabels(text, ['営業状況', '稼働状況', '状況'])

  // 勤務形態（本文全体から判定）
  let work_style: 'remote' | 'onsite' | 'hybrid' = 'hybrid'
  if (text.includes('フルリモート') || text.includes('完全リモート')) {
    work_style = 'remote'
  } else if (text.includes('リモート不可') || text.includes('常駐のみ')) {
    work_style = 'onsite'
  } else if (text.includes('リモート')) {
    work_style = 'hybrid'
  }

  // 備考
  const notesMatch = text.match(/[【■]備考[】]?[　\s]*[:：]?[　\s]*(.+)/s)
  const notes = notesMatch ? notesMatch[1].trim() : ''

  return {
    name,
    affiliation,
    age,
    gender,
    skills,
    certifications,
    processes,
    experience_years,
    available_date,
    prefecture,
    nearest_station,
    work_style,
    rate_min,
    rate_max,
    sales_status,
    notes,
  }
}

export function generateSummary(engineer: Engineer): string {
  const workStyleMap: Record<string, string> = {
    remote: 'フルリモート希望',
    hybrid: 'リモート併用希望',
    onsite: '常駐対応可',
  }

  const rateStr = engineer.rate_min != null
    ? engineer.rate_max != null
      ? `${Math.floor(engineer.rate_min / 10000)}～${Math.floor(engineer.rate_max / 10000)}万`
      : `${Math.floor(engineer.rate_min / 10000)}万`
    : ''

  const lines = [
    '==================================',
    `【氏名】　　：${engineer.name}${engineer.age ? `　${engineer.age}歳` : ''}${engineer.gender ? `　${engineer.gender}` : ''}`,
    `【所属】　　：${engineer.affiliation ?? ''}`,
    `【得意技術】：${engineer.skills.join('、')}`,
    `【資格】　　：${engineer.certifications.join('、')}`,
    `【工程】　　：${engineer.processes.join('、')}`,
    `【IT経験】　：${engineer.experience_years != null ? `約${engineer.experience_years}年` : ''}`,
    `【稼動開始】：${engineer.available_date ?? ''}`,
    `【最寄駅】　：${[engineer.nearest_station, engineer.prefecture].filter(Boolean).join('　')}`,
    `【単金】　　：${rateStr}`,
    `【勤務形態】：${workStyleMap[engineer.work_style] ?? engineer.work_style}`,
    `【営業状況】：${engineer.sales_status ?? ''}`,
    `【備考】　　：${engineer.notes ?? ''}`,
    '==================================',
  ]

  return lines.join('\n')
}
