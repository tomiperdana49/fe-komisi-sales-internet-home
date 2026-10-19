const ALL = 'all'

// NusaWork branch names all share the company prefix ("PT. Media Antar Nusa - Medan");
// drop it so the dropdown just says "Medan".
export const branchLabel = (branch: string | null | undefined) =>
    branch ? branch.replace(/^PT\.\s*Media Antar Nusa\s*-\s*/i, '').trim() : 'Tanpa Branch'

// One branch selection shared by every summary tab, so switching tabs keeps the branch
// you picked — same idea as useSelectedPeriod. Lives for the browser session.
export const useBranchFilter = () => {
    const branch = useState<string>('summary-branch', () => ALL)

    const branchItems = (branches: (string | null | undefined)[]) => {
        const labels = new Set(branches.map(branchLabel))
        if (branch.value !== ALL) labels.add(branch.value)
        return [
            { label: 'Semua Branch', value: ALL },
            ...[...labels].sort().map(label => ({ label, value: label }))
        ]
    }

    const byBranch = <T>(rows: T[], getBranch: (row: T) => string | null | undefined) =>
        branch.value === ALL ? rows : rows.filter(r => branchLabel(getBranch(r)) === branch.value)

    return { branch, branchItems, byBranch }
}
