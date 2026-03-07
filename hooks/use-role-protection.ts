import { useAuthUser } from "./use-auth-user"

/**
 * Hook to protect dashboard pages based on user role
 * Returns null if role matches, error message if not
 */
export function useRoleProtection(requiredRole: string): string | null {
  const authUser = useAuthUser()

  // If no user is authenticated, don't block - let page handle it
  if (!authUser) return null

  // Check if user's role matches required role
  if (authUser.role?.toLowerCase() !== requiredRole.toLowerCase()) {
    return `Access denied. This dashboard is for ${requiredRole}s only. You are logged in as a ${authUser.role}.`
  }

  return null
}
