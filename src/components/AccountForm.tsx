import React, { useState } from 'react';
import { Plus } from 'lucide-react';

interface AccountFormProps {
  onAdd: (email: string, days: number, hours: number, minutes: number) => void;
}

export default function AccountForm({ onAdd }: AccountFormProps) {
  const [email, setEmail] = useState('');
  const [days, setDays] = useState('0');
  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('0');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    onAdd(
      email,
      parseInt(days, 10) || 0,
      parseInt(hours, 10) || 0,
      parseInt(minutes, 10) || 0
    );

    setEmail('');
    setDays('0');
    setHours('0');
    setMinutes('0');
  };

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex flex-col gap-6">
      <div>
        <label className="block text-sm font-medium text-zinc-400 mb-2">E-mail da Conta</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ex. usuario@exemplo.com"
          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-400 mb-2">Tempo até a recarga</label>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="500"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all pr-12 text-right font-mono"
              />
              <span className="absolute right-4 top-3.5 text-zinc-500 text-sm pointer-events-none">d</span>
            </div>
          </div>
          <div>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="500"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all pr-12 text-right font-mono"
              />
              <span className="absolute right-4 top-3.5 text-zinc-500 text-sm pointer-events-none">h</span>
            </div>
          </div>
          <div>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="500"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all pr-14 text-right font-mono"
              />
              <span className="absolute right-4 top-3.5 text-zinc-500 text-sm pointer-events-none">min</span>
            </div>
          </div>
        </div>
      </div>

      <button
        type="submit"
        className="mt-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl py-3 px-4 flex items-center justify-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
      >
        <Plus size={20} />
        Adicionar Rastreador
      </button>
    </form>
  );
}
