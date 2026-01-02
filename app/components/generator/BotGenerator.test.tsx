import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { BotGenerator } from '../BotGenerator';
import type { User } from '@supabase/supabase-js';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock @supabase/ssr
const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
  })),
};

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(() => mockSupabaseClient),
}));

// Mock the DescriptionStep and BlueprintReview components
// Note: The Generate button in DescriptionStep is not currently disabled when input is empty,
// but onGenerate will be called and validation happens in BotGenerator's handleGenerate
vi.mock('./DescriptionStep', () => ({
  DescriptionStep: ({ onGenerate, loading, businessProfile, loadingProfile }: any) => {
    const [description, setDescription] = React.useState('');
    
    return (
      <div data-testid="description-step">
        <textarea
          data-testid="description-input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter description"
        />
        <button
          data-testid="generate-button"
          onClick={() => onGenerate(description)}
          disabled={loading || loadingProfile || !businessProfile}
        >
          Generate
        </button>
      </div>
    );
  },
}));

vi.mock('./BlueprintReview', () => ({
  BlueprintReview: ({ blueprint, onBack, onFinalize, finalizing }: any) => (
    <div data-testid="blueprint-review">
      <button data-testid="back-button" onClick={onBack}>
        Back
      </button>
      <div data-testid="field-list">
        {Object.keys(blueprint.required_info || {}).map((key) => (
          <div key={key} data-testid={`field-${key}`}>
            {key}
          </div>
        ))}
      </div>
      <button
        data-testid="finalize-button"
        onClick={() => onFinalize('Bot Name', 'Goal', [])}
        disabled={finalizing}
      >
        Finalize
      </button>
    </div>
  ),
}));

vi.mock('./BlueprintReview', () => ({
  BlueprintReview: ({ blueprint, onBack, onFinalize, finalizing }: any) => (
    <div data-testid="blueprint-review">
      <button data-testid="back-button" onClick={onBack}>
        Back
      </button>
      <div data-testid="field-list">
        {Object.keys(blueprint.required_info || {}).map((key) => (
          <div key={key} data-testid={`field-${key}`}>
            {key}
          </div>
        ))}
      </div>
      <button
        data-testid="finalize-button"
        onClick={() => onFinalize('Bot Name', 'Goal', [])}
        disabled={finalizing}
      >
        Finalize
      </button>
    </div>
  ),
}));

describe('BotGenerator', () => {
  const mockUser: User = {
    id: 'test-user-id',
    email: 'test@example.com',
    created_at: new Date().toISOString(),
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    confirmation_sent_at: null,
    recovery_sent_at: null,
    email_confirmed_at: null,
    invited_at: null,
    action_link: null,
    new_email: null,
    phone: null,
    confirmed_at: null,
    email_change_sent_at: null,
    last_sign_in_at: null,
    phone_confirmed_at: null,
    is_anonymous: false,
  };

  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    mockSupabaseClient.from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: { business_name: 'Test Business', business_type: 'Service' },
              error: null,
            })
          ),
        })),
      })),
    }));
  });

  it('should render DescriptionStep initially', async () => {
    render(<BotGenerator user={mockUser} onSuccess={mockOnSuccess} />);

    await waitFor(() => {
      expect(screen.getByTestId('description-step')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should call onGenerate when Generate is clicked with description', async () => {
    const user = userEvent.setup();

    // Mock successful API response
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        botTaskName: 'Test Bot',
        schema: {
          goal: 'Test goal',
          system_prompt: 'Test prompt',
          required_info: {
            name: {
              description: 'Name',
              critical: true,
              example: 'John Doe',
            },
            email: {
              description: 'Email',
              critical: true,
              example: 'test@example.com',
            },
          },
        },
      }),
    });

    render(<BotGenerator user={mockUser} onSuccess={mockOnSuccess} />);

    await waitFor(() => {
      expect(screen.getByTestId('description-step')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Type in the description input
    const descriptionInput = screen.getByTestId('description-input');
    await user.type(descriptionInput, 'Test description');

    const generateButton = screen.getByTestId('generate-button');
    await user.click(generateButton);

    // Wait for API call and state update
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/generate-bot',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    }, { timeout: 3000 });

    // Should switch to blueprint review
    await waitFor(() => {
      expect(screen.getByTestId('blueprint-review')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should render BlueprintReview with field list after generation', async () => {
    const user = userEvent.setup();

    // Mock successful API response with fields
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        botTaskName: 'Test Bot',
        schema: {
          goal: 'Test goal',
          system_prompt: 'Test prompt',
          required_info: {
            name: {
              description: 'Full name',
              critical: true,
              example: 'John Doe',
            },
            email: {
              description: 'Email address',
              critical: true,
              example: 'test@example.com',
            },
            phone: {
              description: 'Phone number',
              critical: false,
              example: '123-456-7890',
            },
          },
        },
      }),
    });

    render(<BotGenerator user={mockUser} onSuccess={mockOnSuccess} />);

    await waitFor(() => {
      expect(screen.getByTestId('description-step')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Type description and click generate
    const descriptionInput = screen.getByTestId('description-input');
    await user.type(descriptionInput, 'Test description');
    const generateButton = screen.getByTestId('generate-button');
    await user.click(generateButton);

    // Wait for blueprint review to appear
    await waitFor(() => {
      expect(screen.getByTestId('blueprint-review')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Check that field list is rendered
    const fieldList = screen.getByTestId('field-list');
    expect(fieldList).toBeInTheDocument();

    // Check that individual fields are rendered
    expect(screen.getByTestId('field-name')).toBeInTheDocument();
    expect(screen.getByTestId('field-email')).toBeInTheDocument();
    expect(screen.getByTestId('field-phone')).toBeInTheDocument();
  });

  it('should handle back navigation from BlueprintReview', async () => {
    const user = userEvent.setup();

    // Mock successful API response
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        botTaskName: 'Test Bot',
        schema: {
          goal: 'Test goal',
          system_prompt: 'Test prompt',
          required_info: {
            name: {
              description: 'Name',
              critical: true,
              example: 'John Doe',
            },
          },
        },
      }),
    });

    render(<BotGenerator user={mockUser} onSuccess={mockOnSuccess} />);

    await waitFor(() => {
      expect(screen.getByTestId('description-step')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Type description and generate to get to blueprint review
    const descriptionInput = screen.getByTestId('description-input');
    await user.type(descriptionInput, 'Test description');
    const generateButton = screen.getByTestId('generate-button');
    await user.click(generateButton);

    await waitFor(() => {
      expect(screen.getByTestId('blueprint-review')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Click back button
    const backButton = screen.getByTestId('back-button');
    await user.click(backButton);

    // Should return to description step
    await waitFor(() => {
      expect(screen.getByTestId('description-step')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});

