import { UserRow } from "./user-row"

export type UsersListUser = {
  id: number
  email: string
  role: string
  joinedOn?: string
  joinedAt?: string
}

type UsersListProps = {
  users: UsersListUser[]
  onDeleteUser?: (id: number) => void
}

const formatJoined = (user: UsersListUser): string => {
  if (user.joinedOn) return user.joinedOn
  if (user.joinedAt) {
    const d = new Date(user.joinedAt)
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    }
  }
  return ""
}

export function UsersList({ users, onDeleteUser }: UsersListProps) {
  return (
    <div
      className="
        rounded-4xl
        border 
        border-[#e5e5e5]
        bg-card 
        p-8 
        shadow-sm
      "
    >
      <div
        className="
          mb-4
          grid 
          grid-cols-[1fr_auto_auto_auto]
          gap-4
          border-b
          border-[#e5e5e5] 
          pb-4
        "
      >
        <div className="text-base font-medium text-foreground">Email</div>
        <div className="w-32 text-base font-medium text-foreground">Role</div>
        <div className="w-32 text-base font-medium text-foreground">
          Joined On
        </div>
        <div className="w-8" />
      </div>

      {users.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No users found for this organization.
        </p>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <UserRow
              key={user.id}
              email={user.email}
              role={user.role}
              joinedOn={formatJoined(user)}
              onDelete={onDeleteUser ? () => onDeleteUser(user.id) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  )
}
