import { useState, useEffect } from 'react';
import { DownloadHistoryItem } from '@/types/video';

const STORAGE_KEY = 'video-download-history';
const MAX_HISTORY_ITEMS = 10;

export function useDownloadHistory() {
  const [history, setHistory] = useState<DownloadHistoryItem[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse download history:', e);
      }
    }
  }, []);

  const addToHistory = (item: Omit<DownloadHistoryItem, 'id' | 'downloadedAt'>) => {
    const newItem: DownloadHistoryItem = {
      ...item,
      id: crypto.randomUUID(),
      downloadedAt: new Date().toISOString(),
    };

    setHistory((prev) => {
      const updated = [newItem, ...prev].slice(0, MAX_HISTORY_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return { history, addToHistory, clearHistory };
}
