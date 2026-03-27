import { describe, it, expect } from 'vitest';
import { apiSuccess, apiError, ApiErrors } from '../api-error';

describe('API error contract', () => {
  describe('apiSuccess', () => {
    it('returns success shape with data', async () => {
      const response = apiSuccess({ id: '1', name: 'test' });
      const json = await response.json();
      expect(json).toEqual({
        success: true,
        data: { id: '1', name: 'test' },
      });
      expect(response.status).toBe(200);
    });

    it('supports custom status code', async () => {
      const response = apiSuccess({ created: true }, 201);
      expect(response.status).toBe(201);
    });
  });

  describe('apiError', () => {
    it('returns error shape with code and message', async () => {
      const response = apiError('TEST_ERROR', 'Something failed', 400);
      const json = await response.json();
      expect(json).toEqual({
        success: false,
        error: { code: 'TEST_ERROR', message: 'Something failed' },
      });
      expect(response.status).toBe(400);
    });

    it('includes details when provided', async () => {
      const response = apiError('VALIDATION', 'Bad input', 422, { fields: { name: ['required'] } });
      const json = await response.json();
      expect(json.error.details).toEqual({ fields: { name: ['required'] } });
    });
  });

  describe('ApiErrors helpers', () => {
    it('notFound returns 404', async () => {
      const response = ApiErrors.notFound();
      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json.error.code).toBe('NOT_FOUND');
    });

    it('unauthorized returns 401', async () => {
      const response = ApiErrors.unauthorized();
      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.error.code).toBe('UNAUTHORIZED');
    });

    it('forbidden returns 403', async () => {
      const response = ApiErrors.forbidden();
      expect(response.status).toBe(403);
      const json = await response.json();
      expect(json.error.code).toBe('FORBIDDEN');
    });

    it('badRequest returns 400', async () => {
      const response = ApiErrors.badRequest('Invalid input');
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error.code).toBe('BAD_REQUEST');
      expect(json.error.message).toBe('Invalid input');
    });

    it('validationError returns 422', async () => {
      const response = ApiErrors.validationError('Validation failed', { fields: {} });
      expect(response.status).toBe(422);
      const json = await response.json();
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });

    it('conflict returns 409', async () => {
      const response = ApiErrors.conflict('Already exists');
      expect(response.status).toBe(409);
    });

    it('internal returns 500', async () => {
      const response = ApiErrors.internal();
      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.error.code).toBe('INTERNAL_ERROR');
    });
  });
});
