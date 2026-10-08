import { h, type VNode } from 'vue'
// Explicit import: Nuxt only rewrites resolveComponent() inside .vue files, not in composables.
import { UTooltip } from '#components'

// Same look as the TermHint tooltips: capped width, long text wraps.
export const textTooltipUi = { content: 'max-w-xs h-auto whitespace-normal', text: 'whitespace-normal' }

// For text cut off by truncate/line-clamp: hovering shows it in full.
export const useTextTooltip = () => {
    const withTooltip = (text: string | null | undefined, child: VNode) => text
        ? h(UTooltip, { text, delayDuration: 0, content: { side: 'top' }, ui: textTooltipUi }, () => child)
        : child

    return { withTooltip }
}
