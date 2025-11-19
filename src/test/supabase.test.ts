import { describe, it, expect, vi } from 'vitest';
import { supabase } from '../lib/supabase';

// Mock supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

describe('Supabase Integration', () => {
  it('should have supabase client available', () => {
    expect(supabase).toBeDefined();
    expect(supabase.from).toBeDefined();
    expect(supabase.auth).toBeDefined();
  });

  it('should be able to create database queries', () => {
    const mockTable = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
    };

    (supabase.from as any).mockReturnValue(mockTable);

    const query = supabase.from('test_table');
    expect(query).toBeDefined();
    expect(supabase.from).toHaveBeenCalledWith('test_table');
  });

  it('should handle authentication methods', async () => {
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: { id: 'test', email: 'test@example.com' } },
      error: null,
    });

    (supabase.auth.signOut as any).mockResolvedValue({
      error: null,
    });

    const userResponse = await supabase.auth.getUser();
    expect(userResponse.data.user).toBeDefined();
    expect(userResponse.data.user.email).toBe('test@example.com');

    const signOutResponse = await supabase.auth.signOut();
    expect(signOutResponse.error).toBeNull();
  });
});