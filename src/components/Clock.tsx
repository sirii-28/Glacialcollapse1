import { useEffect, useState } from 'react';

export default function Clock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const time = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  });

  const date = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    timeZone: 'UTC',
  });

  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col items-end">
        <span className="font-mono text-lg font-medium tracking-wider text-ice-200">
          {time} <span className="text-xs text-slate-500">UTC</span>
        </span>
        <span className="text-xs text-slate-500">{date}</span>
      </div>
    </div>
  );
}
