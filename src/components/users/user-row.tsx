import { X } from "lucide-react"

export type UserRowProps = {
  email: string
  role: string
  firstname: string
  lastName: string
  joinedOn?: string
  onDelete?: () => void
  isAdmin: boolean
}

export function UserRow({ email, role, firstname, lastName, joinedOn, onDelete, isAdmin }: UserRowProps) {
  return (
    <div className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] items-center gap-4 rounded-full bg-muted/40 px-6 py-3">
      <div className="text-sm">{firstname}{" "}{lastName}</div>
      <div className="text-sm">{email}</div>
      <div className="w-32 text-sm">{role}</div>
      <div className="w-32 text-sm">
        {joinedOn || "-"}
      </div>
      { isAdmin && (
        <button
          type="button"
          onClick={onDelete}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border hover:bg-red-500 transition text-gray-700"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
