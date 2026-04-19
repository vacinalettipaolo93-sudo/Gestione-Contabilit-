import React, { useEffect, useMemo, useState } from 'react';
import { Expense, ExpenseCategory } from '../types';
import { PlusIcon, TrashIcon, PencilIcon } from './icons';

type Props = {
  isOpen: boolean;
  onClose: () => void;

  currentDate: Date;

  categories: ExpenseCategory[];
  expenses: Expense[];

  onAddCategory: (name: string) => Promise<void> | void;
  onRenameCategory: (categoryId: string, newName: string) => Promise<void> | void;
  onDeleteCategory: (categoryId: string) => Promise<void> | void;

  onAddExpense: (data: Omit<Expense, 'id'>) => Promise<void> | void;
  onUpdateExpense: (data: Expense) => Promise<void> | void;
  onDeleteExpense: (id: string) => Promise<void> | void;
};

const toYYYYMMDD = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const ExpensesModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentDate,
  categories,
  expenses,
  onAddCategory,
  onRenameCategory,
  onDeleteCategory,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
}) => {
  const monthExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const dt = new Date(e.date + 'T00:00:00');
      return dt.getFullYear() === currentDate.getFullYear() && dt.getMonth() === currentDate.getMonth();
    });
  }, [expenses, currentDate]);

  const totalMonth = useMemo(() => monthExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0), [monthExpenses]);

  // Category form
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState<string>('');

  // Expense form
  const [expenseIdEditing, setExpenseIdEditing] = useState<string | null>(null);
  const [expenseDate, setExpenseDate] = useState<string>(toYYYYMMDD(new Date()));
  const [expenseCategoryId, setExpenseCategoryId] = useState<string>('');
  const [expenseName, setExpenseName] = useState<string>('');
  const [expenseAmount, setExpenseAmount] = useState<string>('');
  const [expenseNotes, setExpenseNotes] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;
    setExpenseDate(toYYYYMMDD(new Date(currentDate.getFullYear(), currentDate.getMonth(), new Date().getDate())));
    setExpenseIdEditing(null);
    setExpenseName('');
    setExpenseAmount('');
    setExpenseNotes('');
    setExpenseCategoryId(categories[0]?.id || '');
  }, [isOpen, currentDate, categories]);

  const catNameById = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categories]);

  const grouped = useMemo(() => {
    const map = new Map<string, Expense[]>();
    for (const e of monthExpenses) {
      const key = e.categoryId || 'uncat';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    // sort by date desc
    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => (a.date < b.date ? 1 : -1));
      map.set(k, arr);
    }
    return map;
  }, [monthExpenses]);

  const startEditExpense = (e: Expense) => {
    setExpenseIdEditing(e.id);
    setExpenseDate(e.date);
    setExpenseCategoryId(e.categoryId);
    setExpenseName(e.name);
    setExpenseAmount(String(e.amount ?? ''));
    setExpenseNotes(e.notes || '');
  };

  const resetExpenseForm = () => {
    setExpenseIdEditing(null);
    setExpenseDate(toYYYYMMDD(new Date()));
    setExpenseCategoryId(categories[0]?.id || '');
    setExpenseName('');
    setExpenseAmount('');
    setExpenseNotes('');
  };

  const handleSubmitExpense = async () => {
    if (!expenseCategoryId) {
      alert('Seleziona una categoria.');
      return;
    }
    if (!expenseName.trim()) {
      alert('Inserisci un nome spesa.');
      return;
    }
    const amount = Number(expenseAmount);
    if (!Number.isFinite(amount)) {
      alert('Inserisci un importo valido.');
      return;
    }

    if (expenseIdEditing) {
      await onUpdateExpense({
        id: expenseIdEditing,
        date: expenseDate,
        categoryId: expenseCategoryId,
        name: expenseName.trim(),
        amount,
        notes: expenseNotes?.trim() || '',
      });
    } else {
      await onAddExpense({
        date: expenseDate,
        categoryId: expenseCategoryId,
        name: expenseName.trim(),
        amount,
        notes: expenseNotes?.trim() || '',
      } as Omit<Expense, 'id'>);
    }

    resetExpenseForm();
  };

  const canDeleteCategory = (categoryId: string) => {
    return !monthExpenses.some((e) => e.categoryId === categoryId) && !expenses.some((e) => e.categoryId === categoryId);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex justify-center items-start p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 rounded-2xl shadow-2xl p-6 w-full max-w-4xl border border-white/10 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Spese</h2>
            <p className="text-sm text-zinc-400">Totale mese: € {totalMonth.toFixed(2)}</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            ✕
          </button>
        </div>

        {/* Categories */}
        <div className="bg-black/20 p-5 rounded-2xl border border-white/5 shadow-sm mb-6">
          <h3 className="font-bold text-lg text-zinc-100 mb-3">Categorie</h3>

          <div className="flex gap-2 mb-4">
            <input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="flex-grow px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-zinc-200 focus:ring-2 focus:ring-indigo-500/50 outline-none"
              placeholder="Nuova categoria (es. Auto, Casa...)"
            />
            <button
              onClick={async () => {
                const name = newCategoryName.trim();
                if (!name) return;
                await onAddCategory(name);
                setNewCategoryName('');
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors text-sm font-semibold"
            >
              Aggiungi
            </button>
          </div>

          <div className="space-y-2">
            {categories.length === 0 ? (
              <p className="text-sm text-zinc-400 italic">Nessuna categoria. Creane una per iniziare.</p>
            ) : (
              categories.map((c) => (
                <div key={c.id} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-2">
                  {editingCategoryId === c.id ? (
                    <>
                      <input
                        value={editingCategoryName}
                        onChange={(e) => setEditingCategoryName(e.target.value)}
                        className="flex-grow px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-zinc-200 outline-none"
                      />
                      <button
                        onClick={async () => {
                          const nn = editingCategoryName.trim();
                          if (!nn) return;
                          await onRenameCategory(c.id, nn);
                          setEditingCategoryId(null);
                          setEditingCategoryName('');
                        }}
                        className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 text-sm font-semibold"
                      >
                        Salva
                      </button>
                      <button
                        onClick={() => {
                          setEditingCategoryId(null);
                          setEditingCategoryName('');
                        }}
                        className="px-3 py-2 bg-white/10 text-zinc-200 rounded-lg hover:bg-white/20 text-sm font-semibold"
                      >
                        Annulla
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-grow text-sm text-zinc-200 font-medium px-2">{c.name}</span>
                      <button
                        onClick={() => {
                          setEditingCategoryId(c.id);
                          setEditingCategoryName(c.name);
                        }}
                        className="p-2 text-zinc-300 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                        title="Rinomina"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          if (!canDeleteCategory(c.id)) {
                            alert('Non puoi eliminare una categoria che è usata da una o più spese.');
                            return;
                          }
                          const ok = window.confirm(`Eliminare la categoria "${c.name}"?`);
                          if (!ok) return;
                          await onDeleteCategory(c.id);
                        }}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Elimina"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Expense Form */}
        <div className="bg-black/20 p-5 rounded-2xl border border-white/5 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-lg text-zinc-100">
              {expenseIdEditing ? 'Modifica Spesa' : 'Nuova Spesa'}
            </h3>
            {expenseIdEditing && (
              <button
                onClick={resetExpenseForm}
                className="text-sm px-3 py-2 rounded-lg bg-white/10 text-zinc-200 hover:bg-white/20"
              >
                Annulla modifica
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-zinc-400">Data</label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-zinc-200 outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-400">Categoria</label>
              <select
                value={expenseCategoryId}
                onChange={(e) => setExpenseCategoryId(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-zinc-200 outline-none"
              >
                {categories.length === 0 ? (
                  <option value="">(Crea una categoria)</option>
                ) : (
                  categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs text-zinc-400">Nome spesa</label>
              <input
                value={expenseName}
                onChange={(e) => setExpenseName(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-zinc-200 outline-none"
                placeholder="Es. Benzina, Mutuo, Cambio gomme..."
              />
            </div>

            <div>
              <label className="text-xs text-zinc-400">Importo (€)</label>
              <input
                type="number"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-zinc-200 outline-none"
                placeholder="0.00"
              />
            </div>

            <div className="md:col-span-3">
              <label className="text-xs text-zinc-400">Note (opzionale)</label>
              <input
                value={expenseNotes}
                onChange={(e) => setExpenseNotes(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-zinc-200 outline-none"
                placeholder="Es. dove, dettagli..."
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleSubmitExpense}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-cyan-500 text-white rounded-lg hover:from-indigo-500 hover:to-cyan-400 font-semibold"
              >
                <PlusIcon className="w-4 h-4" />
                {expenseIdEditing ? 'Salva' : 'Aggiungi'}
              </button>
            </div>
          </div>
        </div>

        {/* Expenses list */}
        <div className="bg-black/20 p-5 rounded-2xl border border-white/5 shadow-sm">
          <h3 className="font-bold text-lg text-zinc-100 mb-3">Spese del mese</h3>

          {monthExpenses.length === 0 ? (
            <p className="text-sm text-zinc-400 italic">Nessuna spesa nel mese selezionato.</p>
          ) : (
            <div className="space-y-4">
              {[...grouped.entries()].map(([categoryId, arr]) => {
                const title = categoryId === 'uncat' ? 'Senza categoria' : (catNameById.get(categoryId) || 'Categoria');
                const tot = arr.reduce((s, e) => s + (Number(e.amount) || 0), 0);
                return (
                  <div key={categoryId} className="border border-white/10 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
                      <div>
                        <div className="text-sm font-bold text-zinc-200">{title}</div>
                        <div className="text-xs text-zinc-400">Totale: € {tot.toFixed(2)}</div>
                      </div>
                    </div>

                    <div className="divide-y divide-white/5">
                      {arr.map((e) => (
                        <div key={e.id} className="flex items-center justify-between px-4 py-3">
                          <div className="min-w-0">
                            <div className="text-sm text-zinc-200 font-medium truncate">{e.name}</div>
                            <div className="text-xs text-zinc-500">
                              {e.date}{e.notes ? ` • ${e.notes}` : ''}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="text-sm font-bold text-zinc-100 w-28 text-right">€ {Number(e.amount).toFixed(2)}</div>
                            <button
                              onClick={() => startEditExpense(e)}
                              className="p-2 text-zinc-300 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                              title="Modifica"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={async () => {
                                const ok = window.confirm(`Eliminare la spesa "${e.name}"?`);
                                if (!ok) return;
                                await onDeleteExpense(e.id);
                              }}
                              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                              title="Elimina"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpensesModal;
