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
    color: 'border-blue-200 hover:border-blue-400 hover:bg-blue-50',
    addHref: '/engineers/new',
  },
  {
    href: '/projects',
    title: '案件管理',
    description: '案件の登録・条件管理・ステータスの追跡',
    icon: '📋',
    color: 'border-green-200 hover:border-green-400 hover:bg-green-50',
    addHref: '/projects/new',
  },
  {
    href: '/proposals',
    title: '提案管理',
    description: '要員と案件のマッチング・提案ステータスの管理',
    icon: '🤝',
    color: 'border-purple-200 hover:border-purple-400 hover:bg-purple-50',
    addHref: '/proposals/new',
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
    <main className="max-w-5xl mx-auto px-4 py-10">
      {/* タイトル */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-800">SES営業管理システム</h1>
        <p className="text-gray-500 mt-1">要員・案件・提案をひとまとめに管理します</p>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
        <div className="bg-white rounded-xl shadow-sm border p-4 col-span-1">
          <p className="text-xs text-gray-400 mb-1">要員数</p>
          <p className="text-3xl font-bold text-gray-800">{stats.engineers}</p>
          <p className="text-xs text-blue-500 mt-1">営業中 {stats.activeEngineers}名</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4 col-span-1">
          <p className="text-xs text-gray-400 mb-1">案件数</p>
          <p className="text-3xl font-bold text-gray-800">{stats.projects}</p>
          <p className="text-xs text-green-500 mt-1">営業中 {stats.activeProjects}件</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4 col-span-1">
          <p className="text-xs text-gray-400 mb-1">提案数</p>
          <p className="text-3xl font-bold text-gray-800">{stats.proposals}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4 col-span-2 md:col-span-2 flex flex-col justify-center">
          <p className="text-xs text-gray-400 mb-2">クイックアクション</p>
          <div className="flex flex-wrap gap-2">
            <Link href="/engineers/new"
              className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700">
              ＋ 要員追加
            </Link>
            <Link href="/projects/new"
              className="text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700">
              ＋ 案件追加
            </Link>
            <Link href="/proposals/new"
              className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded hover:bg-purple-700">
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
            className={`bg-white rounded-xl shadow-sm border-2 p-6 flex flex-col gap-3 transition-all ${card.color}`}
          >
            <div className="text-3xl">{card.icon}</div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">{card.title}</h2>
              <p className="text-sm text-gray-500 mt-1">{card.description}</p>
            </div>
            <span className="text-xs text-gray-400 mt-auto">一覧を見る →</span>
          </Link>
        ))}
      </div>
    </main>
  )
}
