import type { AuthUser } from "../types/auth";
import { adminPaths } from "../navigation/adminPaths";

export function getPostLoginDestination(
  returnTo: unknown,
  user: AuthUser,
): string {
  if (
    typeof returnTo === "string" &&
    (returnTo === "/education" || returnTo.startsWith("/education/")) &&
    !returnTo.startsWith("//") &&
    !returnTo.includes("\\")
  ) {
    return returnTo;
  }

  return user.role === "Admin" ? adminPaths.users : adminPaths.education;
}
