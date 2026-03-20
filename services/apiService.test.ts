import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  fetchStatus, 
  fetchTableStatus, 
  fetchMenu, 
  loginUser 
} from './apiService';
import { supabase } from '../src/lib/supabase';

// Mock Supabase
vi.mock('../src/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            data: [],
            error: null
          }))
        })),
        data: [],
        error: null
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { id: '123' },
            error: null
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          error: null
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          error: null
        }))
      }))
    })),
    auth: {
      signInWithPassword: vi.fn()
    }
  }
}));

// Mock Global Fetch
global.fetch = vi.fn();

describe('apiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchStatus', () => {
    it('should return live status when API is available', async () => {
      const mockStatus = { people_inside: 25, status: 'MODERATE' };
      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockStatus
      });

      const result = await fetchStatus();
      expect(result).toEqual(mockStatus);
    });

    it('should return fallback data when API is offline', async () => {
      (fetch as any).mockRejectedValue(new Error('Offline'));

      const result = await fetchStatus();
      expect(result).toHaveProperty('people_inside');
      expect(typeof result.people_inside).toBe('number');
    });
  });

  describe('fetchTableStatus', () => {
    it('should return actual table status when sensor API is available', async () => {
      const mockTables = { occupied_tables: 5, empty_tables: 15 };
      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockTables
      });

      const result = await fetchTableStatus(20);
      expect(result).toEqual({ ...mockTables, is_actual: true });
    });

    it('should return estimated status when sensor API is offline', async () => {
      (fetch as any).mockRejectedValue(new Error('Offline'));

      const result = await fetchTableStatus(20);
      expect(result?.is_actual).toBe(false);
      expect(result?.occupied_tables).toBeDefined();
    });
  });

  describe('fetchMenu', () => {
    it('should return menu items from Supabase', async () => {
      const mockMenu = [
        { id: '1', name: 'Item 1', price: 10, category: 'Snacks', image_url: 'url1' }
      ];
      
      const selectMock = vi.fn().mockResolvedValue({ data: mockMenu, error: null });
      (supabase.from as any).mockReturnValue({ select: selectMock });

      const result = await fetchMenu();
      expect(result[0].name).toBe('Item 1');
      expect(result[0].price).toBe(10);
    });

    it('should return initial menu on error', async () => {
      const selectMock = vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } });
      (supabase.from as any).mockReturnValue({ select: selectMock });

      const result = await fetchMenu();
      expect(result.length).toBeGreaterThan(0); // Falls back to INITIAL_MENU
    });
  });

  describe('loginUser', () => {
    it('should authenticate student by email format', async () => {
      const result = await loginUser('test@upl');
      expect(result?.role).toBe('STUDENT');
      expect(result?.name).toBe('Test');
    });

    it('should authenticate admin with correct credentials (hardcoded fallback)', async () => {
        (supabase.auth.signInWithPassword as any).mockResolvedValue({ data: { user: null }, error: { message: 'Invalid' } });
        const result = await loginUser('admin', 'admin123');
        expect(result?.role).toBe('ADMIN');
    });
    
    it('should return null for invalid student email', async () => {
        const result = await loginUser('invalid-email');
        expect(result).toBeNull();
    });
  });
});
