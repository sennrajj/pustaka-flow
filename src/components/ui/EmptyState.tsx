import { HiInbox } from 'react-icons/hi'

interface EmptyStateProps {
  title?: string
  message?: string
  icon?: React.ReactNode
}

export default function EmptyState({
  title = 'Data tidak ditemukan',
  message = 'Belum ada data yang tersedia.',
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        {icon || <HiInbox className="w-8 h-8 text-gray-300" />}
      </div>
      <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-xs">{message}</p>
    </div>
  )
}
