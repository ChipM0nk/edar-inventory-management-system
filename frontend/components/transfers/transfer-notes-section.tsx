'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface TransferNotesSectionProps {
  transferNotes: string
  onTransferNotesChange: (notes: string) => void
}

export function TransferNotesSection({
  transferNotes,
  onTransferNotesChange
}: TransferNotesSectionProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Notes (Optional)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor="transfer-notes" className="text-sm font-medium">Additional Notes</Label>
          <Textarea
            id="transfer-notes"
            value={transferNotes}
            onChange={(e) => onTransferNotesChange(e.target.value)}
            placeholder="Add any additional notes or comments for this transfer..."
            className="resize-none"
            rows={3}
            tabIndex={8}
          />
        </div>
      </CardContent>
    </Card>
  )
}
