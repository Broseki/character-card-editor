import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { MessagesSection } from '../../components/MessagesSection';
import { createEmptyEditorData, type EditorCardData } from '../../utils/types';

// ============== Test Data Fixtures ==============

const sampleEditorData: EditorCardData = {
  ...createEmptyEditorData(),
  first_mes: 'Hello, I am your character!',
  mes_example: '<START>\n{{user}}: Hi!\n{{char}}: Hello there!',
  alternate_greetings: ['Greeting 1', 'Greeting 2'],
  group_only_greetings: ['Group greeting 1'],
};

// ============== MessagesSection Tests ==============

describe('MessagesSection', () => {
  // Happy path - Rendering
  describe('Rendering', () => {
    it('should render section header', () => {
      const onChange = vi.fn();
      render(<MessagesSection data={sampleEditorData} version="v2" onChange={onChange} />);

      expect(screen.getByText('Messages')).toBeInTheDocument();
    });

    it('should render first message field', () => {
      const onChange = vi.fn();
      render(<MessagesSection data={sampleEditorData} version="v2" onChange={onChange} />);

      expect(screen.getByPlaceholderText("The character's opening message...")).toBeInTheDocument();
      expect(screen.getByDisplayValue('Hello, I am your character!')).toBeInTheDocument();
    });

    it('should render example messages field', () => {
      const onChange = vi.fn();
      render(<MessagesSection data={sampleEditorData} version="v2" onChange={onChange} />);

      expect(screen.getByText('Example Messages')).toBeInTheDocument();
    });

    it('should show alternate greetings for V2', () => {
      const onChange = vi.fn();
      render(<MessagesSection data={sampleEditorData} version="v2" onChange={onChange} />);

      expect(screen.getByText('Alternate Greetings')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Greeting 1')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Greeting 2')).toBeInTheDocument();
    });

    it('should hide alternate greetings for V1', () => {
      const onChange = vi.fn();
      render(<MessagesSection data={sampleEditorData} version="v1" onChange={onChange} />);

      expect(screen.queryByText('Alternate Greetings')).not.toBeInTheDocument();
    });

    it('should show group greetings only for V3', () => {
      const onChange = vi.fn();
      const { rerender } = render(<MessagesSection data={sampleEditorData} version="v2" onChange={onChange} />);

      expect(screen.queryByText('Group Chat Greetings')).not.toBeInTheDocument();

      rerender(<MessagesSection data={sampleEditorData} version="v3" onChange={onChange} />);
      expect(screen.getByText('Group Chat Greetings')).toBeInTheDocument();
    });

    it('should show empty state for no alternate greetings', () => {
      const onChange = vi.fn();
      const emptyData = { ...sampleEditorData, alternate_greetings: [] };
      render(<MessagesSection data={emptyData} version="v2" onChange={onChange} />);

      expect(screen.getByText(/No alternate greetings/)).toBeInTheDocument();
    });

    it('should show empty state for no group greetings', () => {
      const onChange = vi.fn();
      const emptyData = { ...sampleEditorData, group_only_greetings: [] };
      render(<MessagesSection data={emptyData} version="v3" onChange={onChange} />);

      expect(screen.getByText(/No group chat greetings/)).toBeInTheDocument();
    });
  });

  // Happy path - Input Handling
  describe('Input Handling', () => {
    it('should call onChange when first message is changed', () => {
      const onChange = vi.fn();
      render(<MessagesSection data={createEmptyEditorData()} version="v2" onChange={onChange} />);

      const input = screen.getByPlaceholderText("The character's opening message...");
      fireEvent.change(input, { target: { value: 'New message' } });

      expect(onChange).toHaveBeenCalledWith({ first_mes: 'New message' });
    });

    it('should call onChange when example messages are changed', () => {
      const onChange = vi.fn();
      render(<MessagesSection data={createEmptyEditorData()} version="v2" onChange={onChange} />);

      const input = screen.getByPlaceholderText(/Example conversation format/);
      fireEvent.change(input, { target: { value: 'New example' } });

      expect(onChange).toHaveBeenCalledWith({ mes_example: 'New example' });
    });

    it('should add alternate greeting when button is clicked', () => {
      const onChange = vi.fn();
      render(<MessagesSection data={createEmptyEditorData()} version="v2" onChange={onChange} />);

      const button = screen.getByText('+ Add Greeting');
      fireEvent.click(button);

      expect(onChange).toHaveBeenCalledWith({ alternate_greetings: [''] });
    });

    it('should update alternate greeting at specific index', () => {
      const onChange = vi.fn();
      render(<MessagesSection data={sampleEditorData} version="v2" onChange={onChange} />);

      const input = screen.getByDisplayValue('Greeting 1');
      fireEvent.change(input, { target: { value: 'Updated Greeting 1' } });

      expect(onChange).toHaveBeenCalledWith({
        alternate_greetings: ['Updated Greeting 1', 'Greeting 2'],
      });
    });

    it('should remove alternate greeting when × is clicked', () => {
      const onChange = vi.fn();
      render(<MessagesSection data={sampleEditorData} version="v2" onChange={onChange} />);

      const removeButtons = screen.getAllByText('×');
      fireEvent.click(removeButtons[0]);

      expect(onChange).toHaveBeenCalledWith({
        alternate_greetings: ['Greeting 2'],
      });
    });

    it('should add group greeting when button is clicked', () => {
      const onChange = vi.fn();
      const emptyGroupData = { ...sampleEditorData, group_only_greetings: [] };
      render(<MessagesSection data={emptyGroupData} version="v3" onChange={onChange} />);

      const button = screen.getByText('+ Add Group Greeting');
      fireEvent.click(button);

      expect(onChange).toHaveBeenCalledWith({ group_only_greetings: [''] });
    });

    it('should update group greeting at specific index', () => {
      const onChange = vi.fn();
      render(<MessagesSection data={sampleEditorData} version="v3" onChange={onChange} />);

      const input = screen.getByDisplayValue('Group greeting 1');
      fireEvent.change(input, { target: { value: 'Updated group greeting' } });

      expect(onChange).toHaveBeenCalledWith({
        group_only_greetings: ['Updated group greeting'],
      });
    });

    it('should remove group greeting when × is clicked', () => {
      const onChange = vi.fn();
      const multiGroupData = {
        ...sampleEditorData,
        group_only_greetings: ['Group 1', 'Group 2'],
      };
      render(<MessagesSection data={multiGroupData} version="v3" onChange={onChange} />);

      // Find the remove buttons for group greetings (after alternate greetings)
      const removeButtons = screen.getAllByText('×');
      // Last two should be group greeting remove buttons
      fireEvent.click(removeButtons[removeButtons.length - 1]);

      expect(onChange).toHaveBeenCalledWith({
        group_only_greetings: ['Group 1'],
      });
    });
  });

  // Malicious path
  describe('Malicious Input Handling', () => {
    it('should handle XSS attempts in first message', () => {
      const onChange = vi.fn();
      render(<MessagesSection data={createEmptyEditorData()} version="v2" onChange={onChange} />);

      const input = screen.getByPlaceholderText("The character's opening message...");
      fireEvent.change(input, { target: { value: '<script>alert("xss")</script>' } });

      expect(onChange).toHaveBeenCalledWith({ first_mes: '<script>alert("xss")</script>' });
    });

    it('should display XSS content safely as text', () => {
      const onChange = vi.fn();
      const xssData: EditorCardData = {
        ...createEmptyEditorData(),
        first_mes: '<script>alert("xss")</script>',
        alternate_greetings: ['<img src=x onerror=alert(1)>'],
      };

      render(<MessagesSection data={xssData} version="v2" onChange={onChange} />);

      expect(screen.getByDisplayValue('<script>alert("xss")</script>')).toBeInTheDocument();
      expect(screen.getByDisplayValue('<img src=x onerror=alert(1)>')).toBeInTheDocument();
    });

    it('should handle extremely long input', () => {
      const onChange = vi.fn();
      render(<MessagesSection data={createEmptyEditorData()} version="v2" onChange={onChange} />);

      const longString = 'A'.repeat(100000);
      const input = screen.getByPlaceholderText("The character's opening message...");
      fireEvent.change(input, { target: { value: longString } });

      expect(onChange).toHaveBeenCalledWith({ first_mes: longString });
    });

    it('should handle unicode edge cases', () => {
      const onChange = vi.fn();
      render(<MessagesSection data={createEmptyEditorData()} version="v2" onChange={onChange} />);

      const unicodeString = '𝕳𝖊𝖑𝖑𝖔 👋 مرحبا 你好 \u202E';
      const input = screen.getByPlaceholderText("The character's opening message...");
      fireEvent.change(input, { target: { value: unicodeString } });

      expect(onChange).toHaveBeenCalledWith({ first_mes: unicodeString });
    });

    it('should handle null bytes in input', () => {
      const onChange = vi.fn();
      render(<MessagesSection data={createEmptyEditorData()} version="v2" onChange={onChange} />);

      const nullByteString = 'Test\x00Message';
      const input = screen.getByPlaceholderText("The character's opening message...");
      fireEvent.change(input, { target: { value: nullByteString } });

      expect(onChange).toHaveBeenCalledWith({ first_mes: nullByteString });
    });
  });

  // Sad path - Edge Cases
  describe('Edge Cases', () => {
    it('should handle empty data', () => {
      const onChange = vi.fn();
      const emptyData = createEmptyEditorData();
      render(<MessagesSection data={emptyData} version="v2" onChange={onChange} />);

      expect(screen.getByPlaceholderText("The character's opening message...")).toHaveValue('');
    });

    it('should handle adding greeting to existing array', () => {
      const onChange = vi.fn();
      render(<MessagesSection data={sampleEditorData} version="v2" onChange={onChange} />);

      const button = screen.getByText('+ Add Greeting');
      fireEvent.click(button);

      expect(onChange).toHaveBeenCalledWith({
        alternate_greetings: ['Greeting 1', 'Greeting 2', ''],
      });
    });

    it('should handle removing last greeting', () => {
      const onChange = vi.fn();
      const singleGreeting = { ...sampleEditorData, alternate_greetings: ['Only one'] };
      render(<MessagesSection data={singleGreeting} version="v2" onChange={onChange} />);

      const removeButton = screen.getByText('×');
      fireEvent.click(removeButton);

      expect(onChange).toHaveBeenCalledWith({ alternate_greetings: [] });
    });

    it('should handle many greetings', () => {
      const onChange = vi.fn();
      const manyGreetings = {
        ...sampleEditorData,
        alternate_greetings: Array.from({ length: 100 }, (_, i) => `Greeting ${i}`),
      };
      render(<MessagesSection data={manyGreetings} version="v2" onChange={onChange} />);

      expect(screen.getByDisplayValue('Greeting 0')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Greeting 99')).toBeInTheDocument();
    });
  });
});
