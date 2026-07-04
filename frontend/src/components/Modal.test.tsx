import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from './Modal';

describe('Modal', () => {
  it('renders children when open', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()}>
        <div>Modal Content</div>
      </Modal>,
    );

    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()}>
        <div>Modal Content</div>
      </Modal>,
    );

    expect(screen.queryByText('Modal Content')).not.toBeInTheDocument();
  });

  it('calls onClose when overlay is clicked', async () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose}>
        <div>Modal Content</div>
      </Modal>,
    );

    const dialog = screen.getByRole('dialog');
    const overlay = dialog.parentElement as HTMLElement;
    await userEvent.click(overlay);

    expect(onClose).toHaveBeenCalled();
  });
});
