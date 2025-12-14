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
});
