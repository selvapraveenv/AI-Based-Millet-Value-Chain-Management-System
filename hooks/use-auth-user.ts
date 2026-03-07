"use client"

import { useEffect, useState } from "react"
import { getLoggedInUser, type AuthUser } from "@/lib/auth"

export function useAuthUser() {
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    const syncUser = () => {
      setUser(getLoggedInUser())
    }

    syncUser()

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "user") {
        syncUser()
      }
    }

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        syncUser()
      }
    }

    window.addEventListener("storage", handleStorage)
    window.addEventListener("focus", syncUser)
    document.addEventListener("visibilitychange", handleVisibility)

    return () => {
      window.removeEventListener("storage", handleStorage)
      window.removeEventListener("focus", syncUser)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [])

  return user
}
