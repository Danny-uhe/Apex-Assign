import { useRef, useState } from 'react';
import { X, FileText, ImageIcon, Download, Upload, Trash2 } from 'lucide-react';

type FileItem = {
  id: number;
  name: string;
  size: string;
  type: 'pdf' | 'image' | 'file';
};

const SEED_FILES: FileItem[] = [
  { id: 1, name: 'Audit_Report.pdf', size: '1.2 MB', type: 'pdf' },
  { id: 2, name: 'New_Styles.png', size: '4.5 MB', type: 'image' },
  { id: 3, name: 'Spacing_System.pdf', size: '800 KB', type: 'pdf' },
];

type Props = {
  open: boolean;
  taskTitle: string;
  onClose: () => void;
};

const iconMap = {
  pdf: { icon: FileText, bg: 'bg-red-500/10', color: 'text-red-300' },
  image: { icon: ImageIcon, bg: 'bg-cyan-500/10', color: 'text-cyan-300' },
  file: { icon: FileText, bg: 'bg-zinc-800', color: 'text-zinc-300' },
};

export default function FilesModal({ open, taskTitle, onClose }: Props) {
  const [files, setFiles] = useState<FileItem[]>(SEED_FILES);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    const newFiles: FileItem[] = picked.map((f) => ({
      id: Date.now() + Math.random(),
      name: f.name,
      size: `${(f.size / 1024 / 1024).toFixed(1)} MB`,
      type: f.type.startsWith('image') ? 'image' : f.name.endsWith('.pdf') ? 'pdf' : 'file',
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleDelete = (id: number) =>
    setFiles((prev) => prev.filter((f) => f.id !== id));

  return (
    <div className='fixed inset-0 z-50 flex items-end justify-center p-0 bg-black/50 sm:items-center sm:p-4'>
      <div className='flex h-[75vh] w-full max-w-lg flex-col rounded-t-2xl border border-zinc-700 bg-zinc-900 text-zinc-100 shadow-2xl sm:h-auto sm:max-h-[80vh] sm:rounded-2xl'>
        {/* Header */}
        <div className='flex items-start justify-between border-b border-zinc-800 px-6 py-4'>
          <div>
            <h2 className='font-bold text-zinc-100'>Files</h2>
            <p className='mt-0.5 truncate text-xs text-zinc-500'>{taskTitle}</p>
          </div>
          <button
            onClick={onClose}
            className='rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400'
          >
            <X size={18} />
          </button>
        </div>

        {/* File grid */}
        <div className='flex-1 overflow-y-auto px-6 py-4'>
          {files.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-12 text-zinc-500'>
              <p className='text-sm'>No files attached yet</p>
            </div>
          ) : (
            <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
              {files.map((f) => {
                const { icon: Icon, bg, color } = iconMap[f.type];
                return (
                  <div
                    key={f.id}
                    className='group flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/70 p-3 transition hover:border-zinc-700'
                  >
                    <div
                      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${bg}`}
                    >
                      <Icon size={18} className={color} />
                    </div>
                    <div className='min-w-0 flex-1'>
                      <p className='truncate text-xs font-semibold text-zinc-200'>
                        {f.name}
                      </p>
                      <p className='text-[10px] text-zinc-500'>{f.size}</p>
                    </div>
                    <div className='flex gap-1 opacity-0 transition group-hover:opacity-100'>
                      <button className='rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400'>
                        <Download size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(f.id)}
                        className='rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400'
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Upload button */}
        <div className='border-t border-zinc-800 px-6 py-4'>
          <input
            ref={inputRef}
            type='file'
            multiple
            className='hidden'
            onChange={handleFileChange}
          />
          <button
            onClick={() => inputRef.current?.click()}
            className='flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-700 py-3 text-sm font-medium text-zinc-400 transition hover:border-cyan-500 hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400'
          >
            <Upload size={16} />
            Upload Files
          </button>
        </div>
      </div>
    </div>
  );
}
