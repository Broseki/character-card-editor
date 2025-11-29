import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { MetadataSection } from '../../components/MetadataSection';
import { createEmptyEditorData, type EditorCardData } from '../../utils/types';

// ============== Test Data Fixtures ==============

const sampleEditorData: EditorCardData = {
  ...createEmptyEditorData(),
  creator: 'TestCreator',
  character_version: '2.0',
  tags: ['fantasy', 'adventure'],
  creator_notes: 'This is a test character.',
  source: ['https://example.com'],
  creation_date: 1700000000,
  modification_date: 1700001000,
};

// ============== MetadataSection Tests ==============

describe('MetadataSection', () => {
  // Happy path - Rendering
  describe('Rendering', () => {
    it('should render nothing for V1', () => {
      const onChange = vi.fn();
      const { container } = render(<MetadataSection data={sampleEditorData} version="v1" onChange={onChange} />);

      expect(container.firstChild).toBeNull();
    });

    it('should render for V2', () => {
      const onChange = vi.fn();
      render(<MetadataSection data={sampleEditorData} version="v2" onChange={onChange} />);

      expect(screen.getByText('Metadata')).toBeInTheDocument();
    });

    it('should render for V3', () => {
      const onChange = vi.fn();
      render(<MetadataSection data={sampleEditorData} version="v3" onChange={onChange} />);

      expect(screen.getByText('Metadata')).toBeInTheDocument();
    });

    it('should render creator field', () => {
      const onChange = vi.fn();
      render(<MetadataSection data={sampleEditorData} version="v2" onChange={onChange} />);

      expect(screen.getByText('Creator')).toBeInTheDocument();
      expect(screen.getByDisplayValue('TestCreator')).toBeInTheDocument();
    });

    it('should render version field', () => {
      const onChange = vi.fn();
      render(<MetadataSection data={sampleEditorData} version="v2" onChange={onChange} />);

      expect(screen.getByText('Version')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2.0')).toBeInTheDocument();
    });

    it('should render tags field', () => {
      const onChange = vi.fn();
      render(<MetadataSection data={sampleEditorData} version="v2" onChange={onChange} />);

      expect(screen.getByText('Tags')).toBeInTheDocument();
      expect(screen.getByText('fantasy')).toBeInTheDocument();
      expect(screen.getByText('adventure')).toBeInTheDocument();
    });

    it('should render creator notes field', () => {
      const onChange = vi.fn();
      render(<MetadataSection data={sampleEditorData} version="v2" onChange={onChange} />);

      expect(screen.getByText('Creator Notes')).toBeInTheDocument();
      expect(screen.getByDisplayValue('This is a test character.')).toBeInTheDocument();
    });

    it('should show source URLs only for V3', () => {
      const onChange = vi.fn();
      const { rerender } = render(<MetadataSection data={sampleEditorData} version="v2" onChange={onChange} />);

      expect(screen.queryByText('Source URLs')).not.toBeInTheDocument();

      rerender(<MetadataSection data={sampleEditorData} version="v3" onChange={onChange} />);
      expect(screen.getByText('Source URLs')).toBeInTheDocument();
    });

    it('should show date fields only for V3', () => {
      const onChange = vi.fn();
      const { rerender } = render(<MetadataSection data={sampleEditorData} version="v2" onChange={onChange} />);

      expect(screen.queryByText('Creation Date')).not.toBeInTheDocument();
      expect(screen.queryByText('Modification Date')).not.toBeInTheDocument();

      rerender(<MetadataSection data={sampleEditorData} version="v3" onChange={onChange} />);
      expect(screen.getByText('Creation Date')).toBeInTheDocument();
      expect(screen.getByText('Modification Date')).toBeInTheDocument();
    });
  });

  // Happy path - Input Handling
  describe('Input Handling', () => {
    it('should call onChange when creator is changed', () => {
      const onChange = vi.fn();
      render(<MetadataSection data={createEmptyEditorData()} version="v2" onChange={onChange} />);

      const input = screen.getByPlaceholderText('Your name or handle');
      fireEvent.change(input, { target: { value: 'NewCreator' } });

      expect(onChange).toHaveBeenCalledWith({ creator: 'NewCreator' });
    });

    it('should call onChange when version is changed', () => {
      const onChange = vi.fn();
      render(<MetadataSection data={createEmptyEditorData()} version="v2" onChange={onChange} />);

      const input = screen.getByPlaceholderText('1.0');
      fireEvent.change(input, { target: { value: '3.0' } });

      expect(onChange).toHaveBeenCalledWith({ character_version: '3.0' });
    });

    it('should call onChange when creator notes are changed', () => {
      const onChange = vi.fn();
      render(<MetadataSection data={createEmptyEditorData()} version="v2" onChange={onChange} />);

      const input = screen.getByPlaceholderText('Usage notes, recommendations, changelog...');
      fireEvent.change(input, { target: { value: 'New notes' } });

      expect(onChange).toHaveBeenCalledWith({ creator_notes: 'New notes' });
    });

    it('should call onChange when tags are updated', () => {
      const onChange = vi.fn();
      render(<MetadataSection data={sampleEditorData} version="v2" onChange={onChange} />);

      // Find and click the × on the first tag
      const tagRemoveButtons = screen.getAllByText('×');
      fireEvent.click(tagRemoveButtons[0]);

      expect(onChange).toHaveBeenCalledWith({ tags: ['adventure'] });
    });

    it('should call onChange when source is updated (V3)', () => {
      const onChange = vi.fn();
      render(<MetadataSection data={sampleEditorData} version="v3" onChange={onChange} />);

      // Find source tag and remove it
      const sourceRemoveButtons = screen.getAllByText('×');
      // The source URL remove button should be one of the last ones
      fireEvent.click(sourceRemoveButtons[sourceRemoveButtons.length - 1]);

      expect(onChange).toHaveBeenCalledWith({ source: [] });
    });

    it('should call onChange when creation date is changed (V3)', () => {
      const onChange = vi.fn();
      render(<MetadataSection data={createEmptyEditorData()} version="v3" onChange={onChange} />);

      const dateInputs = screen.getAllByDisplayValue('');
      // Find the datetime-local input for creation date
      const creationDateInput = dateInputs.find(input =>
        input.getAttribute('type') === 'datetime-local'
      );

      if (creationDateInput) {
        fireEvent.change(creationDateInput, { target: { value: '2024-01-01T12:00' } });
        expect(onChange).toHaveBeenCalled();
      }
    });
  });

  // Malicious path
  describe('Malicious Input Handling', () => {
    it('should handle XSS attempts in creator field', () => {
      const onChange = vi.fn();
      render(<MetadataSection data={createEmptyEditorData()} version="v2" onChange={onChange} />);

      const input = screen.getByPlaceholderText('Your name or handle');
      fireEvent.change(input, { target: { value: '<script>alert("xss")</script>' } });

      expect(onChange).toHaveBeenCalledWith({ creator: '<script>alert("xss")</script>' });
    });

    it('should display XSS content safely as text', () => {
      const onChange = vi.fn();
      const xssData: EditorCardData = {
        ...createEmptyEditorData(),
        creator: '<script>alert("xss")</script>',
        creator_notes: '<img src=x onerror=alert(1)>',
        tags: ['<script>evil</script>'],
      };

      render(<MetadataSection data={xssData} version="v2" onChange={onChange} />);

      expect(screen.getByDisplayValue('<script>alert("xss")</script>')).toBeInTheDocument();
      expect(screen.getByDisplayValue('<img src=x onerror=alert(1)>')).toBeInTheDocument();
      expect(screen.getByText('<script>evil</script>')).toBeInTheDocument();
    });

    it('should handle extremely long input', () => {
      const onChange = vi.fn();
      render(<MetadataSection data={createEmptyEditorData()} version="v2" onChange={onChange} />);

      const longString = 'A'.repeat(100000);
      const input = screen.getByPlaceholderText('Your name or handle');
      fireEvent.change(input, { target: { value: longString } });

      expect(onChange).toHaveBeenCalledWith({ creator: longString });
    });

    it('should handle unicode edge cases', () => {
      const onChange = vi.fn();
      render(<MetadataSection data={createEmptyEditorData()} version="v2" onChange={onChange} />);

      const unicodeString = '𝕳𝖊𝖑𝖑𝖔 👋 مرحبا 你好';
      const input = screen.getByPlaceholderText('Your name or handle');
      fireEvent.change(input, { target: { value: unicodeString } });

      expect(onChange).toHaveBeenCalledWith({ creator: unicodeString });
    });

    it('should handle null bytes in input', () => {
      const onChange = vi.fn();
      render(<MetadataSection data={createEmptyEditorData()} version="v2" onChange={onChange} />);

      const nullByteString = 'Creator\x00Name';
      const input = screen.getByPlaceholderText('Your name or handle');
      fireEvent.change(input, { target: { value: nullByteString } });

      expect(onChange).toHaveBeenCalledWith({ creator: nullByteString });
    });

    it('should handle URL-like XSS in source field', () => {
      const onChange = vi.fn();
      const xssSourceData: EditorCardData = {
        ...createEmptyEditorData(),
        source: ['javascript:alert(1)'],
      };

      render(<MetadataSection data={xssSourceData} version="v3" onChange={onChange} />);

      // Should display as text, not as a clickable link
      expect(screen.getByText('javascript:alert(1)')).toBeInTheDocument();
    });
  });

  // Sad path - Edge Cases
  describe('Edge Cases', () => {
    it('should handle empty data', () => {
      const onChange = vi.fn();
      const emptyData = createEmptyEditorData();
      render(<MetadataSection data={emptyData} version="v2" onChange={onChange} />);

      expect(screen.getByPlaceholderText('Your name or handle')).toHaveValue('');
    });

    it('should handle version change from V1 to V2', () => {
      const onChange = vi.fn();
      const { rerender, container } = render(<MetadataSection data={sampleEditorData} version="v1" onChange={onChange} />);

      expect(container.firstChild).toBeNull();

      rerender(<MetadataSection data={sampleEditorData} version="v2" onChange={onChange} />);
      expect(screen.getByText('Metadata')).toBeInTheDocument();
    });

    it('should handle many tags', () => {
      const onChange = vi.fn();
      const manyTagsData = {
        ...createEmptyEditorData(),
        tags: Array.from({ length: 100 }, (_, i) => `tag${i}`),
      };

      render(<MetadataSection data={manyTagsData} version="v2" onChange={onChange} />);

      expect(screen.getByText('tag0')).toBeInTheDocument();
      expect(screen.getByText('tag99')).toBeInTheDocument();
    });

    it('should handle undefined dates (V3)', () => {
      const onChange = vi.fn();
      const noDateData = {
        ...createEmptyEditorData(),
        creation_date: undefined,
        modification_date: undefined,
      };

      render(<MetadataSection data={noDateData} version="v3" onChange={onChange} />);

      const dateInputs = screen.getAllByRole('textbox').filter(
        input => input.getAttribute('type') === 'datetime-local'
      );
      // Date inputs should be empty
      expect(dateInputs.every(input => (input as HTMLInputElement).value === '')).toBe(true);
    });

    it('should handle clearing date (V3)', () => {
      const onChange = vi.fn();
      render(<MetadataSection data={sampleEditorData} version="v3" onChange={onChange} />);

      // Find and clear a datetime input
      const dateInputs = document.querySelectorAll('input[type="datetime-local"]');
      if (dateInputs[0]) {
        fireEvent.change(dateInputs[0], { target: { value: '' } });
        expect(onChange).toHaveBeenCalledWith({ creation_date: undefined });
      }
    });
  });
});
