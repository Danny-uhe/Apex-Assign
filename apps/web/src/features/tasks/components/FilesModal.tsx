import { useEffect, useRef, useState } from 'react';
import { X, FileText, ImageIcon, Download, Upload, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { taskService, type ApiAttachment } from '../services/task.service';

type Props = {
  open: boolean;
  taskId: string;
  taskTitle: string;
  onClose: () => void;
  onUploaded?: () => void;
};

function fileTypeOf(mime: string, name: string): 'pdf' | 'image' | 'file' {
  if (mime.startsWith('image/')) return 'image';
  if (mime === 'application/pdf' || name.toLowerCase().endsWith('.pdf')) return 'pdf';
  return 'file';
}

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const iconMap = {
  pdf: { icon: FileText, bg: 'bg-red-500/10', color: 'text-red-400' },
  image: { icon: ImageIcon, bg: 'bg-orange-500/10', color: 'text-orange-500 dark:text-orange-400' },
  file: { icon: FileText, bg: 'bg-zinc-800', color: 'text-zinc-300' },
};

export default function FilesModal({ open, taskId, taskTitle, onClose, onUploaded }: Props) {
  const [files, setFiles] = useState<ApiAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open || !taskId) return;
    setLoading(true);
    taskService
      .getAttachments(taskId)
      .then((res) => setFiles(res.data.attachments ?? []))
      .catch(() => toast.error('Failed to load attachments'))
      .finally(() => setLoading(false));
  }, [open, taskId]);

  if (!open) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (picked.length === 0) return;

    setUploading(true);
    try {
      const res = await taskService.uploadAttachments(taskId, picked);
      setFiles((prev) => [...(res.data.attachments ?? []), ...prev]);
      toast.success('Files uploaded');
      onUploaded?.();
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Failed to upload files (PDF, PNG, JPG, DOCX up to 10MB)'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (file: ApiAttachment) => {
    try {
      await taskService.downloadAttachment(file.fileUrl, file.originalName);
    } catch {
      toast.error('Failed to download file');
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4'>
      <div className='flex h-[80dvh] w-full max-w-lg flex-col rounded-t-2xl border border-zinc-700 bg-zinc-900 text-zinc-100 shadow-2xl sm:h-auto sm:max-h-[80vh] sm:rounded-2xl'>
        {/* Header */}
        <div className='flex items-start justify-between gap-3 border-b border-zinc-800 px-5 py-4 sm:px-6'>
          <div className='min-w-0'>
            <h2 className='font-bold text-zinc-100'>Files</h2>
            <p className='mt-0.5 truncate text-xs text-zinc-500'>{taskTitle}</p>
          </div>
          <button
            onClick={onClose}
            className='rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500'
          >
            <X size={18} />
          </button>
        </div>

        {/* File grid */}
        <div className='flex-1 overflow-y-auto px-5 py-4 sm:px-6'>
          {loading ? (
            <div className='flex justify-center py-12'>
              <Loader2 size={24} className='animate-spin text-orange-600' />
            </div>
          ) : files.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-12 text-zinc-500'>
              <p className='text-sm'>No files attached yet</p>
            </div>
          ) : (
            <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
              {files.map((f) => {
                const kind = fileTypeOf(f.mimeType, f.originalName);
                const { icon: Icon, bg, color } = iconMap[kind];
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
                        {f.originalName}
                      </p>
                      <p className='text-[10px] text-zinc-500'>{fmtSize(f.fileSize)}</p>
                    </div>
                    <button
                      type='button'
                      onClick={() => void handleDownload(f)}
                      title='Download file'
                      className='rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-orange-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500'
                    >
                      <Download size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Upload button */}
        <div className='border-t border-zinc-800 px-5 py-4 sm:px-6'>
          <input
            ref={inputRef}
            type='file'
            multiple
            accept='.pdf,.png,.jpg,.jpeg,.docx'
            className='hidden'
            onChange={handleFileChange}
          />
          <button
            type='button'
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className='flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-700 py-3 text-sm font-medium text-zinc-400 transition hover:border-orange-600 hover:text-orange-400 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500'
          >
            {uploading ? <Loader2 size={16} className='animate-spin' /> : <Upload size={16} />}
            {uploading ? 'Uploading…' : 'Upload Files (PDF, PNG, JPG, DOCX)'}
          </button>
        </div>
      </div>
    </div>
  );
}
