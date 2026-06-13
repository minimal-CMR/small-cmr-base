import { ref, onMounted, onBeforeUnmount } from 'vue';

async function ping(path) {
  try {
    const r = await fetch(path, { signal: AbortSignal.timeout(2000) });
    return r.ok;
  } catch {
    return false;
  }
}

export function useModules() {
  const ore = ref(false);
  const richieste = ref(false);
  const password = ref(false);
  const loading = ref(true);

  let interval = null;

  const check = async () => {
    const [o, r, p] = await Promise.all([
      ping('/health/ore'),
      ping('/health/richieste'),
      ping('/health/password'),
    ]);
    ore.value = o;
    richieste.value = r;
    password.value = p;
    loading.value = false;
  };

  onMounted(() => {
    check();
    interval = setInterval(check, 10000);
  });

  onBeforeUnmount(() => {
    if (interval) clearInterval(interval);
  });

  return { ore, richieste, password, loading };
}
