import { X } from "lucide-react"

export type UserRowProps = {
  email: string
  role: string
  joinedOn?: string
  onDelete?: () => void
}

export function UserRow({ email, role, joinedOn, onDelete }: UserRowProps) {
  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 rounded-full bg-muted/40 px-6 py-3">
      <div className="text-sm text-foreground">{email}</div>
      <div className="w-32 text-sm text-foreground">{role}</div>
      <div className="w-32 text-sm text-foreground">
        {joinedOn || "-"}
      </div>
      <button
        type="button"
        onClick={onDelete}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground hover:bg-muted transition"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
