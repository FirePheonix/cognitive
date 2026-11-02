import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SiteHeader, ThemeToggle, GithubMark } from '@/components/site-header';

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: vi.fn(() => ({
    resolvedTheme: 'dark',
    setTheme: vi.fn(),
  })),
}));

// Mock next/link (not available outside Next.js runtime)
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/'),
}));

describe('SiteHeader mobile menu', () => {
  it('opens navigation links from the hamburger button', async () => {
    const user = userEvent.setup();
    render(<SiteHeader />);

    expect(screen.queryByRole('dialog', { name: /site navigation/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /open menu/i }));

    const dialog = screen.getByRole('dialog', { name: /site navigation/i });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveTextContent(/AI Concepts/i);
    expect(dialog).toHaveTextContent(/Books/i);
    expect(screen.getByRole('button', { name: /close menu/i })).toBeInTheDocument();

    // Backdrop must not sit above the panel (that blocked taps).
    const dismiss = screen.getByRole('button', { name: /dismiss menu/i });
    expect(dismiss.className).toMatch(/z-40/);
    expect(dialog.parentElement?.className).toMatch(/z-50/);
  });
});

describe('ThemeToggle', () => {
  it('renders Light and Dark buttons', () => {
    render(<ThemeToggle />);
    expect(screen.getByRole('button', { name: /light/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /dark/i })).toBeInTheDocument();
  });

  it('calls setTheme("light") when Light is clicked', async () => {
    const { useTheme } = await import('next-themes');
    const mockSetTheme = vi.fn();
    vi.mocked(useTheme).mockReturnValue({
      resolvedTheme: 'dark',
      setTheme: mockSetTheme,
    } as unknown as ReturnType<typeof useTheme>);

    const user = userEvent.setup();
    render(<ThemeToggle />);
    await user.click(screen.getByRole('button', { name: /light/i }));
    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });

  it('calls setTheme("dark") when Dark is clicked', async () => {
    const { useTheme } = await import('next-themes');
    const mockSetTheme = vi.fn();
    vi.mocked(useTheme).mockReturnValue({
      resolvedTheme: 'light',
      setTheme: mockSetTheme,
    } as unknown as ReturnType<typeof useTheme>);

    const user = userEvent.setup();
    render(<ThemeToggle />);
    await user.click(screen.getByRole('button', { name: /dark/i }));
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('applies custom className', () => {
    const { container } = render(<ThemeToggle className="my-toggle" />);
    expect(container.firstChild).toHaveClass('my-toggle');
  });
});

describe('GithubMark', () => {
  it('renders an SVG with role="img"', () => {
    render(<GithubMark />);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('applies className to the SVG', () => {
    render(<GithubMark className="size-4" />);
    expect(screen.getByRole('img')).toHaveClass('size-4');
  });
});
