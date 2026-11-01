import { useEffect, useRef, useId } from 'react';

export default function Modal({ title, onClose, children }) {
  const ref = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    const focused = document.activeElement;
    dialog.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { dialog.close(); document.body.style.overflow = previous; focused?.focus?.(); };
  }, []);
  return <dialog ref={ref} aria-labelledby={titleId} onCancel={e => { e.preventDefault(); onClose(); }} className="bk-modal">
    <div className="flex items-start justify-between gap-4 mb-5">
      <h2 id={titleId} className="text-xl font-extrabold text-[#002855]">{title}</h2>
      <button type="button" aria-label="Đóng hộp thoại" onClick={onClose} className="rounded-lg bg-gray-100 px-3 py-2 text-gray-700">✕</button>
    </div>
    {children}
  </dialog>;
}
