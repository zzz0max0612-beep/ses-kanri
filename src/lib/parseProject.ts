import { Project } from '@/types'

type ProjectFormValues = {
  project_name: string
  client_name: string
  provider_company: string
  required_skills: string
  start_date: string
  end_date: string
  prefecture: string
  nearest_station: string
  work_style: string
  budget_min: string
  budget_max: string
  headcount: string
  contract_type: string
  work_hours: string
  interview_count: string
  age_limit: string
  nationality: string
  freelancer: string
  supply_chain: string
  status: string
  description: string
}

function extractByLabels(text: string, labels: string[]): string {
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const flexible = escaped.replace(/[　\s]+/g, '[　\\s]*')

    const bracketMatch = text.match(new RegExp(`【${flexible}[　\\s]*】[　\\s]*[:：]?[　\\s]*(.+)`))
    if (bracketMatch) return bracketMatch[1].trim()

    const squareMatch = text.match(new RegExp(`■${flexible}[　\\s]*[:：]?[　\\s]*(.+)`))
    if (squareMatch) return squareMatch[1].trim()

    const plainMatch = text.match(new RegExp(`^${flexible}[　\\s]*[:：][　\\s]*(.+)`, 'm'))
    if (plainMatch) return plainMatch[1].trim()
  }
  return ''
}

function extractMultiline(text: string, labels: string[], nextLabels: string[]): string {
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const flexible = escaped.replace(/[　\s]+/g, '[　\\s]*')

    // 次のラベルが来るまでを取得
    const nextPattern = nextLabels
      .map((l) => l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/[　\s]+/g, '[　\\s]*'))
      .join('|')

    const patterns = [
      new RegExp(`【${flexible}[　\\s]*】[　\\s]*[:：]?[　\\s]*([\\s\\S]+?)(?=【(?:${nextPattern})|■(?:${nextPattern})|$)`, 'm'),
      new RegExp(`■${flexible}[　\\s]*[:：]?[　\\s]*([\\s\\S]+?)(?=【(?:${nextPattern})|■(?:${nextPattern})|$)`, 'm'),
    ]

    for (const re of patterns) {
      const m = text.match(re)
      if (m) return m[1].trim()
    }
  }
  return ''
}

function parseDate(raw: string): string {
  if (!raw) return ''
  if (raw.includes('即日')) return new Date().toISOString().split('T')[0]
  const m = raw.match(/(\d{4})[\/\-年](\d{1,2})(?:[\/\-月](\d{1,2}))?/)
  if (m) {
    const y = m[1]
    const mo = m[2].padStart(2, '0')
    const d = (m[3] ?? '01').padStart(2, '0')
    return `${y}-${mo}-${d}`
  }
  return ''
}

function parseBudget(raw: string): { min: string; max: string } {
  if (!raw) return { min: '', max: '' }

  // "60-70万" or "60～70万"
  const rangeMan = raw.match(/(\d+)[～〜~\-](\d+)\s*万/)
  if (rangeMan) return { min: String(Number(rangeMan[1]) * 10000), max: String(Number(rangeMan[2]) * 10000) }

  // "max49万" or "～40万"
  const maxMan = raw.match(/(?:max|〜|～|~|上限|MAX)\s*(\d+)\s*万/i)
  if (maxMan) return { min: '', max: String(Number(maxMan[1]) * 10000) }

  // "68万" single
  const singleMan = raw.match(/(\d+)\s*万/)
  if (singleMan) return { min: '', max: String(Number(singleMan[1]) * 10000) }

  // 直接数値 "700000"
  const direct = raw.match(/(\d{4,})/)
  if (direct) return { min: direct[1], max: '' }

  return { min: '', max: '' }
}

function parseWorkStyle(text: string): string {
  if (text.includes('フルリモート') || text.includes('完全リモート') || text.includes('在宅勤務')) return 'remote'
  if (text.includes('リモート無し') || text.includes('リモートなし') || text.includes('オンサイト') || text.includes('常駐')) return 'onsite'
  if (text.includes('ハイブリッド') || text.includes('リモート可') || text.includes('在宅')) return 'hybrid'
  return ''
}

