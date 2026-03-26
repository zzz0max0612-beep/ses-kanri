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
    <header className="bg-white border-b shadow-sm sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
        <Link href="/" className="font-bold text-lg text-blue-700 tracking-tight">
          SES営業管理
        </Link>
        {pathname !== '/login' && (
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
            <button
              onClick={handleLogout}
              className="ml-2 px-3 py-1.5 rounded text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              ログアウト
            </button>
          </nav>
        )}
      </div>
    </header>
  )
}
