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
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon || <HiInbox className="w-12 h-12 text-gray-300 mb-3" />}
      <h3 className="text-sm font-medium text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  )
}
