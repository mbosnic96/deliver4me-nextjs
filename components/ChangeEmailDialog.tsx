"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react" // Add useEffect
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function ChangeEmailDialog({
  open,
  onOpenChange,
  currentEmail,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentEmail: string
}) {
  const { data: session } = useSession()
  const [email, setEmail] = useState("") // Initialize empty
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Add useEffect to update email when dialog opens or currentEmail changes
  useEffect(() => {
    if (open) {
      setEmail(currentEmail)
      setError(null)
    }
  }, [open, currentEmail])

  async function handleSave() {
    if (!session?.user?.id) {
      setError("User not logged in")
      return
    }
    
    if (email === currentEmail) {
      onOpenChange(false)
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/users/${session.user.id}/email`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        const { error } = await res.json()
        throw new Error(error || "Failed to update email")
      }

      onOpenChange(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Email</DialogTitle>
          <DialogDescription>
            Pažljivo unesite novu email adresu. 
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2">
          <Input
            type="email"
            placeholder={`Current: ${currentEmail}`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={loading || !email || email === currentEmail}
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}