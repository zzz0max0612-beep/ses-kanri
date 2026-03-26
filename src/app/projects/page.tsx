'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Project } from '@/types'

const ACTIVE_STATUSES = ['提案中', '面談調整中', '面談済']
import ProjectCard from '@/components/ProjectCard'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [proposalCounts, setProposalCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      setLoading(false)
      return
    }
    const projectData = data ?? []
    setProjects(projectData)

    if (projectData.length > 0) {
      const ids = projectData.map((p) => p.id)
      const { data: proposalData } = await supabase
        .from('proposals')
        .select('project_id, status')
        .in('project_id', ids)
        .in('status', ACTIVE_STATUSES)

      const counts: Record<string, number> = {}
      for (const p of proposalData ?? []) {
        counts[p.project_id] = (counts[p.project_id] ?? 0) + 1
      }
      setProposalCounts(counts)
    }

    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('この案件を削除しますか？')) return
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) alert('削除に失敗しました')
    else setProjects((prev) => prev.filter((p) => p.id !== id))
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">案件一覧</h1>
        <Link
          href="/projects/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          ＋ 案件を追加
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-500">読み込み中...</p>
      ) : projects.length === 0 ? (
        <p className="text-gray-500">案件が登録されていません。</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} onDelete={handleDelete} activeProposalCount={proposalCounts[project.id] ?? 0} />
          ))}
        </div>
      )}
    </main>
  )
}
