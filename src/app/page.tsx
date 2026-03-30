'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'

const supabase = createClient()

type Stats = {
  engineers: number
  projects: number
  proposals: number
  activeEngineers: number
  activeProjects: number
}

const menuCards = [
  {
    href: '/engineers',
    title: '要員管理',
    description: '要員の登録・スキル管理・稼働状況の確認',
    icon: '👤',
    gradient: 'from-blue-400 to-blue-600',
  },
  {
    href: '/projects',
    title: '案件管理',
    description: '案件の登録・条件管理・ステータスの追跡',
    icon: '📋',
    gradient: 'from-emerald-400 to-emerald-600',
  },
  {
    href: '/proposals',
    title: '提案管理',
    description: '要員と案件のマッチング・提案ステータスの管理',
    icon: '🤝',
    gradient: 'from-violet-400 to-violet-600',
  },
]

export default function HomePage() {
  const [stats, setStats] = useState<Stats>({
    engineers: 0,
    projects: 0,
    proposals: 0,
    activeEngineers: 0,
    activeProjects: 0,
  })

  useEffect(() => {
    const fetchStats = async () => {
      const [
        { count: engineers },
        { count: projects },
        { count: proposals },
        { count: activeEngineers },
        { count: activeProjects },
      ] = await Promise.all([
        supabase.from('engineers').select('*', { count: 'exact', head: true }),
        supabase.from('projects').select('*', { count: 'exact', head: true }),
        supabase.from('proposals').select('*', { count: 'exact', head: true }),
        supabase.from('engineers').select('*', { count: 'exact', head: true })
          .in('sales_status', ['営業中', '並行営業中']),
        supabase.from('projects').select('*', { count: 'exact', head: true })
          .eq('status', '営業中'),
      ])

      setStats({
        engineers: engineers ?? 0,
        projects: projects ?? 0,
        proposals: proposals ?? 0,
        activeEngineers: activeEngineers ?? 0,
        activeProjects: activeProjects ?? 0,
      })
    }

    fetchStats()
  }, [])

  return (
    <div className="min-h-screen bg-gray-900">
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* タイトル */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-white">ダッシュボード</h1>
          <p className="text-sm text-gray-400 mt-0.5">要員・案件・提案の状況を確認できます</p>
        </div>

        {/* サマリーカード */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
            <p className="text-xs text-gray-400 mb-2">要員数</p>
            <p className="text-3xl font-bold text-white">{stats.engineers}</p>
            <p className="text-xs text-blue-400 mt-1">営業中 {stats.activeEngineers}名</p>
          </div>
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
            <p className="text-xs text-gray-400 mb-2">案件数</p>
            <p className="text-3xl font-bold text-white">{stats.projects}</p>
            <p className="text-xs text-emerald-400 mt-1">営業中 {stats.activeProjects}件</p>
          </div>
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
            <p className="text-xs text-gray-400 mb-2">提案数</p>
            <p className="text-3xl font-bold text-white">{stats.proposals}</p>
          </div>
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-5 flex flex-col justify-center">
            <p className="text-xs text-gray-400 mb-3">クイックアクション</p>
            <div className="flex flex-col gap-1.5">
              <Link href="/engineers/new"
                className="text-xs bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 text-center transition-colors">
                ＋ 要員追加
              </Link>
              <Link href="/projects/new"
                className="text-xs bg-emerald-500 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-600 text-center transition-colors">
                ＋ 案件追加
              </Link>
              <Link href="/proposals/new"
                className="text-xs bg-violet-500 text-white px-3 py-1.5 rounded-lg hover:bg-violet-600 text-center transition-colors">
                ＋ 提案追加
              </Link>
            </div>
          </div>
        </div>

        {/* メニューカード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {menuCards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden hover:border-gray-500 transition-all group"
            >
              <div className={`bg-gradient-to-br ${card.gradient} h-24 flex items-center justify-center text-4xl`}>
                {card.icon}
              </div>
              <div className="p-5">
                <h2 className="text-sm font-semibold text-white">{card.title}</h2>
                <p className="text-xs text-gray-400 mt-1">{card.description}</p>
                <span className="text-xs text-gray-500 mt-3 block group-hover:text-blue-400 transition-colors">一覧を見る →</span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
