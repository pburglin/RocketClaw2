import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config/load-config.js';
import { assertToolAccess } from '../src/tools/enforcement.js';
import { assertWhatsAppSendAllowed } from '../src/messaging/enforcement.js';

describe('runtime governance enforcement', () => {
  it('blocks disabled tool access', () => {
    const config = loadConfig({});
    expect(() => assertToolAccess(config, 'database-connectors', 'read')).toThrow();
  });

  it('allows safe whatsapp send path when enabled', () => {
    const config = loadConfig({ messaging: { whatsapp: { enabled: true, mode: 'mock' } } });
    expect(() => assertWhatsAppSendAllowed(config)).not.toThrow();
  });

  it('blocks whatsapp send when disabled', () => {
    const config = loadConfig({ messaging: { whatsapp: { enabled: false, mode: 'mock' } } });
    expect(() => assertWhatsAppSendAllowed(config)).toThrow();
  });
});
