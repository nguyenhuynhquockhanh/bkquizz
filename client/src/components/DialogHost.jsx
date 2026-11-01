import { useSyncExternalStore } from 'react';
import { subscribeDialogs, getDialog, settleDialog } from '../services/dialogs';
import Modal from './Modal';

export default function DialogHost() {
  const dialog = useSyncExternalStore(subscribeDialogs, getDialog);
  if (!dialog) return null;
  return <Modal title={dialog.confirm ? 'Xác nhận' : 'Thông báo'} onClose={() => settleDialog(false)}>
    <p className="text-gray-700 whitespace-pre-wrap break-words" role="status">{dialog.message}</p>
    <div className="flex flex-wrap justify-end gap-3 mt-6">
      {dialog.confirm && <button autoFocus onClick={() => settleDialog(false)} className="px-5 py-3 rounded-lg bg-gray-100 font-bold">Hủy</button>}
      <button autoFocus={!dialog.confirm} onClick={() => settleDialog(true)} className="px-5 py-3 rounded-lg bg-[#0275b8] text-white font-bold">{dialog.confirm ? 'Xác nhận' : 'Đã hiểu'}</button>
    </div>
  </Modal>;
}
