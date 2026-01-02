import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsOverview } from './StatsOverview';
import { BotList } from './BotList';
import { ActivityFeed } from './ActivityFeed';

// Mock next/navigation
const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

// Mock window.URL.createObjectURL
const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
const mockRevokeObjectURL = vi.fn();

global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

// Mock document methods
const mockClick = vi.fn();
const mockAppendChild = vi.fn();
const mockRemoveChild = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  // Create actual elements but mock click for anchor tags
  const originalCreateElement = document.createElement.bind(document);
  vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
    const element = originalCreateElement(tagName);
    if (tagName === 'a') {
      element.click = mockClick;
    }
    return element;
  });
  const originalAppendChild = document.body.appendChild.bind(document.body);
  vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
    mockAppendChild(node);
    return originalAppendChild(node);
  });
  const originalRemoveChild = document.body.removeChild.bind(document.body);
  vi.spyOn(document.body, 'removeChild').mockImplementation((node) => {
    mockRemoveChild(node);
    return originalRemoveChild(node);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('StatsOverview', () => {
  it('should correctly sum up totalSubmissions and activeBots', () => {
    const bots = [
      {
        id: '1',
        name: 'Bot 1',
        is_active: true,
        submissions: [{ count: 10 }],
        schema: { required_info: { name: {}, email: {} } },
      },
      {
        id: '2',
        name: 'Bot 2',
        is_active: true,
        submissions: [{ count: 5 }],
        schema: { required_info: { name: {} } },
      },
      {
        id: '3',
        name: 'Bot 3',
        is_active: false,
        submissions: [{ count: 3 }],
        schema: { required_info: {} },
      },
    ];

    render(<StatsOverview bots={bots} />);

    // Check total submissions (10 + 5 + 3 = 18)
    expect(screen.getByText('18')).toBeInTheDocument();
    // Check active bots (2 active bots)
    expect(screen.getByText('2')).toBeInTheDocument();
    // Check total bots (3 bots)
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should return null with empty bot list', () => {
    const { container } = render(<StatsOverview bots={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('should return null with null bots', () => {
    const { container } = render(<StatsOverview bots={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('should handle bots with no submissions', () => {
    const bots = [
      {
        id: '1',
        name: 'Bot 1',
        is_active: true,
        submissions: null, // null instead of empty array
        schema: { required_info: {} },
      },
    ];

    render(<StatsOverview bots={bots} />);
    // Should show 0 for total submissions (the code uses submissions?.[0]?.count which would be undefined)
    const zeroElements = screen.getAllByText('0');
    expect(zeroElements.length).toBeGreaterThan(0);
  });
});

describe('BotList', () => {
  const mockOnCreateBot = vi.fn();

  it('should render the correct number of bot cards', () => {
    const bots = [
      {
        id: '1',
        name: 'Bot 1',
        slug: 'bot-1',
        is_active: true,
        created_at: new Date().toISOString(),
        submissions: [{ count: 5 }],
        schema: { required_info: { name: {}, email: {} } },
      },
      {
        id: '2',
        name: 'Bot 2',
        slug: 'bot-2',
        is_active: false,
        created_at: new Date().toISOString(),
        submissions: [{ count: 3 }],
        schema: { required_info: { name: {} } },
      },
    ];

    render(<BotList bots={bots} onCreateBot={mockOnCreateBot} />);

    expect(screen.getByText('Bot 1')).toBeInTheDocument();
    expect(screen.getByText('Bot 2')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // Submission count for Bot 1
    expect(screen.getByText('3')).toBeInTheDocument(); // Submission count for Bot 2
  });

  it('should render empty state when no bots', () => {
    render(<BotList bots={[]} onCreateBot={mockOnCreateBot} />);

    expect(screen.getByText('No bots yet')).toBeInTheDocument();
    expect(screen.getByText('Create your first AI intake bot to get started')).toBeInTheDocument();
  });

  it('should handle Export CSV button', () => {
    const bots = [
      {
        id: '1',
        name: 'Test Bot',
        slug: 'test-bot',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        submissions: [{ count: 10 }],
        schema: { required_info: { name: {}, email: {} } },
      },
    ];

    render(<BotList bots={bots} onCreateBot={mockOnCreateBot} />);

    const exportButton = screen.getByText('Quick Export (CSV)');
    exportButton.click();

    // Verify URL.createObjectURL was called
    expect(mockCreateObjectURL).toHaveBeenCalled();
    // Verify link was clicked
    expect(mockClick).toHaveBeenCalled();
    // Verify link was removed
    expect(mockRemoveChild).toHaveBeenCalled();
  });

  it('should not export when bots list is empty', () => {
    render(<BotList bots={[]} onCreateBot={mockOnCreateBot} />);

    // Export button should not be present when no bots
    expect(screen.queryByText('Quick Export (CSV)')).not.toBeInTheDocument();
  });
});

describe('ActivityFeed', () => {
  it('should render the recent submissions list', () => {
    const recentSubmissions = [
      {
        id: '1',
        created_at: new Date().toISOString(),
        bots: { name: 'Test Bot 1' },
      },
      {
        id: '2',
        created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        bots: { name: 'Test Bot 2' },
      },
    ];

    render(<ActivityFeed recentSubmissions={recentSubmissions} />);

    // Check that both bot names are present
    expect(screen.getByText('Test Bot 1')).toBeInTheDocument();
    expect(screen.getByText('Test Bot 2')).toBeInTheDocument();
    // Check that "New submission for" text appears (might appear multiple times)
    expect(screen.getAllByText(/New submission for/).length).toBeGreaterThanOrEqual(1);
  });

  it('should render empty state when no submissions', () => {
    render(<ActivityFeed recentSubmissions={[]} />);

    expect(screen.getByText('No recent activity')).toBeInTheDocument();
    expect(screen.getByText('New submissions will appear here')).toBeInTheDocument();
  });

  it('should handle submissions with missing bot name', () => {
    const recentSubmissions = [
      {
        id: '1',
        created_at: new Date().toISOString(),
        bots: null,
      },
    ];

    render(<ActivityFeed recentSubmissions={recentSubmissions} />);

    expect(screen.getByText(/New submission for/)).toBeInTheDocument();
    expect(screen.getByText('Unknown Bot')).toBeInTheDocument();
  });
});

