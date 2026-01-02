import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EnhancedSubmissionActions } from './[id]/EnhancedSubmissionActions';

// Mock next/navigation
const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

// Mock window.open
const mockOpen = vi.fn();
global.window.open = mockOpen;

// Mock window.confirm
const mockConfirm = vi.fn(() => true);
global.window.confirm = mockConfirm;

// Mock URL.createObjectURL
const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
const mockRevokeObjectURL = vi.fn();
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

describe('EnhancedSubmissionActions', () => {
  const defaultProps = {
    submissionId: 'sub-123',
    botId: 'bot-123',
    botName: 'Test Bot',
    currentStatus: 'new',
    submissionData: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '1234567890',
    },
    botSchema: {
      schema_version: 'agentic_v1',
      required_info: {
        name: { description: 'Full Name' },
        email: { description: 'Email Address' },
        phone: { description: 'Phone Number' },
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('WhatsApp button', () => {
    it('should call window.open with correct wa.me URL format when phone number exists', async () => {
      const user = userEvent.setup();
      render(<EnhancedSubmissionActions {...defaultProps} />);

      const whatsappButton = screen.getByText('WhatsApp Follow-up');
      await user.click(whatsappButton);

      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('wa.me/1234567890'),
        '_blank'
      );
      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('text='),
        '_blank'
      );
    });

    it('should not render WhatsApp button when no phone number is found', () => {
      const propsWithoutPhone = {
        ...defaultProps,
        submissionData: {
          name: 'John Doe',
          email: 'john@example.com',
          // No phone number
        },
      };

      render(<EnhancedSubmissionActions {...propsWithoutPhone} />);

      // WhatsApp button should not be rendered when there's no phone
      expect(screen.queryByText('WhatsApp Follow-up')).not.toBeInTheDocument();
    });
  });

  describe('Status change', () => {
    it('should call fetch with PATCH when status is changed', async () => {
      const user = userEvent.setup();
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      render(<EnhancedSubmissionActions {...defaultProps} />);

      // Find and click the "Contacted" status button
      const contactedButton = screen.getByText('Contacted');
      await user.click(contactedButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/submissions',
          expect.objectContaining({
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: 'sub-123',
              status: 'contacted',
            }),
          })
        );
      });
    });

    it('should not call fetch when clicking the current status', async () => {
      const user = userEvent.setup();
      render(<EnhancedSubmissionActions {...defaultProps} currentStatus="contacted" />);

      // Click the already active "Contacted" button
      const contactedButton = screen.getByText('Contacted');
      await user.click(contactedButton);

      // Button should be disabled, so fetch shouldn't be called
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Delete action', () => {
    it('should prompt confirmation and call DELETE when confirmed', async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValue(true);
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      render(<EnhancedSubmissionActions {...defaultProps} />);

      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);

      expect(mockConfirm).toHaveBeenCalledWith(
        'Are you sure you want to delete this submission? This cannot be undone.'
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/submissions?id=sub-123',
          expect.objectContaining({
            method: 'DELETE',
          })
        );
      });
    });

    it('should not call DELETE when confirmation is cancelled', async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValue(false);

      render(<EnhancedSubmissionActions {...defaultProps} />);

      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);

      expect(mockConfirm).toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should navigate to bot page after successful delete', async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValue(true);
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      render(<EnhancedSubmissionActions {...defaultProps} />);

      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard/bots/bot-123');
      });
      expect(mockRefresh).toHaveBeenCalled();
    });
  });
});

