import { ReactNode } from "react"
import { Building } from "lucide-react"

interface EmptyStateProps {
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg my-8 bg-gray-50 min-h-[200px]">
      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Building className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-lg font-medium text-center">{title}</h3>
      <p className="text-muted-foreground text-center mt-1 mb-4">{description}</p>
      {action}
    </div>
  )
}