import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ToggleButtonGroup } from './toggle-button-group';

describe('ToggleButtonGroup', () => {
  it('renders all three options', () => {
    const onChange = vi.fn();
    render(<ToggleButtonGroup value="Split" onChange={onChange} />);

    expect(screen.getByRole('button', { name: 'Roland' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Split' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Chris' })).toBeInTheDocument();
  });

  it('highlights the selected option', () => {
    const onChange = vi.fn();
    render(<ToggleButtonGroup value="Split" onChange={onChange} />);

    const splitButton = screen.getByRole('button', { name: 'Split' });
    expect(splitButton).toHaveClass('bg-primary-600');
  });

  it('calls onChange when an option is clicked', () => {
    const onChange = vi.fn();
    render(<ToggleButtonGroup value="Split" onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Roland' }));
    expect(onChange).toHaveBeenCalledWith('Roland');

    fireEvent.click(screen.getByRole('button', { name: 'Chris' }));
    expect(onChange).toHaveBeenCalledWith('Chris');
  });

  it('uses custom options when provided', () => {
    const onChange = vi.fn();
    render(
      <ToggleButtonGroup
        value="Roland"
        onChange={onChange}
        options={['Roland', 'Chris']}
      />
    );

    expect(screen.getByRole('button', { name: 'Roland' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Chris' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Split' })).not.toBeInTheDocument();
  });

  it('has correct role for button group', () => {
    const onChange = vi.fn();
    render(<ToggleButtonGroup value="Split" onChange={onChange} />);

    expect(screen.getByRole('group')).toBeInTheDocument();
  });

  it('is inline by default and does not stretch buttons', () => {
    const onChange = vi.fn();
    render(<ToggleButtonGroup value="Split" onChange={onChange} />);

    const group = screen.getByRole('group');
    expect(group).toHaveClass('inline-flex');
    expect(group).not.toHaveClass('w-full');
    expect(screen.getByRole('button', { name: 'Roland' })).not.toHaveClass('flex-1');
  });

  it('stretches to full width with equal-width segments when fullWidth is set', () => {
    const onChange = vi.fn();
    render(<ToggleButtonGroup value="Split" onChange={onChange} fullWidth />);

    const group = screen.getByRole('group');
    expect(group).toHaveClass('flex');
    expect(group).toHaveClass('w-full');
    expect(group).not.toHaveClass('inline-flex');
    expect(screen.getByRole('button', { name: 'Roland' })).toHaveClass('flex-1');
  });
});
