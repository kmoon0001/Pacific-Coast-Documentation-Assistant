const BASE_URL = process.env.BACKEND_URL ?? 'http://localhost:4000';
const AUTH_FAILURE_OK = new Set([401, 403]);

const getHealth = async () => {
  const res = await fetch(`${BASE_URL}/api/health`);
  if (!res.ok) throw new Error(`Health endpoint returned ${res.status}`);
};

const probeDocumentList = async () => {
  const res = await fetch(`${BASE_URL}/api/knowledge-base/documents`);
  if (!AUTH_FAILURE_OK.has(res.status) && !res.ok) {
    throw new Error(`Unexpected KB response ${res.status}`);
  }
};

const probeAuditLogs = async () => {
  const res = await fetch(`${BASE_URL}/api/audit-logs`);
  if (!AUTH_FAILURE_OK.has(res.status) && !res.ok) {
    throw new Error(`Unexpected audit response ${res.status}`);
  }
};

const runChaosDrill = async () => {
  console.log(`Running resilience drill against ${BASE_URL}`);
  await getHealth();
  await Promise.all([probeDocumentList(), probeAuditLogs()]);
  console.log('Unauthenticated probes behaved as expected.');
};

runChaosDrill().catch(error => {
  console.error('Resilience drill failed', error);
  process.exit(1);
});
