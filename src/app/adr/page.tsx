"use client"

import { Check, User, Pencil, ArrowLeftRight, AlertTriangle } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

function ParticipantItem({ handle, role }: { handle: string; role: string }) {
  return (
    <div className="flex items-center gap-2">
      <Avatar className="size-8">
        <AvatarFallback className="bg-primary/10 text-xs">
          <User className="size-4" />
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <span className="text-sm font-medium">{handle}</span>
        <span className="text-xs text-muted-foreground">{role}</span>
      </div>
    </div>
  )
}

function ADRSidebar() {
  return (
    <aside className="w-80 shrink-0 bg-background p-6">
      <div className="space-y-8">
        {/* Decision */}
        <section>
          <h3 className="mb-3 text-lg font-semibold text-purple-600">Decision</h3>
          <div className="flex items-center gap-2 text-sm">
            <div className="flex size-5 items-center justify-center rounded bg-green-500">
              <Check className="size-3 text-white" />
            </div>
            <span className="text-muted-foreground">Adopted on Date</span>
          </div>
        </section>

        {/* Participant */}
        <section>
          <h3 className="mb-3 text-lg font-semibold text-purple-600">Participant</h3>
          <div className="space-y-3">
            <ParticipantItem handle="@Alice" role="Creator" />
            <ParticipantItem handle="@Bob" role="Reviewer" />
            <ParticipantItem handle="@Carlos" role="Observer (has commented)" />
          </div>
        </section>

        {/* Consequences (sidebar) */}
        <section>
          <h3 className="mb-3 text-lg font-semibold text-purple-600">Consequences</h3>
          <p className="mb-3 text-xs text-muted-foreground">
            List of RFC that will be impacted by the decision if adopted (or not?)
          </p>

          {/* Name + alert triangle */}
          <div className="flex items-center gap-2 text-sm">
            <div className="flex size-5 items-center justify-center rounded bg-purple-100">
              <AlertTriangle className="size-3 text-purple-600" />
            </div>
            <span className="text-black">Name</span>
          </div>

          {/* Purple round actions */}
          <div className="mt-4 flex flex-col items-start gap-3">
            <button
              type="button"
              aria-label="Edit"
              className="flex size-10 items-center justify-center rounded-full bg-purple-600 text-white shadow hover:bg-purple-700"
            >
              <Pencil className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Replace"
              className="flex size-10 items-center justify-center rounded-full bg-purple-600 text-white shadow hover:bg-purple-700"
            >
              <ArrowLeftRight className="size-5" />
            </button>
          </div>
        </section>
      </div>
    </aside>
  )
}

export default function ADRPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Top title */}
      <header className="bg-background px-6 py-5">
        <h1 className="mx-auto max-w-5xl text-center text-2xl font-semibold">ADR Title</h1>
      </header>

      <div className="mx-auto flex max-w-6xl">
        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="space-y-10">
            {/* Context */}
            <section>
              <h2 className="mb-4 text-2xl font-semibold text-purple-600">Context</h2>
              <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                <p>
                  Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisque faucibus ex sapien vitae
                  pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean
                  sed diam urna tempor. Pulvinar, vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa
                  nisl, malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti
                  sociosqu. Ad litora torquent per conubia nostra, inceptos himenaeos.
                </p>
              </div>
            </section>

            {/* Consequences (main) */}
            <section>
              <h2 className="mb-4 text-2xl font-semibold text-purple-600">Consequences</h2>
              <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                <p>
                  Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisque faucibus ex sapien vitae
                  pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed
                  diam urna tempor. Pulvinar, vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl,
                  malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad
                  litora torquent per conubia nostra, inceptos himenaeos.
                </p>
                <p>
                  Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisque faucibus ex sapien vitae
                  pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed
                  diam urna tempor. Pulvinar, vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl,
                  malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad
                  litora torquent per conubia nostra, inceptos himenaeos.
                </p>
              </div>
            </section>

            {/* Alternatives mentioned */}
            <section>
              <h2 className="mb-4 text-2xl font-semibold text-purple-600">Alternatives mentioned</h2>
              <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                <p>
                  Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisque faucibus ex sapien vitae
                  pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed
                  diam urna tempor. Pulvinar, vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl,
                  malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad
                  litora torquent per conubia nostra, inceptos himenaeos.
                </p>
                <p>
                  Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisque faucibus ex sapien vitae
                  pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed
                  diam urna tempor. Pulvinar, vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl,
                  malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad
                  litora torquent per conubia nostra, inceptos himenaeos.
                </p>
              </div>
            </section>
          </div>
        </main>

        {/* Right Sidebar */}
        <ADRSidebar />
      </div>
    </div>
  )
}