export function parseProject(text: string): Partial<ProjectFormValues> {
  const project_name = extractByLabels(text, ['案件名', '案　件', '案件', 'プロジェクト名'])

  const client_name = extractByLabels(text, ['クライアント', 'クライアント名', 'エンドユーザー', '顧客名'])

  const provider_company = extractByLabels(text, ['提供会社', '紹介会社', '案件元', '元請け'])

  // 必須スキル
  const required_skills = extractMultiline(
    text,
    ['必須スキル', '必須要件', '必　須', '必須', 'スキル', '要件'],
    ['尚可', '場所', '単価', '期間', '時期', '募集', '面談', '商流', '備考', '補足']
  )

  // 開始日
  const startRaw = extractByLabels(text, [
    '開始時期', '参画時期', '参画可能時期', '時期', '期間', '作業期間', '開始日',
  ])
  const start_date = parseDate(startRaw)

  // 勤務地
  const locationRaw = extractByLabels(text, [
    '場所', '作業場所', '勤務地', '案件元場所', '勤務場所',
    '場　所', '作業場　所',
  ])
  // 最寄り駅を抽出
  const stationMatch = locationRaw.match(/最寄[りり]?[：:]?\s*([^\s　,、。）)]+駅)/)
    ?? locationRaw.match(/([^\s　（(]+駅)/)
  const nearest_station = stationMatch ? stationMatch[1] : ''
  const prefecture = locationRaw.replace(/最寄[りり]?[：:]?[^\s　]*駅/, '').replace(/[（(）)※]/g, '').trim().split(/[\s　]/)[0]

  // 勤務形態（リモート可否 列 or 本文から）
  const remoteRaw = extractByLabels(text, ['リモート可否', 'リモート', '勤務形態'])
  const work_style = parseWorkStyle(remoteRaw || locationRaw || text)

  // 単価
  const budgetRaw = extractByLabels(text, [
    '単価', '単　価', '予算', '条　件', '条件', '報酬', 'スキル見合い',
  ])
  const { min: budget_min, max: budget_max } = parseBudget(budgetRaw)

  // 募集人数
  const headcountRaw = extractByLabels(text, ['募集人数', '募集', '人　数', '人数', '募集数'])
  const headcountMatch = headcountRaw.match(/(\d+)/)
  const headcount = headcountMatch ? headcountMatch[1] : ''

  // 契約形態
  const contract_type = extractByLabels(text, ['契約形態', '契約', '契　約', '契約種別'])

  // 精算幅
  const work_hours = extractByLabels(text, ['精算', '時間幅', '基準', '精算幅', '稼働時間'])

  // 面談回数
  const interview_count = extractByLabels(text, ['面談', '面談回数', '面　談'])

  // 年齢制限
  const age_limit = extractByLabels(text, ['年齢', '年　齢', '年齢制限', '年齢上限'])

  // 外国籍
  const nationality = extractByLabels(text, ['外国籍', '国籍', '外　国籍'])

  // 個人事業主
  const freelancer = extractByLabels(text, ['個人事業主', '個人'])

  // 商流
  const supply_chain = extractByLabels(text, ['商流制限', '商　流', '商流', '商流条件'])

  // 概要（案件説明全文）
  const description = extractMultiline(
    text,
    ['案件概要', '概要', '作業内容', '業務内容', '内容', '概　要', '委託内容'],
    ['必須', '場所', '単価', '期間', '時期', '募集', '面談', '商流', '備考', '補足', '契約']
  ) || text.trim()

  return {
    project_name,
    client_name,
    provider_company,
    required_skills,
    start_date,
    prefecture,
    nearest_station,
    work_style,
    budget_min,
    budget_max,
    headcount,
    contract_type,
    work_hours,
    interview_count,
    age_limit,
    nationality,
    freelancer,
    supply_chain,
    description,
  }
}

export function generateProjectSummary(project: Project): string {
  const workStyleMap: Record<string, string> = {
    remote: 'フルリモート',
    hybrid: 'ハイブリッド（リモート可）',
    onsite: '常駐',
  }

  const budgetStr = project.budget_min
    ? project.budget_max
      ? `${Math.floor(project.budget_min / 10000)}〜${Math.floor(project.budget_max / 10000)}万`
      : `${Math.floor(project.budget_min / 10000)}万〜`
    : project.budget_max
    ? `〜${Math.floor(project.budget_max / 10000)}万`
    : ''

  const lines = [
    '==================================',
    `【案件名】　：${project.project_name}`,
    `【クライアント】：${project.client_name ?? ''}`,
    `【提供会社】：${project.provider_company ?? ''}`,
    `【場所】　　：${[project.prefecture, project.nearest_station].filter(Boolean).join('　')}`,
    `【リモート】：${project.work_style ? (workStyleMap[project.work_style] ?? project.work_style) : ''}`,
    `【開始時期】：${project.start_date ?? ''}`,
    `【単価】　　：${budgetStr}`,
    `【精算】　　：${project.work_hours ?? ''}`,
    `【募集人数】：${project.headcount ?? ''}名`,
    `【契約形態】：${project.contract_type ?? ''}`,
    `【必須スキル】：${project.required_skills.join('、')}`,
    `【商流】　　：${project.supply_chain ?? ''}`,
    `【面談】　　：${project.interview_count ?? ''}`,
    `【年齢】　　：${project.age_limit ?? ''}`,
    `【外国籍】　：${project.nationality ?? ''}`,
    `【個人事業主】：${project.freelancer ?? ''}`,
    `【概要】　　：${project.description ?? ''}`,
    '==================================',
  ]

  return lines.join('\n')
}
