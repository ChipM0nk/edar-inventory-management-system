interface EmptyStateProps {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`text-center py-8 ${className}`}>
      <p className="text-gray-500">{title}</p>
      {description && (
        <p className="text-sm text-gray-400 mt-2">{description}</p>
      )}
      {action && (
        <div className="mt-4">{action}</div>
      )}
    </div>
  )
}
