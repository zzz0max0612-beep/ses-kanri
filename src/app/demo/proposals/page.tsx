import { mockProposals } from '@/lib/mock-data'
import { Proposal, ProposalStatus } from '@/types'

const STATUSES: ProposalStatus[] = ['提案中', '面談調整中', '面談済', '成約', '見送り']

const statusColor: Record<ProposalStatus, string> = {
  '提案中': 'border-blue-500/30',
  '面談調整中': 'border-yellow-500/30',
  '面談済': 'border-purple-500/30',
  '成約': 'border-green-500/30',
  '見送り': 'border-gray-600',
}

const statusHeaderColor: Record<ProposalStatus, string> = {
  '提案中': 'bg-blue-500/20 text-blue-300',
  '面談調整中': 'bg-yellow-500/20 text-yellow-300',
  '面談済': 'bg-purple-500/20 text-purple-300',
  '成約': 'bg-green-500/20 text-green-300',
  '見送り': 'bg-gray-700 text-gray-400',
}

export default function DemoProposalsPage() {
  const grouped = STATUSES.reduce<Record<ProposalStatus, Proposal[]>>((acc, s) => {
    acc[s] = mockProposals.filter((p) => p.status === s)
    return acc
  }, {} as Record<ProposalStatus, Proposal[]>)

  return (
    <main className="px-4 py-8">
      <div className="flex justify-between items-center mb-6 max-w-full">
        <h1 className="text-2xl font-bold text-white">提案管理</h1>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STATUSES.map((status) => (
          <div key={status} className="flex-shrink-0 w-64">
            <div className={`text-sm font-semibold px-3 py-1.5 rounded-t ${statusHeaderColor[status]}`}>
              {status}
              <span className="ml-2 text-xs font-normal opacity-70">
                {grouped[status].length}件
              </span>
            </div>
            <div className="bg-gray-800 border border-gray-700 border-t-0 rounded-b p-2 flex flex-col gap-2 min-h-32">
              {grouped[status].map((proposal) => (
                <DemoProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  colorClass={statusColor[status]}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}

function DemoProposalCard({ proposal, colorClass }: { proposal: Proposal; colorClass: string }) {
  const engineerName = proposal.engineers?.name ?? '不明'
  const projectName = proposal.projects?.project_name ?? '不明'

  return (
    <div className={`border rounded p-3 flex flex-col gap-1.5 text-sm bg-gray-800/80 ${colorClass}`}>
      <p className="font-semibold text-white leading-snug">{engineerName}</p>
      <p className="text-gray-300 text-xs leading-snug">{projectName}</p>
      {proposal.affiliation && (
        <p className="text-xs text-gray-400">所属: {proposal.affiliation}</p>
      )}
      {proposal.client_name && (
        <p className="text-xs text-gray-400">提案先: {proposal.client_name}</p>
      )}
      <p className="text-xs text-gray-500">{proposal.proposed_date}</p>
    </div>
  )
}
