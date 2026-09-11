"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  showToolbar?: boolean;
  minHeight?: string;
}

function ToolbarButton({
  active,
  onClick,
  children,
  title,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={cn(
        "rounded px-2 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-primary/15 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({
  name,
  defaultValue = "",
  placeholder,
  className,
  showToolbar = true,
  minHeight = "80px",
}: RichTextEditorProps) {
  const hiddenInput = useRef<HTMLInputElement>(null);

  const updateHidden = useCallback(
    (html: string) => {
      if (hiddenInput.current) {
        const isEmpty =
          html === "<p></p>" || html === "" || html === "<p><br></p>";
        hiddenInput.current.value = isEmpty ? "" : html;
      }
    },
    [],
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        code: false,
        blockquote: false,
        horizontalRule: false,
      }),
      Underline,
      Placeholder.configure({ placeholder }),
    ],
    content: defaultValue || "",
    editorProps: {
      attributes: {
        class: `w-full px-3 py-2 text-sm text-foreground outline-none prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5`,
        style: `min-height: ${minHeight}`,
      },
    },
    onUpdate: ({ editor: e }) => {
      updateHidden(e.getHTML());
    },
    onCreate: ({ editor: e }) => {
      updateHidden(e.getHTML());
    },
  });

  if (!editor) return null;

  return (
    <div
      className={cn(
        "rounded-md border border-border bg-background transition-colors focus-within:border-foreground/50",
        className,
      )}
    >
      {showToolbar && (
        <div className="flex flex-wrap items-center gap-0.5 border-b border-border px-2 py-1.5">
          <ToolbarButton
            title="Bold"
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            B
          </ToolbarButton>
          <ToolbarButton
            title="Italic"
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <em>I</em>
          </ToolbarButton>
          <ToolbarButton
            title="Underline"
            active={editor.isActive("underline")}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <span className="underline">U</span>
          </ToolbarButton>
          <div className="mx-1 h-4 w-px bg-border" />
          <ToolbarButton
            title="Bullet list"
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            • List
          </ToolbarButton>
          <ToolbarButton
            title="Numbered list"
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            1. List
          </ToolbarButton>
        </div>
      )}
      <EditorContent editor={editor} />
      <input type="hidden" name={name} ref={hiddenInput} />
    </div>
  );
}
