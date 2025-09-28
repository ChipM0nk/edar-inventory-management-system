import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import { getStatusColor, getValidationStatusColor, getValidationIcon } from '@/lib/utils'

interface StatusBadgeProps {
  status: string
  variant?: 'default' | 'validation'
  className?: string
}

export function StatusBadge({ status, variant = 'default', className = '' }: StatusBadgeProps) {
  const colorClass = variant === 'validation' 
    ? getValidationStatusColor(status) 
    : getStatusColor(status)
  
  const iconName = variant === 'validation' ? getValidationIcon(status) : null
  
  const Icon = iconName === 'CheckCircle' ? CheckCircle :
               iconName === 'AlertTriangle' ? AlertTriangle :
               iconName === 'XCircle' ? XCircle : null

  return (
    <Badge className={`${colorClass} flex items-center gap-1 ${className}`}>
      {Icon && <Icon className="h-4 w-4" />}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}
