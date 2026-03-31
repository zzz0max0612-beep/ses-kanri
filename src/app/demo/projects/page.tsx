import { mockProjects } from '@/lib/mock-data'
import ProjectCard from '@/components/ProjectCard'

export default function DemoProjectsPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">案件一覧</h1>
        <span className="text-sm text-gray-500 bg-gray-800 border border-gray-700 px-3 py-1.5 rounded">
          {mockProjects.length}件登録中
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockProjects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onDelete={() => {}}
            isDemo
          />
        ))}
      </div>
    </main>
  )
}
