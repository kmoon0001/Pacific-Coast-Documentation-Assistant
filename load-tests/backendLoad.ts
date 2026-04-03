const BASE_URL = process.env.BACKEND_URL ?? 'http://localhost:4000';
const USERS = Number(process.env.LOAD_USERS ?? 25);
const REQUESTS_PER_USER = Number(process.env.LOAD_REQUESTS ?? 4);

const registerUser = async (index: number) => {
  const email = `loadtester+${Date.now()}+${index}@example.com`;
  const body = JSON.stringify({ email, password: 'EnterpriseLoad1!' });
  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  if (!res.ok) throw new Error(`Registration failed: ${res.status}`);
  const json = await res.json();
  return { token: json.token as string };
};

const createNote = async (token: string, iteration: number) => {
  const payload = {
    content: `Load test note iteration ${iteration}`,
    type: 'PT Daily',
    discipline: 'PT',
    documentType: 'Daily',
  };
  const res = await fetch(`${BASE_URL}/api/notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Note creation failed: ${res.status}`);
};

const scenario = async (index: number) => {
  const timings: number[] = [];
  const { token } = await registerUser(index);
  for (let i = 0; i < REQUESTS_PER_USER; i++) {
    const t0 = performance.now();
    await createNote(token, i);
    timings.push(performance.now() - t0);
  }
  return timings;
};

const main = async () => {
  console.log(`Running backend load against ${BASE_URL} with ${USERS} users ...`);
  const runs = Array.from({ length: USERS }, (_, i) => scenario(i));
  const results = await Promise.allSettled(runs);
  const successes = results.filter(r => r.status === 'fulfilled') as PromiseFulfilledResult<number[]>[];
  const failures = results.filter(r => r.status === 'rejected') as PromiseRejectedResult[];

  const latencies = successes.flatMap(result => result.value);
  const avgLatency = latencies.reduce((sum, value) => sum + value, 0) / (latencies.length || 1);
  const sorted = [...latencies].sort((a, b) => a - b);
  const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? 0;

  console.table({
    usersScheduled: USERS,
    completed: successes.length,
    failed: failures.length,
    avgLatencyMs: Number(avgLatency.toFixed(2)),
    p95LatencyMs: Number(p95.toFixed(2)),
  });

  if (failures.length) {
    console.error('Failures encountered:', failures.slice(0, 3).map(f => f.reason));
    process.exitCode = 1;
  }
};

main().catch(error => {
  console.error('Load test crashed', error);
  process.exit(1);
});
