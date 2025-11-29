import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { SystemSection } from '../../components/SystemSection';
import { createEmptyEditorData, type EditorCardData } from '../../utils/types';

// ============== Test Data Fixtures ==============

const sampleEditorData: EditorCardData = {
  ...createEmptyEditorData(),
  system_prompt: 'You are a helpful assistant.',
  post_history_instructions: 'Always respond in character.',
};

// ============== SystemSection Tests ==============

describe('SystemSection', () => {
  // Happy path - Rendering
  describe('Rendering', () => {
    it('should render nothing for V1', () => {
      const onChange = vi.fn();
      const { container } = render(<SystemSection data={sampleEditorData} version="v1" onChange={onChange} />);

      expect(container.firstChild).toBeNull();
    });

    it('should render for V2', () => {
      const onChange = vi.fn();
      render(<SystemSection data={sampleEditorData} version="v2" onChange={onChange} />);

      expect(screen.getByText('System Settings')).toBeInTheDocument();
    });

    it('should render for V3', () => {
      const onChange = vi.fn();
      render(<SystemSection data={sampleEditorData} version="v3" onChange={onChange} />);

      expect(screen.getByText('System Settings')).toBeInTheDocument();
    });

    it('should render system prompt field', () => {
      const onChange = vi.fn();
      render(<SystemSection data={sampleEditorData} version="v2" onChange={onChange} />);

      expect(screen.getByText('System Prompt')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Custom system prompt for this character...')).toBeInTheDocument();
    });

    it('should render post-history instructions field', () => {
      const onChange = vi.fn();
      render(<SystemSection data={sampleEditorData} version="v2" onChange={onChange} />);

      expect(screen.getByText('Post-History Instructions')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Instructions to insert after chat history...')).toBeInTheDocument();
    });

    it('should display current values', () => {
      const onChange = vi.fn();
      render(<SystemSection data={sampleEditorData} version="v2" onChange={onChange} />);

      expect(screen.getByDisplayValue('You are a helpful assistant.')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Always respond in character.')).toBeInTheDocument();
    });

    it('should show helper text about {{original}}', () => {
      const onChange = vi.fn();
      render(<SystemSection data={sampleEditorData} version="v2" onChange={onChange} />);

      expect(screen.getByText(/Replaces the global system prompt/)).toBeInTheDocument();
      expect(screen.getByText(/Also known as "jailbreak"/)).toBeInTheDocument();
    });
  });

  // Happy path - Input Handling
  describe('Input Handling', () => {
    it('should call onChange when system prompt is changed', () => {
      const onChange = vi.fn();
      render(<SystemSection data={createEmptyEditorData()} version="v2" onChange={onChange} />);

      const input = screen.getByPlaceholderText('Custom system prompt for this character...');
      fireEvent.change(input, { target: { value: 'New system prompt' } });

      expect(onChange).toHaveBeenCalledWith({ system_prompt: 'New system prompt' });
    });

    it('should call onChange when post-history instructions are changed', () => {
      const onChange = vi.fn();
      render(<SystemSection data={createEmptyEditorData()} version="v2" onChange={onChange} />);

      const input = screen.getByPlaceholderText('Instructions to insert after chat history...');
      fireEvent.change(input, { target: { value: 'New instructions' } });

      expect(onChange).toHaveBeenCalledWith({ post_history_instructions: 'New instructions' });
    });
  });

  // Malicious path
  describe('Malicious Input Handling', () => {
    it('should handle XSS attempts in system prompt', () => {
      const onChange = vi.fn();
      render(<SystemSection data={createEmptyEditorData()} version="v2" onChange={onChange} />);

      const input = screen.getByPlaceholderText('Custom system prompt for this character...');
      fireEvent.change(input, { target: { value: '<script>alert("xss")</script>' } });

      expect(onChange).toHaveBeenCalledWith({ system_prompt: '<script>alert("xss")</script>' });
    });

    it('should display XSS content safely as text', () => {
      const onChange = vi.fn();
      const xssData: EditorCardData = {
        ...createEmptyEditorData(),
        system_prompt: '<script>alert("xss")</script>',
        post_history_instructions: '<img src=x onerror=alert(1)>',
      };

      render(<SystemSection data={xssData} version="v2" onChange={onChange} />);

      expect(screen.getByDisplayValue('<script>alert("xss")</script>')).toBeInTheDocument();
      expect(screen.getByDisplayValue('<img src=x onerror=alert(1)>')).toBeInTheDocument();
    });

    it('should handle extremely long input', () => {
      const onChange = vi.fn();
      render(<SystemSection data={createEmptyEditorData()} version="v2" onChange={onChange} />);

      const longString = 'A'.repeat(100000);
      const input = screen.getByPlaceholderText('Custom system prompt for this character...');
      fireEvent.change(input, { target: { value: longString } });

      expect(onChange).toHaveBeenCalledWith({ system_prompt: longString });
    });

    it('should handle unicode edge cases', () => {
      const onChange = vi.fn();
      render(<SystemSection data={createEmptyEditorData()} version="v2" onChange={onChange} />);

      const unicodeString = '𝕳𝖊𝖑𝖑𝖔 👋 مرحبا 你好';
      const input = screen.getByPlaceholderText('Custom system prompt for this character...');
      fireEvent.change(input, { target: { value: unicodeString } });

      expect(onChange).toHaveBeenCalledWith({ system_prompt: unicodeString });
    });

    it('should handle null bytes in input', () => {
      const onChange = vi.fn();
      render(<SystemSection data={createEmptyEditorData()} version="v2" onChange={onChange} />);

      const nullByteString = 'Test\x00Prompt';
      const input = screen.getByPlaceholderText('Custom system prompt for this character...');
      fireEvent.change(input, { target: { value: nullByteString } });

      expect(onChange).toHaveBeenCalledWith({ system_prompt: nullByteString });
    });

    it('should handle template literal injection', () => {
      const onChange = vi.fn();
      render(<SystemSection data={createEmptyEditorData()} version="v2" onChange={onChange} />);

      const templateString = '{{original}} ${malicious}';
      const input = screen.getByPlaceholderText('Custom system prompt for this character...');
      fireEvent.change(input, { target: { value: templateString } });

      expect(onChange).toHaveBeenCalledWith({ system_prompt: templateString });
    });
  });

  // Sad path - Edge Cases
  describe('Edge Cases', () => {
    it('should handle empty data', () => {
      const onChange = vi.fn();
      const emptyData = createEmptyEditorData();
      render(<SystemSection data={emptyData} version="v2" onChange={onChange} />);

      expect(screen.getByPlaceholderText('Custom system prompt for this character...')).toHaveValue('');
      expect(screen.getByPlaceholderText('Instructions to insert after chat history...')).toHaveValue('');
    });

    it('should handle version change from V1 to V2', () => {
      const onChange = vi.fn();
      const { rerender, container } = render(<SystemSection data={sampleEditorData} version="v1" onChange={onChange} />);

      expect(container.firstChild).toBeNull();

      rerender(<SystemSection data={sampleEditorData} version="v2" onChange={onChange} />);
      expect(screen.getByText('System Settings')).toBeInTheDocument();
    });

    it('should handle version change from V2 to V1', () => {
      const onChange = vi.fn();
      const { rerender, container } = render(<SystemSection data={sampleEditorData} version="v2" onChange={onChange} />);

      expect(screen.getByText('System Settings')).toBeInTheDocument();

      rerender(<SystemSection data={sampleEditorData} version="v1" onChange={onChange} />);
      expect(container.firstChild).toBeNull();
    });

    it('should handle whitespace-only input', () => {
      const onChange = vi.fn();
      render(<SystemSection data={createEmptyEditorData()} version="v2" onChange={onChange} />);

      const input = screen.getByPlaceholderText('Custom system prompt for this character...');
      fireEvent.change(input, { target: { value: '   \n\t   ' } });

      expect(onChange).toHaveBeenCalledWith({ system_prompt: '   \n\t   ' });
    });
  });
});
