import { Extension } from '@tiptap/core'
import { Plugin } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

// Live editor highlighting: colour the You:/Me:/Them:/Notes: label at the start of each body block,
// so writing dialogue is colour-coded the same way the reader shows it. (The Title block is skipped.)
const LABEL = /^(\s*)(you|me|them|notes?)\s*:/i

function kindClass(name: string): string {
  const n = name.toLowerCase()
  if (n === 'you' || n === 'me') return 'cm-speaker--mine'
  if (n === 'them') return 'cm-speaker--other'
  return 'cm-speaker--note'
}

export const SpeakerHighlight = Extension.create({
  name: 'speakerHighlight',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          decorations(state) {
            const decos: Decoration[] = []
            state.doc.forEach((node, offset, index) => {
              if (index === 0) return // first block is the Title
              if (!node.isTextblock) return
              const m = LABEL.exec(node.textContent)
              if (!m) return
              const start = offset + 1 + m[1].length
              const end = offset + 1 + m[0].length
              decos.push(Decoration.inline(start, end, { class: 'cm-speaker ' + kindClass(m[2]) }))
            })
            return DecorationSet.create(state.doc, decos)
          },
        },
      }),
    ]
  },
})
