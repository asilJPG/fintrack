"use client";
import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";

interface Props {
  userId: string;
}

export default function ShortcutDownload({ userId }: Props) {
  const [copied, setCopied] = useState(false);

  const copyId = () => {
    navigator.clipboard.writeText(userId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-500/15 flex items-center justify-center text-2xl">
          📱
        </div>
        <div>
          <h3 className="font-bold text-base">iPhone Shortcut</h3>
          <p className="text-xs text-white/40">
            Добавляйте расходы тройным касанием
          </p>
        </div>
      </div>

      {/* Download button */}
      <a
        href="https://www.icloud.com/shortcuts/c1f0f34d82ed4b88b01a36f562dd5b6e"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 font-semibold text-sm hover:bg-blue-500/30 transition-all mb-4"
      >
        <ExternalLink className="w-4 h-4" />
        Скачать команду для iPhone
      </a>

      {/* Instructions */}
      <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4 mb-4">
        <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
          После скачивания
        </p>
        <ol className="space-y-2 text-sm text-white/60">
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
              1
            </span>
            <span>
              Откройте скачанную команду в приложении «Быстрые команды»
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
              2
            </span>
            <span>
              Найдите шаг 8 с{" "}
              <code className="bg-white/[0.08] px-1.5 py-0.5 rounded text-xs">
                user_id
              </code>{" "}
              в POST запросе
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
              3
            </span>
            <span>Замените значение на ваш ID ниже</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
              4
            </span>
            <span>
              Привяжите к{" "}
              <strong className="text-white">
                Настройки → Универсальный доступ → Касание задней панели →
                Тройное касание
              </strong>
            </span>
          </li>
        </ol>
      </div>

      {/* User ID to copy */}
      <div>
        <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
          Ваш User ID
        </p>
        <div className="flex gap-2">
          <div className="flex-1 bg-[#111118] border border-white/[0.08] rounded-xl px-4 py-3 font-mono text-xs text-white/50 truncate">
            {userId}
          </div>
          <button
            onClick={copyId}
            className="px-4 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] transition-all flex items-center gap-1.5 text-sm font-medium text-white/50 hover:text-white"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            {copied ? "Скопировано" : "Копировать"}
          </button>
        </div>
      </div>
    </div>
  );
}
