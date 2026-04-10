import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "./RichTextEditor.css";
import { TOOLBAR_OPTIONS, EDITOR_FORMATS } from "@/lib/editorConfig";
import { sanitizeHtml, isEditorEmpty } from "@/lib/sanitize";
import { uploadToCloudinary } from "@/lib/uploadToCloudinary";

export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  /** Fires with true when editor is empty, false when it has content */
  onValidation?: (isEmpty: boolean) => void;
  disabled?: boolean;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Start writing...",
  onValidation,
  disabled = false,
}: RichTextEditorProps) {
  const quillRef = useRef<ReactQuill>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  const handleChange = useCallback(
    (raw: string) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        const clean = sanitizeHtml(raw);
        onChange(clean);
        onValidation?.(isEditorEmpty(clean));
      }, 300);
    },
    [onChange, onValidation],
  );

  const imageHandler = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      setUploadError(null);
      setUploading(true);

      try {
        const url = await uploadToCloudinary(file);
        const editor = quillRef.current?.getEditor();
        if (!editor) return;
        const range = editor.getSelection(true);
        editor.insertEmbed(range.index, "image", url);
        editor.setSelection(range.index + 1, 0);
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : "Upload failed.");
      } finally {
        setUploading(false);
      }
    };

    input.click();
  }, []);

  // Memoized so Quill never sees a new modules object between renders.
  // If modules changes identity, Quill tears down and rebuilds the toolbar.
  const modules = useMemo(
    () => ({
      toolbar: {
        container: TOOLBAR_OPTIONS,
        handlers: { image: imageHandler },
      },
    }),
    [imageHandler],
  );

  return (
    <div className="rte-wrapper">
      {uploading && (
        <div className="rte-upload-overlay" aria-live="polite">
          Uploading image...
        </div>
      )}

      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={handleChange}
        modules={modules}
        formats={EDITOR_FORMATS}
        placeholder={placeholder}
        readOnly={disabled}
      />

      {uploadError && (
        <p className="rte-error" role="alert">
          {uploadError}
        </p>
      )}
    </div>
  );
}
