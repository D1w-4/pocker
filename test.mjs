import dns from 'dns/promises';
import dnsBla from 'dns';
dnsBla.setDefaultResultOrder('verbatim');

const hostname = 'platform-web.query.consul-test';

try {
  const res = await dns.lookup(hostname);
  console.log('✅ Resolved:', res);
} catch (e) {
  console.error('❌ DNS lookup failed:', e);
}
