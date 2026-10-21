export type AdminRole = 'super_admin' | 'admin'

/** One ACL entry on the "Akses Admin" page. */
export interface AdminAccessItem {
    id: number
    employeeId: string
    name: string | null
    photoProfile: string | null
    jobPosition: string | null
    employeeBranch: string | null
    role: AdminRole
    /** Branch an Admin is limited to; null for every branch. */
    branch: string | null
    note: string | null
    createdBy: string
    createdByName: string | null
    createdAt: string
    updatedBy: string | null
    updatedByName: string | null
    updatedAt: string | null
}

export interface AdminAccessList {
    items: AdminAccessItem[]
    /** Branches an Admin can be limited to. */
    branches: string[]
}

/** A Nusawork employee found when adding access. */
export interface AdminCandidate {
    employeeId: string
    name: string
    photoProfile: string
    jobPosition: string
    organizationName: string
    branch: string
    hasAccess: boolean
}

export interface AdminAccessInput {
    role: AdminRole
    branch: string | null
    note: string | null
}
