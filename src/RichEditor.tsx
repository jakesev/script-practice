import { useEffect, useReducer } from 'react'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { bodyToDoc } from './doc'
import { SpeakerHighlight } from './speakerHighlight'
import type { ReactNode } from 'react'

function Tool({
  editor,
  children,
  active,
  run,
}: {
  editor: Editor | null
  children: ReactNode
  active: boolean
  run: () => void
}) {
  return (
    <button
      type="button"
      className={'tool' + (active ? ' active' : '')}
      // Keep the editor's selection — a plain click would blur it first.
      onMouseDown={(e) => e.preventDefault()}
      onClick={run}
      disabled={!editor}
    >
      {children}
    </button>
  )
}

export function RichEditor({
  scriptId,
  initialBody,
  onChange,
}: {
  scriptId: string
  initialBody: string
  onChange: (json: string) => void
}) {
  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({ heading: { levels: [2, 3] } }),
        Placeholder.configure({
          placeholder: 'Title here… then your script. Use You: / Them: for dialogue.',
        }),
        SpeakerHighlight,
      ],
      content: bodyToDoc(initialBody),
      immediatelyRender: false,
      onUpdate: ({ editor }) => onChange(JSON.stringify(editor.getJSON())),
    },
    // Rebuild the editor when switching to a different Script.
    [scriptId],
  )

  // Re-render the toolbar (active states) on every editor transaction.
  const [, force] = useReducer((x) => x + 1, 0)
  useEffect(() => {
    if (!editor) return
    editor.on('transaction', force)
    return () => {
      editor.off('transaction', force)
    }
  }, [editor])

  return (
    <div className="rich">
      <div className="toolbar">
        <Tool editor={editor} active={!!editor?.isActive('bold')} run={() => editor?.chain().focus().toggleBold().run()}>
          <b>B</b>
        </Tool>
        <Tool editor={editor} active={!!editor?.isActive('italic')} run={() => editor?.chain().focus().toggleItalic().run()}>
          <i>I</i>
        </Tool>
        <Tool
          editor={editor}
          active={!!editor?.isActive('heading', { level: 2 })}
          run={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H
        </Tool>
        <Tool
          editor={editor}
          active={!!editor?.isActive('bulletList')}
          run={() => editor?.chain().focus().toggleBulletList().run()}
        >
          • List
        </Tool>
      </div>
      <EditorContent className="rich-editor" editor={editor} />
    </div>
  )
}
