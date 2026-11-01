let current = null;
const queue = [];
const listeners = new Set();
function publish() { for (const listener of listeners) listener(); }
function enqueue(message, confirm = false) {
  return new Promise(resolve => {
    queue.push({ message: String(message), confirm, resolve });
    if (!current) current = queue.shift();
    publish();
  });
}
export const notify = message => enqueue(message);
export const askConfirm = message => enqueue(message, true);
export const subscribeDialogs = listener => { listeners.add(listener); return () => listeners.delete(listener); };
export const getDialog = () => current;
export function settleDialog(answer) {
  const previous = current;
  current = queue.shift() || null;
  previous?.resolve(answer);
  publish();
}
