import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BotSettings } from './BotSettings';

// Mock next/navigation
const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

// Mock supabase client
const createMockFrom = () => {
  const mockSelect = vi.fn(() => ({
    eq: vi.fn(() => ({
      single: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  }));
  
  const mockFrom = vi.fn(() => ({
    select: mockSelect,
    upsert: vi.fn(() => Promise.resolve({ error: null })),
  }));

  return { mockFrom, mockSelect };
};

let { mockFrom, mockSelect } = createMockFrom();

const mockSupabaseClient = {
  from: mockFrom,
  auth: {
    getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'user-123' } }, error: null })),
  },
};

vi.mock('@/lib/supabase', () => ({
  createSupabaseClient: vi.fn(() => mockSupabaseClient),
}));

// Mock window.confirm
const mockConfirm = vi.fn(() => true);
global.window.confirm = mockConfirm;

// Mock alert
const mockAlert = vi.fn();
global.window.alert = mockAlert;

describe('BotSettings', () => {
  const mockBot = {
    id: 'bot-123',
    name: 'Test Bot',
    notification_email: 'test@example.com',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    // Reset supabase mocks
    const { mockFrom: newMockFrom, mockSelect: newMockSelect } = createMockFrom();
    mockSupabaseClient.from = newMockFrom;
    mockSelect = newMockSelect;
  });

  describe('General Settings', () => {
    it('should call PUT /api/bots when name is changed and Save is clicked', async () => {
      const user = userEvent.setup();
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      render(<BotSettings bot={mockBot} />);

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Bot')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Change the name
      const nameInput = screen.getByDisplayValue('Test Bot');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Bot Name');

      // Click Save button
      const saveButton = screen.getByText('Save Changes');
      await user.click(saveButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/bots',
          expect.objectContaining({
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: 'bot-123',
              name: 'Updated Bot Name',
              notification_email: 'test@example.com',
            }),
          })
        );
      });
    });

    it('should call PUT /api/bots when notification email is changed', async () => {
      const user = userEvent.setup();
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      render(<BotSettings bot={mockBot} />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Change the email
      const emailInput = screen.getByDisplayValue('test@example.com');
      await user.clear(emailInput);
      await user.type(emailInput, 'new@example.com');

      // Click Save button
      const saveButton = screen.getByText('Save Changes');
      await user.click(saveButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/bots',
          expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify({
              id: 'bot-123',
              name: 'Test Bot',
              notification_email: 'new@example.com',
            }),
          })
        );
      });
    });

    it('should disable Save button when no changes are made', async () => {
      render(<BotSettings bot={mockBot} />);

      await waitFor(() => {
        const saveButton = screen.getByText('Save Changes');
        expect(saveButton).toBeDisabled();
      }, { timeout: 3000 });
    });
  });

  describe('Integrations', () => {
    it('should call supabase.from("integrations").upsert when webhook URL is entered and Save Integration is clicked', async () => {
      const user = userEvent.setup();
      const mockUpsert = vi.fn(() => Promise.resolve({ error: null }));

      mockSupabaseClient.from = vi.fn((table: string) => {
        if (table === 'integrations') {
          return {
            select: mockSelect,
            upsert: mockUpsert,
          };
        }
        return {
          select: mockSelect,
          upsert: vi.fn(() => Promise.resolve({ error: null })),
        };
      });

      render(<BotSettings bot={mockBot} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/hooks.zapier.com/)).toBeInTheDocument();
      }, { timeout: 3000 });

      // Enter webhook URL
      const webhookInput = screen.getByPlaceholderText(/hooks.zapier.com/);
      await user.type(webhookInput, 'https://hooks.zapier.com/hooks/catch/123');

      // Click Save Integration button
      const saveIntegrationButton = screen.getByText('Save Integration');
      await user.click(saveIntegrationButton);

      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('integrations');
        expect(mockUpsert).toHaveBeenCalledWith(
          {
            bot_id: 'bot-123',
            webhook_url: 'https://hooks.zapier.com/hooks/catch/123',
            is_active: true,
          },
          {
            onConflict: 'bot_id',
          }
        );
      });
    });

    it('should handle empty webhook URL (set to null)', async () => {
      const user = userEvent.setup();
      const mockUpsert = vi.fn(() => Promise.resolve({ error: null }));
      const mockSelectForFetch = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { webhook_url: 'https://existing.com' }, error: null })),
        })),
      }));

      mockSupabaseClient.from = vi.fn((table: string) => {
        if (table === 'integrations') {
          return {
            select: mockSelectForFetch,
            upsert: mockUpsert,
          };
        }
        return {
          select: mockSelectForFetch,
          upsert: vi.fn(() => Promise.resolve({ error: null })),
        };
      });

      render(<BotSettings bot={mockBot} />);

      await waitFor(() => {
        expect(screen.getByText('Save Integration')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Clear webhook URL (if it exists)
      const webhookInput = screen.getByPlaceholderText(/hooks.zapier.com/) as HTMLInputElement;
      if (webhookInput.value) {
        await user.clear(webhookInput);
      }

      // Click Save Integration button
      const saveIntegrationButton = screen.getByText('Save Integration');
      await user.click(saveIntegrationButton);

      await waitFor(() => {
        expect(mockUpsert).toHaveBeenCalledWith(
          expect.objectContaining({
            bot_id: 'bot-123',
            webhook_url: null,
            is_active: true,
          }),
          {
            onConflict: 'bot_id',
          }
        );
      });
    });
  });

  describe('Danger Zone', () => {
    it('should require confirmation before deleting bot', async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValue(false); // User cancels
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      render(<BotSettings bot={mockBot} />);

      await waitFor(() => {
        expect(screen.getByText(/Delete Bot/i)).toBeInTheDocument();
      }, { timeout: 3000 });

      // Find and click delete button (might be in a danger zone section)
      const deleteButton = screen.getByText(/Delete Bot|Delete/i);
      await user.click(deleteButton);

      expect(mockConfirm).toHaveBeenCalledWith(
        'Are you sure you want to delete this bot? This cannot be undone.'
      );

      // Should not call fetch if cancelled
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should call DELETE /api/bots when deletion is confirmed', async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValue(true); // User confirms
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      render(<BotSettings bot={mockBot} />);

      await waitFor(() => {
        expect(screen.getByText(/Delete Bot|Delete/i)).toBeInTheDocument();
      }, { timeout: 3000 });

      const deleteButton = screen.getByText(/Delete Bot|Delete/i);
      await user.click(deleteButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/bots?id=bot-123',
          expect.objectContaining({
            method: 'DELETE',
          })
        );
      });
    });

    it('should navigate to dashboard after successful deletion', async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValue(true);
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      render(<BotSettings bot={mockBot} />);

      await waitFor(() => {
        expect(screen.getByText(/Delete Bot|Delete/i)).toBeInTheDocument();
      }, { timeout: 3000 });

      const deleteButton = screen.getByText(/Delete Bot|Delete/i);
      await user.click(deleteButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
      expect(mockRefresh).toHaveBeenCalled();
    });
  });
});

