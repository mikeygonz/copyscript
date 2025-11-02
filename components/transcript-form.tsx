"use client"

import { useState, useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { getTranscript } from "@/app/actions"
import { Copy, Check } from "lucide-react"

export const TranscriptForm = () => {
  const [state, formAction, isPending] = useActionState(getTranscript, null)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (state?.transcript) {
      await navigator.clipboard.writeText(state.transcript)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="url"
              name="url"
              placeholder="https://youtube.com/watch?v=..."
              required
              disabled={isPending}
              className="w-full"
            />
          </div>
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Fetching..." : "Get Transcript"}
          </Button>
        </form>

        {state?.error && (
          <div className="mt-4 p-3 bg-destructive/10 text-destructive text-sm rounded-md">{state.error}</div>
        )}
      </Card>

      {state?.transcript && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium">Transcript</h2>
            <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2 bg-transparent">
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
          </div>
          <div className="bg-muted p-4 rounded-md max-h-96 overflow-y-auto">
            <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed">{state.transcript}</pre>
          </div>
        </Card>
      )}
    </div>
  )
}
