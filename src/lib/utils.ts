import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


// Parse the backend description into context and problem sections.
// Expected formats handled:
// 1) "Context: ... ---RFCSPLIT--- Problem: ..."
// 2) "Context: ... Problem: ..." (no splitter)
// 3) Single block (no split) -> context only, problem empty
export const parseDescription = (desc: string | null | undefined): { context: string; problem: string } => {
  const empty = { context: '', problem: '' };
  if (!desc) return empty

  const splitter = '---RFCSPLIT---'

  // If the explicit splitter is present, split on it
  if (desc.includes(splitter)) {
    const [left = '', right = ''] = desc.split(splitter)
    // Remove any leading whitespace/newlines before checking for the Problem: label
    const context = left.replace(/^Context:\s*/i, '').trim()
    const problem = right.replace(/^\s*/,'').replace(/^Problem:\s*/i, '').trim()
    return { context, problem }
  }

  // Try to find a "Problem:" label inside the same string
  const problemLabelRegex = /Problem:\s*/i
  const problemMatch = desc.search(problemLabelRegex)
  if (problemMatch !== -1) {
    const contextPart = desc.slice(0, problemMatch).replace(/^Context:\s*/i, '').trim()
    const problemPart = desc.slice(problemMatch).replace(/^Problem:\s*/i, '').trim()
    return { context: contextPart, problem: problemPart }
  }

  // Nothing to split; treat entire description as context
  return { context: desc.trim(), problem: '' }
}