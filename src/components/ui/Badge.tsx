import { getStatusBadgeColor, getStatusLabel } from '@/lib/utils'

interface BadgeProps {
  status: string
  className?: string
}

export default function Badge({ status, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold tracking-wide ${getStatusBadgeColor(status)} ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60 mr-1.5" />
      {getStatusLabel(status)}
    </span>
  )
}
