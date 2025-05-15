import type { Role } from "owlbear-utils";

export function canEditScript(role: Role, local: boolean) {
    return role === "GM" || local;
}
