import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { CharacterBookEditor } from '../../components/CharacterBookEditor';
import { createEmptyBookEntry, type CharacterBook } from '../../utils/types';

// ============== Test Data Fixtures ==============

const sampleBook: CharacterBook = {
  name: 'Test Lorebook',
  description: 'A test lorebook',
  scan_depth: 10,
  token_budget: 500,
  recursive_scanning: true,
  extensions: {},
  entries: [
    {
      ...createEmptyBookEntry(1),
      keys: ['keyword1', 'keyword2'],
      content: 'This is entry content.',
      name: 'Entry 1',
    },
    {
      ...createEmptyBookEntry(2),
      keys: ['keyword3'],
      content: 'Second entry content.',
      name: 'Entry 2',
    },
  ],
};

// ============== CharacterBookEditor Tests ==============

describe('CharacterBookEditor', () => {
  // Happy path - Rendering
  describe('Rendering', () => {
    it('should render nothing for V1', () => {
      const onChange = vi.fn();
      const { container } = render(<CharacterBookEditor book={undefined} version="v1" onChange={onChange} />);

      expect(container.firstChild).toBeNull();
    });

    it('should render for V2', () => {
      const onChange = vi.fn();
      render(<CharacterBookEditor book={undefined} version="v2" onChange={onChange} />);

      expect(screen.getByText('Character Book / Lorebook')).toBeInTheDocument();
    });

    it('should render for V3', () => {
      const onChange = vi.fn();
      render(<CharacterBookEditor book={undefined} version="v3" onChange={onChange} />);

      expect(screen.getByText('Character Book / Lorebook')).toBeInTheDocument();
    });

    it('should show "Add Character Book" button when no book exists', () => {
      const onChange = vi.fn();
      render(<CharacterBookEditor book={undefined} version="v2" onChange={onChange} />);

      expect(screen.getByText('+ Add Character Book')).toBeInTheDocument();
    });

    it('should show entry count when book exists', () => {
      const onChange = vi.fn();
      render(<CharacterBookEditor book={sampleBook} version="v2" onChange={onChange} />);

      expect(screen.getByText('2 entries')).toBeInTheDocument();
    });

    it('should show singular "entry" for single entry', () => {
      const onChange = vi.fn();
      const singleEntryBook = { ...sampleBook, entries: [sampleBook.entries[0]] };
      render(<CharacterBookEditor book={singleEntryBook} version="v2" onChange={onChange} />);

      expect(screen.getByText('1 entry')).toBeInTheDocument();
    });

    it('should show "Remove" button when book exists', () => {
      const onChange = vi.fn();
      render(<CharacterBookEditor book={sampleBook} version="v2" onChange={onChange} />);

      expect(screen.getByText('Remove')).toBeInTheDocument();
    });
  });

  // Happy path - Creating/Removing Book
  describe('Creating and Removing Book', () => {
    it('should create book when "Add Character Book" is clicked', () => {
      const onChange = vi.fn();
      render(<CharacterBookEditor book={undefined} version="v2" onChange={onChange} />);

      fireEvent.click(screen.getByText('+ Add Character Book'));

      expect(onChange).toHaveBeenCalledWith({
        extensions: {},
        entries: [],
      });
    });

    it('should remove book when "Remove" is clicked', () => {
      const onChange = vi.fn();
      render(<CharacterBookEditor book={sampleBook} version="v2" onChange={onChange} />);

      fireEvent.click(screen.getByText('Remove'));

      expect(onChange).toHaveBeenCalledWith(undefined);
    });
  });

  // Happy path - Expanding/Collapsing
  describe('Expanding and Collapsing', () => {
    it('should expand book details when header is clicked', () => {
      const onChange = vi.fn();
      render(<CharacterBookEditor book={sampleBook} version="v2" onChange={onChange} />);

      // Initially collapsed - book fields not visible
      expect(screen.queryByText('Book Name')).not.toBeInTheDocument();

      // Click to expand
      fireEvent.click(screen.getByText('Character Book / Lorebook'));

      expect(screen.getByText('Book Name')).toBeInTheDocument();
    });

    it('should collapse book details when header is clicked again', () => {
      const onChange = vi.fn();
      render(<CharacterBookEditor book={sampleBook} version="v2" onChange={onChange} />);

      // Expand
      fireEvent.click(screen.getByText('Character Book / Lorebook'));
      expect(screen.getByText('Book Name')).toBeInTheDocument();

      // Collapse
      fireEvent.click(screen.getByText('Character Book / Lorebook'));
      expect(screen.queryByText('Book Name')).not.toBeInTheDocument();
    });

    it('should call onChange when Add Character Book is clicked', () => {
      const onChange = vi.fn();
      render(<CharacterBookEditor book={undefined} version="v2" onChange={onChange} />);

      fireEvent.click(screen.getByText('+ Add Character Book'));

      // Verify onChange was called with new book
      expect(onChange).toHaveBeenCalledWith({
        extensions: {},
        entries: [],
      });
    });
  });

  // Happy path - Editing Book Fields
  describe('Editing Book Fields', () => {
    it('should update book name', () => {
      const onChange = vi.fn();
      render(<CharacterBookEditor book={sampleBook} version="v2" onChange={onChange} />);

      // Expand
      fireEvent.click(screen.getByText('Character Book / Lorebook'));

      const nameInput = screen.getByPlaceholderText('Optional name');
      fireEvent.change(nameInput, { target: { value: 'New Book Name' } });

      expect(onChange).toHaveBeenCalledWith({ ...sampleBook, name: 'New Book Name' });
    });

    it('should update book description', () => {
      const onChange = vi.fn();
      render(<CharacterBookEditor book={sampleBook} version="v2" onChange={onChange} />);

      // Expand
      fireEvent.click(screen.getByText('Character Book / Lorebook'));

      const descInput = screen.getByPlaceholderText('Optional description');
      fireEvent.change(descInput, { target: { value: 'New description' } });

      expect(onChange).toHaveBeenCalledWith({ ...sampleBook, description: 'New description' });
    });

    it('should update scan depth', () => {
      const onChange = vi.fn();
      render(<CharacterBookEditor book={sampleBook} version="v2" onChange={onChange} />);

      // Expand
      fireEvent.click(screen.getByText('Character Book / Lorebook'));

      // Find the scan depth input by its label
      const scanDepthLabel = screen.getByText('Scan Depth');
      const scanDepthInput = scanDepthLabel.parentElement?.querySelector('input');
      expect(scanDepthInput).not.toBeNull();
      fireEvent.change(scanDepthInput!, { target: { value: '20' } });

      expect(onChange).toHaveBeenCalledWith({ ...sampleBook, scan_depth: 20 });
    });

    it('should update token budget', () => {
      const onChange = vi.fn();
      render(<CharacterBookEditor book={sampleBook} version="v2" onChange={onChange} />);

      // Expand
      fireEvent.click(screen.getByText('Character Book / Lorebook'));

      // Find the token budget input by its label
      const tokenBudgetLabel = screen.getByText('Token Budget');
      const tokenBudgetInput = tokenBudgetLabel.parentElement?.querySelector('input');
      expect(tokenBudgetInput).not.toBeNull();
      fireEvent.change(tokenBudgetInput!, { target: { value: '1000' } });

      expect(onChange).toHaveBeenCalledWith({ ...sampleBook, token_budget: 1000 });
    });

    it('should toggle recursive scanning', () => {
      const onChange = vi.fn();
      render(<CharacterBookEditor book={sampleBook} version="v2" onChange={onChange} />);

      // Expand
      fireEvent.click(screen.getByText('Character Book / Lorebook'));

      // Find the checkbox by its label text
      const recursiveLabel = screen.getByText('Recursive Scanning');
      const checkbox = recursiveLabel.parentElement?.querySelector('input[type="checkbox"]');
      expect(checkbox).not.toBeNull();
      fireEvent.click(checkbox!);

      expect(onChange).toHaveBeenCalledWith({ ...sampleBook, recursive_scanning: false });
    });
  });

  // Happy path - Managing Entries
  describe('Managing Entries', () => {
    it('should add entry when "+ Add Entry" is clicked', () => {
      const onChange = vi.fn();
      render(<CharacterBookEditor book={sampleBook} version="v2" onChange={onChange} />);

      // Expand
      fireEvent.click(screen.getByText('Character Book / Lorebook'));

      fireEvent.click(screen.getByText('+ Add Entry'));

      expect(onChange).toHaveBeenCalled();
      const call = onChange.mock.calls[0][0];
      expect(call.entries.length).toBe(3);
      expect(call.entries[2].id).toBe(3); // Should be max(existing ids) + 1
    });

    it('should show empty state when no entries', () => {
      const onChange = vi.fn();
      const emptyBook: CharacterBook = { ...sampleBook, entries: [] };
      render(<CharacterBookEditor book={emptyBook} version="v2" onChange={onChange} />);

      // Expand
      fireEvent.click(screen.getByText('Character Book / Lorebook'));

      expect(screen.getByText(/No entries yet/)).toBeInTheDocument();
    });
  });

  // Malicious path
  describe('Malicious Input Handling', () => {
    it('should handle XSS attempts in book name', () => {
      const onChange = vi.fn();
      render(<CharacterBookEditor book={sampleBook} version="v2" onChange={onChange} />);

      // Expand
      fireEvent.click(screen.getByText('Character Book / Lorebook'));

      const nameInput = screen.getByPlaceholderText('Optional name');
      fireEvent.change(nameInput, { target: { value: '<script>alert("xss")</script>' } });

      expect(onChange).toHaveBeenCalledWith({
        ...sampleBook,
        name: '<script>alert("xss")</script>',
      });
    });

    it('should display XSS content safely', () => {
      const onChange = vi.fn();
      const xssBook: CharacterBook = {
        ...sampleBook,
        name: '<script>alert("xss")</script>',
        description: '<img src=x onerror=alert(1)>',
      };

      render(<CharacterBookEditor book={xssBook} version="v2" onChange={onChange} />);

      // Expand
      fireEvent.click(screen.getByText('Character Book / Lorebook'));

      expect(screen.getByDisplayValue('<script>alert("xss")</script>')).toBeInTheDocument();
      expect(screen.getByDisplayValue('<img src=x onerror=alert(1)>')).toBeInTheDocument();
    });

    it('should handle extremely long input', () => {
      const onChange = vi.fn();
      render(<CharacterBookEditor book={sampleBook} version="v2" onChange={onChange} />);

      // Expand
      fireEvent.click(screen.getByText('Character Book / Lorebook'));

      const longString = 'A'.repeat(100000);
      const nameInput = screen.getByPlaceholderText('Optional name');
      fireEvent.change(nameInput, { target: { value: longString } });

      expect(onChange).toHaveBeenCalledWith({ ...sampleBook, name: longString });
    });

    it('should handle unicode in book fields', () => {
      const onChange = vi.fn();
      render(<CharacterBookEditor book={sampleBook} version="v2" onChange={onChange} />);

      // Expand
      fireEvent.click(screen.getByText('Character Book / Lorebook'));

      const unicodeString = '你好世界 🎉 مرحبا';
      const nameInput = screen.getByPlaceholderText('Optional name');
      fireEvent.change(nameInput, { target: { value: unicodeString } });

      expect(onChange).toHaveBeenCalledWith({ ...sampleBook, name: unicodeString });
    });

    it('should handle negative numbers in numeric fields', () => {
      const onChange = vi.fn();
      render(<CharacterBookEditor book={sampleBook} version="v2" onChange={onChange} />);

      // Expand
      fireEvent.click(screen.getByText('Character Book / Lorebook'));

      // Find the scan depth input by its label
      const scanDepthLabel = screen.getByText('Scan Depth');
      const scanDepthInput = scanDepthLabel.parentElement?.querySelector('input');
      expect(scanDepthInput).not.toBeNull();
      fireEvent.change(scanDepthInput!, { target: { value: '-5' } });

      expect(onChange).toHaveBeenCalledWith({ ...sampleBook, scan_depth: -5 });
    });

    it('should handle very large numbers in numeric fields', () => {
      const onChange = vi.fn();
      render(<CharacterBookEditor book={sampleBook} version="v2" onChange={onChange} />);

      // Expand
      fireEvent.click(screen.getByText('Character Book / Lorebook'));

      // Find the token budget input by its label
      const tokenBudgetLabel = screen.getByText('Token Budget');
      const tokenBudgetInput = tokenBudgetLabel.parentElement?.querySelector('input');
      expect(tokenBudgetInput).not.toBeNull();
      fireEvent.change(tokenBudgetInput!, { target: { value: '999999999999' } });

      expect(onChange).toHaveBeenCalledWith({ ...sampleBook, token_budget: 999999999999 });
    });
  });

  // Sad path - Edge Cases
  describe('Edge Cases', () => {
    it('should handle empty book (no entries, no metadata)', () => {
      const onChange = vi.fn();
      const emptyBook: CharacterBook = { extensions: {}, entries: [] };
      render(<CharacterBookEditor book={emptyBook} version="v2" onChange={onChange} />);

      expect(screen.getByText('0 entries')).toBeInTheDocument();
    });

    it('should handle clearing scan depth', () => {
      const onChange = vi.fn();
      render(<CharacterBookEditor book={sampleBook} version="v2" onChange={onChange} />);

      // Expand
      fireEvent.click(screen.getByText('Character Book / Lorebook'));

      // Find the scan depth input by its label
      const scanDepthLabel = screen.getByText('Scan Depth');
      const scanDepthInput = scanDepthLabel.parentElement?.querySelector('input');
      expect(scanDepthInput).not.toBeNull();
      fireEvent.change(scanDepthInput!, { target: { value: '' } });

      expect(onChange).toHaveBeenCalledWith({ ...sampleBook, scan_depth: undefined });
    });

    it('should handle clearing token budget', () => {
      const onChange = vi.fn();
      render(<CharacterBookEditor book={sampleBook} version="v2" onChange={onChange} />);

      // Expand
      fireEvent.click(screen.getByText('Character Book / Lorebook'));

      // Find the token budget input by its label
      const tokenBudgetLabel = screen.getByText('Token Budget');
      const tokenBudgetInput = tokenBudgetLabel.parentElement?.querySelector('input');
      expect(tokenBudgetInput).not.toBeNull();
      fireEvent.change(tokenBudgetInput!, { target: { value: '' } });

      expect(onChange).toHaveBeenCalledWith({ ...sampleBook, token_budget: undefined });
    });

    it('should handle book with undefined optional fields', () => {
      const onChange = vi.fn();
      const minimalBook: CharacterBook = {
        extensions: {},
        entries: [],
      };
      render(<CharacterBookEditor book={minimalBook} version="v2" onChange={onChange} />);

      // Expand
      fireEvent.click(screen.getByText('Character Book / Lorebook'));

      expect(screen.getByPlaceholderText('Optional name')).toHaveValue('');
      expect(screen.getByPlaceholderText('Optional description')).toHaveValue('');
    });

    it('should not expand when clicking header with no book', () => {
      const onChange = vi.fn();
      render(<CharacterBookEditor book={undefined} version="v2" onChange={onChange} />);

      // Click header
      fireEvent.click(screen.getByText('Character Book / Lorebook'));

      // Should not show any book fields since there's no book
      expect(screen.queryByText('Book Name')).not.toBeInTheDocument();
    });

    it('should add entry with correct ID when entries have gaps', () => {
      const onChange = vi.fn();
      const gapBook: CharacterBook = {
        ...sampleBook,
        entries: [
          { ...createEmptyBookEntry(1), id: 5 },
          { ...createEmptyBookEntry(2), id: 10 },
        ],
      };
      render(<CharacterBookEditor book={gapBook} version="v2" onChange={onChange} />);

      // Expand
      fireEvent.click(screen.getByText('Character Book / Lorebook'));

      fireEvent.click(screen.getByText('+ Add Entry'));

      const call = onChange.mock.calls[0][0];
      expect(call.entries[2].id).toBe(11); // Should be max(5, 10) + 1
    });

    it('should handle many entries', () => {
      const onChange = vi.fn();
      const manyEntriesBook: CharacterBook = {
        ...sampleBook,
        entries: Array.from({ length: 100 }, (_, i) => ({
          ...createEmptyBookEntry(i),
          name: `Entry ${i}`,
        })),
      };
      render(<CharacterBookEditor book={manyEntriesBook} version="v2" onChange={onChange} />);

      expect(screen.getByText('100 entries')).toBeInTheDocument();
    });
  });
});
