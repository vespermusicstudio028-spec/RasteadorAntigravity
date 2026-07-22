import React, { useEffect, useState } from 'react';
import { Trash2, Clock, Zap, Pencil, Check, X } from 'lucide-react';
import type { Account } from '../types';

interface AccountCardProps {
  key?: React.Key;
  account: Account;
  onDelete: (id: string) => Promise<void> | void;
  onUpdate?: (id: string, days: number, hours: number, minutes: number) => Promise<void> | void;
}

export default function AccountCard({ account, onDelete, onUpdate }: AccountCardProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isReady: false });
  const [isEditing, setIsEditing] = useState(false);
  
  const [editDays, setEditDays] = useState('0');
  const [editHours, setEditHours] = useState('0');
  const [editMinutes, setEditMinutes] = useState('0');

  useEffect(() => {
    const target = new Date(account.targetDate).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isReady: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isReady: false });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [account.targetDate]);

  const handleEditClick = () => {
    setIsEditing(true);
    setEditDays('0');
    setEditHours('0');
    setEditMinutes('0');
  };

  const handleSaveEdit = async () => {
    if (onUpdate) {
      await onUpdate(
        account.id, 
        parseInt(editDays, 10) || 0,
        parseInt(editHours, 10) || 0,
        parseInt(editMinutes, 10) || 0
      );
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl border p-6 transition-all ${timeLeft.isReady && !isEditing ? 'bg-blue-900/20 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)] animate-[pulse_4s_ease-in-out_infinite]' : 'bg-zinc-900 border-zinc-800'}`}>
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          <h3 className="font-medium text-zinc-100 flex items-center gap-2 text-lg break-all pr-4">
            {account.email}
          </h3>
          <p className="text-sm text-zinc-500 mt-1">
            Alvo: {new Date(account.targetDate).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2">
          {!isEditing && onUpdate && (
             <button
              onClick={handleEditClick}
              className="text-zinc-500 hover:text-blue-400 p-2 rounded-full hover:bg-zinc-800 transition-colors"
              title="Editar tempo"
            >
              <Pencil size={18} />
            </button>
          )}
          <button
            onClick={() => onDelete(account.id)}
            className="text-zinc-500 hover:text-red-400 p-2 rounded-full hover:bg-zinc-800 transition-colors"
            title="Remover rastreador"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {isEditing ? (
          <div className="w-full">
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4">
              <div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={editDays}
                    onChange={(e) => setEditDays(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all pr-8 sm:pr-12 text-right font-mono text-sm sm:text-base"
                  />
                  <span className="absolute right-3 sm:right-4 top-2 sm:top-3.5 text-zinc-500 text-sm pointer-events-none">d</span>
                </div>
              </div>
              <div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={editHours}
                    onChange={(e) => setEditHours(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all pr-8 sm:pr-12 text-right font-mono text-sm sm:text-base"
                  />
                  <span className="absolute right-3 sm:right-4 top-2 sm:top-3.5 text-zinc-500 text-sm pointer-events-none">h</span>
                </div>
              </div>
              <div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={editMinutes}
                    onChange={(e) => setEditMinutes(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all pr-10 sm:pr-14 text-right font-mono text-sm sm:text-base"
                  />
                  <span className="absolute right-3 sm:right-4 top-2 sm:top-3.5 text-zinc-500 text-sm pointer-events-none">min</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveEdit}
                className="bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl py-2 px-4 flex items-center justify-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-900 flex-1"
              >
                <Check size={18} />
                Salvar
              </button>
              <button
                onClick={handleCancelEdit}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium rounded-xl py-2 px-4 flex items-center justify-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-zinc-900 flex-1"
              >
                <X size={18} />
                Cancelar
              </button>
            </div>
          </div>
        ) : timeLeft.isReady ? (
          <div className="flex items-center gap-3 text-blue-400 font-bold py-2 mt-2">
            <div className="relative flex h-8 w-8 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-50"></span>
              <Zap size={24} className="relative inline-flex fill-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.8)] animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]" />
            </div>
            <span className="text-xl tracking-wide drop-shadow-[0_0_8px_rgba(96,165,250,0.4)]">
              IA Recarregada e Pronta!
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-4 text-zinc-100 font-mono text-xl">
            <Clock size={20} className="text-zinc-500" />
            <div className="flex items-baseline gap-1">
              <span>{String(timeLeft.days).padStart(2, '0')}</span>
              <span className="text-xs text-zinc-500 uppercase font-sans tracking-wider">d</span>
            </div>
            <span className="text-zinc-700">:</span>
            <div className="flex items-baseline gap-1">
              <span>{String(timeLeft.hours).padStart(2, '0')}</span>
              <span className="text-xs text-zinc-500 uppercase font-sans tracking-wider">h</span>
            </div>
            <span className="text-zinc-700">:</span>
            <div className="flex items-baseline gap-1">
              <span>{String(timeLeft.minutes).padStart(2, '0')}</span>
              <span className="text-xs text-zinc-500 uppercase font-sans tracking-wider">m</span>
            </div>
            <span className="text-zinc-700">:</span>
            <div className="flex items-baseline gap-1">
              <span>{String(timeLeft.seconds).padStart(2, '0')}</span>
              <span className="text-xs text-zinc-500 uppercase font-sans tracking-wider">s</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Background decoration */}
      {timeLeft.isReady && !isEditing && (
         <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      )}
    </div>
  );
}
