"use client";

import { useRef, useState } from "react";
import { Upload, FileText, X } from "lucide-react";

const MAX_FILE = 10 * 1024 * 1024; // 10 MB

export function FileDrop({
  files,
  onChange,
}: {
  files: File[];
  onChange: (f: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const add = (list: FileList | null) => {
    if (!list) return;
    const validi = Array.from(list).filter((f) => f.size <= MAX_FILE);
    onChange([...files, ...validi].slice(0, 10));
  };

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          add(e.dataTransfer.files);
        }}
        className={`cursor-pointer rounded-xl border border-dashed px-6 py-8 text-center transition ${
          drag ? "border-primary bg-primary-soft" : "border-border-strong bg-surface-2 hover:bg-surface-hover"
        }`}
      >
        <Upload size={22} className="mx-auto mb-2 text-muted" />
        <p className="text-sm font-medium">Trascina qui i documenti o clicca per selezionarli</p>
        <p className="mt-0.5 text-xs text-muted-2">PDF, immagini (JPG/PNG) o TXT — max 10 file, 10 MB ciascuno</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.txt"
          className="hidden"
          onChange={(e) => add(e.target.files)}
        />
      </div>
      {files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {files.map((f, i) => (
            <li
              key={`${f.name}-${i}`}
              className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            >
              <FileText size={15} className="text-primary" />
              <span className="flex-1 truncate">{f.name}</span>
              <button
                onClick={() => onChange(files.filter((_, idx) => idx !== i))}
                className="text-muted-2 hover:text-danger"
                aria-label="Rimuovi"
              >
                <X size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
