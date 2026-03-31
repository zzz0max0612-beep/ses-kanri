import Link from 'next/link'
import { mockEngineers, mockProjects, mockProposals } from '@/lib/mock-data'

export default function DemoPage() {
  const activeProposals = mockProposals.filter(
    (p) => p.status === '提案中' || p.status === '面談調整中' || p.status === '面談済'
  )

  const stats = [
    { label: '登録要員数', value: mockEngineers.length, unit: '名', color: 'text-blue-400' },
    { label: '登録案件数', value: mockProjects.length, unit: '件', color: 'text-green-400' },
    { label: '進行中の提案', value: activeProposals.length, unit: '件', color: 'text-purple-400' },
  ]

  const menuItems = [
    {
      href: '/demo/engineers',
      title: '要員管理',
      description: 'エンジニア情報・スキル・稼働状況を一元管理',
      color: 'from-blue-600/20 to-blue-800/20 border-blue-700/50',
      count: `${mockEngineers.length}名登録中`,
    },
    {
      href: '/demo/projects',
      title: '案件管理',
      description: '案件情報・必須スキル・単価・条件を管理',
      color: 'from-green-600/20 to-green-800/20 border-green-700/50',
      count: `${mockProjects.length}件登録中`,
    },
    {
      href: '/demo/proposals',
      title: '提案管理',
      description: '提案〜成約までのパイプラインをカンバンで管理',
      color: 'from-purple-600/20 to-purple-800/20 border-purple-700/50',
      count: `進行中 ${activeProposals.length}件`,
    },
  ]

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">
          SES<span className="text-blue-400">営業管理</span>
        </h1>
        <p className="text-gray-400">
          SES営業チームの要員・案件・提案を一元管理するシステムです。
          AIによる自動マッチング機能搭載。
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {stats.map((s) => (
          <div key={s.label} className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}<span className="text-lg ml-1">{s.unit}</span></p>
            <p className="text-sm text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Menu */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`bg-gradient-to-br ${item.color} border rounded-xl p-6 hover:brightness-110 transition-all`}
          >
            <h2 className="text-lg font-bold text-white mb-2">{item.title}</h2>
            <p className="text-sm text-gray-300 mb-4">{item.description}</p>
            <p className="text-xs text-gray-400">{item.count}</p>
          </Link>
        ))}
      </div>
    </main>
  )
}
