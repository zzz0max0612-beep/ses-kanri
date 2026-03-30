'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

const navItems = [
  { href: '/', label: 'ホーム' },
  { href: '/engineers', label: '要員管理' },
  { href: '/projects', label: '案件管理' },
  { href: '/proposals', label: '提案管理' },
]

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="bg-gray-900 border-b border-gray-700 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
        <Link href="/" className="font-bold text-base text-white tracking-tight">
          SES<span className="text-blue-400">営業管理</span>
        </Link>
        {pathname !== '/login' && (
          <nav className="flex items-center gap-0.5">
            {navItems.map((item) => {
              const isActive = item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
            <button
              onClick={handleLogout}
              className="ml-3 px-3 py-1.5 rounded-md text-sm font-medium text-gray-500 hover:text-gray-300 transition-colors border border-gray-700 hover:border-gray-500"
            >
              ログアウト
            </button>
          </nav>
        )}
      </div>
    </header>
  )
}
