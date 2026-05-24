export default function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div className="relative">
        <div className={`${sizes[size]} rounded-full border-2 border-gray-200`} />
        <div className={`absolute inset-0 ${sizes[size]} rounded-full border-2 border-transparent border-t-blue-600 animate-spin`} />
      </div>
      <p className="text-sm text-gray-400 animate-pulse">Memuat...</p>
    </div>
  )
}
