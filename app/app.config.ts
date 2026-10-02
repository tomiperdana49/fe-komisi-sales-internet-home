export default defineAppConfig({
  ui: {
    colors: {
      primary: 'green',
      neutral: 'neutral'
    },
    container: {
      base: 'mx-auto px-4 sm:px-6 lg:px-8 max-w-full px-4 sm:px-6 lg:px-25'
    },
    table: {
      variants: {
        pinned: {
          // Default is bg-default/75, which lets scrolled columns show through pinned ones.
          true: {
            th: 'sticky bg-default z-1',
            td: 'sticky bg-default z-1'
          }
        }
      }
    }
  }
})
