import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { logger } from './logger';

describe('logger', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  describe('with level info', () => {
    beforeEach(() => {
      process.env.LOG_LEVEL = 'info';
    });

    it('suppresses debug', () => {
      logger.debug('hidden');
      expect(console.debug).not.toHaveBeenCalled();
    });

    it('emits info', () => {
      logger.info('shown');
      expect(console.info).toHaveBeenCalledWith('shown');
    });

    it('emits warn and error', () => {
      logger.warn('w');
      logger.error('e');
      expect(console.warn).toHaveBeenCalledWith('w');
      expect(console.error).toHaveBeenCalledWith('e');
    });
  });

  describe('with level debug', () => {
    beforeEach(() => {
      process.env.LOG_LEVEL = 'debug';
    });

    it('emits debug', () => {
      logger.debug('shown');
      expect(console.debug).toHaveBeenCalledWith('shown');
    });
  });

  describe('level derived from APP_ENV', () => {
    it('homelab derives info (debug suppressed)', () => {
      delete process.env.LOG_LEVEL;
      process.env.APP_ENV = 'homelab';
      logger.debug('hidden');
      logger.info('shown');
      expect(console.debug).not.toHaveBeenCalled();
      expect(console.info).toHaveBeenCalledWith('shown');
    });

    it('non-homelab derives debug', () => {
      delete process.env.LOG_LEVEL;
      process.env.APP_ENV = 'local';
      logger.debug('shown');
      expect(console.debug).toHaveBeenCalledWith('shown');
    });
  });
});
