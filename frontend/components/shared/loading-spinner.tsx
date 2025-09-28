interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
}

export function LoadingSpinner({ size = 'md', text, className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-32 w-32'
  }

  return (
    <div className={`text-center ${className}`}>
      <div className={`animate-spin rounded-full border-b-2 border-gray-900 mx-auto ${sizeClasses[size]}`}></div>
      {text && (
        <p className={`mt-2 text-gray-600 ${size === 'lg' ? 'text-base' : 'text-sm'}`}>
          {text}
        </p>
      )}
    </div>
  )
}
