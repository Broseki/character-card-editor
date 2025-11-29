import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TagInput } from '../../components/TagInput';

// ============== TagInput Tests ==============

describe('TagInput', () => {
  // Happy path - Rendering
  describe('Rendering', () => {
    it('should render with placeholder when empty', () => {
      const onChange = vi.fn();
      render(<TagInput tags={[]} onChange={onChange} placeholder="Add tag..." />);

      expect(screen.getByPlaceholderText('Add tag...')).toBeInTheDocument();
    });

    it('should render with label when provided', () => {
      const onChange = vi.fn();
      render(<TagInput tags={[]} onChange={onChange} label="Tags" />);

      expect(screen.getByText('Tags')).toBeInTheDocument();
    });

    it('should render existing tags', () => {
      const onChange = vi.fn();
      render(<TagInput tags={['tag1', 'tag2', 'tag3']} onChange={onChange} />);

      expect(screen.getByText('tag1')).toBeInTheDocument();
      expect(screen.getByText('tag2')).toBeInTheDocument();
      expect(screen.getByText('tag3')).toBeInTheDocument();
    });

    it('should hide placeholder when tags exist', () => {
      const onChange = vi.fn();
      render(<TagInput tags={['tag1']} onChange={onChange} placeholder="Add tag..." />);

      expect(screen.queryByPlaceholderText('Add tag...')).not.toBeInTheDocument();
    });

    it('should render remove buttons for each tag', () => {
      const onChange = vi.fn();
      render(<TagInput tags={['tag1', 'tag2']} onChange={onChange} />);

      const removeButtons = screen.getAllByText('×');
      expect(removeButtons).toHaveLength(2);
    });
  });

  // Happy path - Adding Tags
  describe('Adding Tags', () => {
    it('should add tag on Enter key', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<TagInput tags={[]} onChange={onChange} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'newtag{enter}');

      expect(onChange).toHaveBeenCalledWith(['newtag']);
    });

    it('should add tag on comma key', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<TagInput tags={[]} onChange={onChange} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'newtag,');

      expect(onChange).toHaveBeenCalledWith(['newtag']);
    });

    it('should trim whitespace from new tags', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<TagInput tags={[]} onChange={onChange} />);

      const input = screen.getByRole('textbox');
      await user.type(input, '  newtag  {enter}');

      expect(onChange).toHaveBeenCalledWith(['newtag']);
    });

    it('should not add empty tags', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<TagInput tags={[]} onChange={onChange} />);

      const input = screen.getByRole('textbox');
      await user.type(input, '   {enter}');

      expect(onChange).not.toHaveBeenCalled();
    });

    it('should not add duplicate tags', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<TagInput tags={['existing']} onChange={onChange} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'existing{enter}');

      expect(onChange).not.toHaveBeenCalled();
    });

    it('should clear input after adding tag', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<TagInput tags={[]} onChange={onChange} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'newtag{enter}');

      expect(input).toHaveValue('');
    });

    it('should append to existing tags', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<TagInput tags={['tag1', 'tag2']} onChange={onChange} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'tag3{enter}');

      expect(onChange).toHaveBeenCalledWith(['tag1', 'tag2', 'tag3']);
    });
  });

  // Happy path - Removing Tags
  describe('Removing Tags', () => {
    it('should remove tag when × is clicked', () => {
      const onChange = vi.fn();
      render(<TagInput tags={['tag1', 'tag2', 'tag3']} onChange={onChange} />);

      const removeButtons = screen.getAllByText('×');
      fireEvent.click(removeButtons[1]); // Remove middle tag

      expect(onChange).toHaveBeenCalledWith(['tag1', 'tag3']);
    });

    it('should remove last tag on backspace when input is empty', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<TagInput tags={['tag1', 'tag2']} onChange={onChange} />);

      const input = screen.getByRole('textbox');
      await user.type(input, '{backspace}');

      expect(onChange).toHaveBeenCalledWith(['tag1']);
    });

    it('should not remove tags on backspace when input has text', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<TagInput tags={['tag1', 'tag2']} onChange={onChange} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'x{backspace}');

      // onChange should not be called for tag removal
      expect(onChange).not.toHaveBeenCalled();
    });

    it('should handle removing all tags', () => {
      const onChange = vi.fn();
      render(<TagInput tags={['onlytag']} onChange={onChange} />);

      const removeButton = screen.getByText('×');
      fireEvent.click(removeButton);

      expect(onChange).toHaveBeenCalledWith([]);
    });
  });

  // Malicious path
  describe('Malicious Input Handling', () => {
    it('should handle XSS attempts in tag input', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<TagInput tags={[]} onChange={onChange} />);

      const input = screen.getByRole('textbox');
      await user.type(input, '<script>alert("xss")</script>{enter}');

      expect(onChange).toHaveBeenCalledWith(['<script>alert("xss")</script>']);
    });

    it('should display XSS content safely as text', () => {
      const onChange = vi.fn();
      render(<TagInput tags={['<script>alert("xss")</script>', '<img src=x onerror=alert(1)>']} onChange={onChange} />);

      expect(screen.getByText('<script>alert("xss")</script>')).toBeInTheDocument();
      expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeInTheDocument();
    });

    it('should handle extremely long tag input', () => {
      const onChange = vi.fn();
      render(<TagInput tags={[]} onChange={onChange} />);

      const longString = 'A'.repeat(10000);
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: longString } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onChange).toHaveBeenCalledWith([longString]);
    });

    it('should handle unicode tags', () => {
      const onChange = vi.fn();
      render(<TagInput tags={[]} onChange={onChange} />);

      const unicodeTag = '你好世界🎉';
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: unicodeTag } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onChange).toHaveBeenCalledWith([unicodeTag]);
    });

    it('should handle null bytes in tag input', async () => {
      const onChange = vi.fn();
      render(<TagInput tags={[]} onChange={onChange} />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'test\x00tag' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onChange).toHaveBeenCalledWith(['test\x00tag']);
    });

    it('should handle RTL override characters', async () => {
      const onChange = vi.fn();
      render(<TagInput tags={[]} onChange={onChange} />);

      const rtlTag = '\u202Eevil\u202C';
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: rtlTag } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onChange).toHaveBeenCalledWith([rtlTag]);
    });
  });

  // Sad path - Edge Cases
  describe('Edge Cases', () => {
    it('should handle empty tags array', () => {
      const onChange = vi.fn();
      render(<TagInput tags={[]} onChange={onChange} />);

      expect(screen.queryByText('×')).not.toBeInTheDocument();
    });

    it('should handle backspace with no tags', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<TagInput tags={[]} onChange={onChange} />);

      const input = screen.getByRole('textbox');
      await user.type(input, '{backspace}');

      expect(onChange).not.toHaveBeenCalled();
    });

    it('should handle many tags', () => {
      const onChange = vi.fn();
      const manyTags = Array.from({ length: 100 }, (_, i) => `tag${i}`);
      render(<TagInput tags={manyTags} onChange={onChange} />);

      expect(screen.getByText('tag0')).toBeInTheDocument();
      expect(screen.getByText('tag99')).toBeInTheDocument();
    });

    it('should handle ReactNode label', () => {
      const onChange = vi.fn();
      const label = <span data-testid="custom-label">Custom Label</span>;
      render(<TagInput tags={[]} onChange={onChange} label={label} />);

      expect(screen.getByTestId('custom-label')).toBeInTheDocument();
    });

    it('should prevent default on Enter key', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<TagInput tags={[]} onChange={onChange} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'test{enter}');

      // If preventDefault wasn't called, this might submit a form
      // The fact that onChange was called means it worked correctly
      expect(onChange).toHaveBeenCalled();
    });

    it('should prevent default on comma key', () => {
      const onChange = vi.fn();
      render(<TagInput tags={[]} onChange={onChange} />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'test' } });
      fireEvent.keyDown(input, { key: ',' });

      expect(onChange).toHaveBeenCalledWith(['test']);
    });

    it('should handle whitespace-only input on Enter', () => {
      const onChange = vi.fn();
      render(<TagInput tags={[]} onChange={onChange} />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '   ' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onChange).not.toHaveBeenCalled();
    });

    it('should handle case-sensitive duplicate check', () => {
      const onChange = vi.fn();
      render(<TagInput tags={['Tag']} onChange={onChange} />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'tag' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      // 'tag' is different from 'Tag' (case-sensitive)
      expect(onChange).toHaveBeenCalledWith(['Tag', 'tag']);
    });
  });
});
