import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, MessageCircle, Send, X } from 'lucide-react';
import { chat, confirmChatAction } from '../lib/api.js';
import { formatCurrency } from '../lib/format.js';

let idCounter = 0;
function nextId() {
  idCounter += 1;
  return idCounter;
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [log, setLog] = useState([
    { id: nextId(), role: 'assistant', text: "Hi! Ask me about your balances, spending, or say something like \"move £50 to savings\"." },
  ]);
  const [apiHistory, setApiHistory] = useState([]);
  const [pendingAction, setPendingAction] = useState(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [log, open]);

  function applyResponse(data) {
    setApiHistory(data.history || []);
    setLog((prev) => {
      const next = [...prev];
      if (data.reply) next.push({ id: nextId(), role: 'assistant', text: data.reply });
      (data.executedActions || []).forEach((action) => {
        next.push({
          id: nextId(),
          role: 'action',
          text: `Transferred ${formatCurrency(action.amount)} from ${action.fromAccountId} to ${action.toAccountId}.`,
        });
      });
      return next;
    });
    setPendingAction(data.pendingAction || null);
  }

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setLog((prev) => [...prev, { id: nextId(), role: 'user', text }]);
    setSending(true);
    try {
      const data = await chat(text, apiHistory);
      applyResponse(data);
    } catch (err) {
      setLog((prev) => [
        ...prev,
        { id: nextId(), role: 'assistant', text: err.response?.data?.error || 'Something went wrong, try again.' },
      ]);
    } finally {
      setSending(false);
    }
  }

  async function handleConfirm(approved) {
    if (!pendingAction || sending) return;
    setSending(true);
    try {
      const data = await confirmChatAction(apiHistory, pendingAction.toolUseId, approved);
      applyResponse(data);
    } catch (err) {
      setLog((prev) => [
        ...prev,
        { id: nextId(), role: 'assistant', text: err.response?.data?.error || 'Something went wrong, try again.' },
      ]);
      setPendingAction(null);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-20">
      {open && (
        <div className="mb-3 flex h-[28rem] w-80 flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <span className="text-sm font-semibold">Financial assistant</span>
            <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {log.map((entry) => (
              <div
                key={entry.id}
                className={
                  entry.role === 'user'
                    ? 'ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-brand-600 px-3 py-2 text-sm text-white'
                    : entry.role === 'action'
                      ? 'flex items-center gap-2 rounded-2xl border border-emerald-800 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300'
                      : 'max-w-[85%] rounded-2xl rounded-bl-sm bg-slate-800 px-3 py-2 text-sm text-slate-100'
                }
              >
                {entry.role === 'action' && <CheckCircle2 className="h-4 w-4 shrink-0" />}
                {entry.text}
              </div>
            ))}

            {pendingAction && (
              <div className="rounded-2xl border border-amber-800 bg-amber-500/10 p-3 text-sm text-amber-200">
                <p className="font-medium">Confirm transfer</p>
                <p className="mt-1 text-xs opacity-90">
                  Move {formatCurrency(pendingAction.input?.amount)} from {pendingAction.input?.fromAccountId} to{' '}
                  {pendingAction.input?.toAccountId}?
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    disabled={sending}
                    onClick={() => handleConfirm(true)}
                    className="rounded-lg bg-amber-500 px-3 py-1 text-xs font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-60"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    disabled={sending}
                    onClick={() => handleConfirm(false)}
                    className="rounded-lg border border-amber-700 px-3 py-1 text-xs font-semibold hover:bg-amber-900/30 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-slate-800 p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your finances…"
              disabled={sending || Boolean(pendingAction)}
              className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-brand-500 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={sending || Boolean(pendingAction)}
              className="rounded-lg bg-brand-600 p-2 text-white hover:bg-brand-700 disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg hover:bg-brand-700"
      >
        <MessageCircle className="h-5 w-5" />
      </button>
    </div>
  );
}
