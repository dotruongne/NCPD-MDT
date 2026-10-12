export const OFFICER_RANKS = [
  "Chief of Police",
  "Assistant Chief of Police",
  "Deputy Chief of Police",
  "Captain",
  "Lieutenant",
  "Sergeant II",
  "Sergeant I",
  "Corporal",
  "Senior Officer",
  "Officer",
  "Cadet",
] as const;

export function isDeputyChief(rank: string) {
  return rank.trim().toLowerCase() === "deputy chief of police";
}

export function hasDepartmentAccess(role: string, rank: string) {
  return ["ACCOUNTING", "FTO", "HIGH_COMMAND"].includes(role) || isDeputyChief(rank);
}

export function hasFinanceAccess(role: string, rank: string) {
  return role === "ACCOUNTING" || role === "HIGH_COMMAND" || isDeputyChief(rank);
}

export function hasFtoAccess(role: string, rank: string) {
  return role === "FTO" || role === "HIGH_COMMAND" || isDeputyChief(rank);
}

export function hasPersonnelManagement(role: string, rank: string) {
  return role === "HIGH_COMMAND" || isDeputyChief(rank);
}

export function canManageLeaveRequests(role: string, rank: string) {
  return role === "SUPERVISOR" || hasPersonnelManagement(role, rank);
}
