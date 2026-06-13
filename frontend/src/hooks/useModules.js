import { useState, useEffect } from 'react';

async function ping(path) {
  try {
    const r = await fetch(path, { signal: AbortSignal.timeout(2000) });
    return r.ok;
  } catch {
    return false;
  }
}

export function useModules() {
  const [modules, setModules] = useState({ ore: false, richieste: false, password: false, loading: true });

  useEffect(() => {
    async function check() {
      const [ore, richieste, password] = await Promise.all([
        ping('/health/ore'),
        ping('/health/richieste'),
        ping('/health/password'),
      ]);
      setModules({ ore, richieste, password, loading: false });
    }

    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  return modules;
}
