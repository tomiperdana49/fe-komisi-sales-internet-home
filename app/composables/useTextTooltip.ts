import { h, type VNode } from 'vue'
import TextTooltip from '~/components/TextTooltip.vue'

// Render-function counterpart of <TextTooltip> for table cells.
export const useTextTooltip = () => {
    const withTooltip = (text: string | null | undefined, child: VNode) => h(TextTooltip, { text }, () => child)

    return { withTooltip }
}
