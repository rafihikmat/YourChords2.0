import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useHomeData } from '../useHomeData';
import { supabase } from '../../supabase';

// Mock Supabase
vi.mock('../../supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        })),
        order: vi.fn(() => ({
          limit: vi.fn()
        })),
        limit: vi.fn()
      }))
    }))
  }
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
}));

describe('useHomeData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default states', () => {
    const { result } = renderHook(() => useHomeData());
    
    expect(result.current.songs).toEqual([]);
    expect(result.current.albums).toEqual([]);
    expect(result.current.isLoadingSongs).toBe(true);
    expect(result.current.pageContent).toBeNull();
    expect(result.current.fetchError).toBeNull();
    expect(result.current.isSeeding).toBe(false);
  });

  // Add more tests as needed for success/failure scenarios
});
