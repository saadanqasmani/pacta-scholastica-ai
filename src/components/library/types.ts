export interface LibraryShelf {
  id: string;
  university_id: string | null;
  owner_id: string;
  owner_name: string | null;
  owner_email: string | null;
  name: string;
  description: string | null;
  subject: string | null;
  color: string | null;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
}

export interface LibraryItem {
  id: string;
  shelf_id: string;
  created_by: string;
  created_by_name: string | null;
  title: string;
  author: string | null;
  item_type: string;
  description: string | null;
  external_url: string | null;
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export const SHELF_COLORS = [
  { value: 'blue', className: 'bg-blue-500/10 text-blue-700 border-blue-500/30', dot: 'bg-blue-500' },
  { value: 'green', className: 'bg-green-500/10 text-green-700 border-green-500/30', dot: 'bg-green-500' },
  { value: 'amber', className: 'bg-amber-500/10 text-amber-700 border-amber-500/30', dot: 'bg-amber-500' },
  { value: 'purple', className: 'bg-purple-500/10 text-purple-700 border-purple-500/30', dot: 'bg-purple-500' },
  { value: 'rose', className: 'bg-rose-500/10 text-rose-700 border-rose-500/30', dot: 'bg-rose-500' },
  { value: 'slate', className: 'bg-slate-500/10 text-slate-700 border-slate-500/30', dot: 'bg-slate-500' },
];

export const getShelfColor = (color: string | null) =>
  SHELF_COLORS.find((c) => c.value === color) || SHELF_COLORS[0];

export const ITEM_TYPES = [
  { value: 'book', labelKey: 'library.type.book' },
  { value: 'pdf', labelKey: 'library.type.pdf' },
  { value: 'article', labelKey: 'library.type.article' },
  { value: 'slides', labelKey: 'library.type.slides' },
  { value: 'video', labelKey: 'library.type.video' },
  { value: 'link', labelKey: 'library.type.link' },
  { value: 'note', labelKey: 'library.type.note' },
];

export const formatFileSize = (bytes: number | null) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
