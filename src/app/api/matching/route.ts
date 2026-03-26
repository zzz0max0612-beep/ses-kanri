import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  const { project, engineers } = await req.json()

  const engineerList = engineers.map((e: Record<string, unknown>, i: number) => `
[要員${i + 1}]
ID: ${e.id}
名前: ${e.name}
スキル: ${(e.skills as string[]).join('、') || 'なし'}
資格: ${(e.certifications as string[]).join('、') || 'なし'}
対応工程: ${(e.processes as string[]).join('、') || 'なし'}
経験年数: ${e.experience_years != null ? `${e.experience_years}年` : '不明'}
勤務形態: ${e.work_style || '不明'}
希望単価: ${e.rate_min != null ? `${e.rate_min}〜${e.rate_max ?? ''}円` : '不明'}
稼働可能日: ${e.available_date || '不明'}
営業状況: ${e.sales_status || '不明'}
`.trim()).join('\n\n')

  const projectInfo = `
案件名: ${project.project_name}
必須スキル: ${(project.required_skills as string[]).join('、') || 'なし'}
勤務形態: ${project.work_style || '不問'}
予算: ${project.budget_min != null ? `${project.budget_min}〜${project.budget_max ?? ''}円` : '不明'}
開始日: ${project.start_date || '不明'}
契約形態: ${project.contract_type || '不明'}
年齢制限: ${project.age_limit || 'なし'}
案件概要: ${project.description || 'なし'}
`.trim()

  const prompt = `
あなたはSES営業のマッチングAIです。以下の案件情報と要員情報を照合し、マッチ率が高い順にTop5をJSON形式で出力してください。

【案件情報】
${projectInfo}

【要員一覧】
${engineerList}

【評価基準】
- スキル一致度（最重要）：必須スキルとの一致・類似スキルも考慮
- 勤務形態の適合性
- 単価の合致
- 稼働可能日（案件開始日に間に合うか）
- 営業状況（営業中・並行営業中を優遇）
- 経験年数・対応工程

【出力形式】
以下のJSON形式のみで返答してください。説明文は不要です。
{
  "matches": [
    {
      "engineer_id": "要員のID",
      "score": 85,
      "matched_skills": ["一致したスキル1", "一致したスキル2"],
      "reason": "マッチ理由を2〜3文で簡潔に"
    }
  ]
}
`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    })

    const content = response.choices[0].message.content ?? '{}'
    const result = JSON.parse(content)
    return NextResponse.json(result)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('OpenAI API error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
