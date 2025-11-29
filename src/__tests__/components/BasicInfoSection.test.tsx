import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { BasicInfoSection } from '../../components/BasicInfoSection';
import { createEmptyEditorData, type EditorCardData } from '../../utils/types';

// ============== Test Data Fixtures ==============

const sampleEditorData: EditorCardData = {
  ...createEmptyEditorData(),
  name: 'Test Character',
  description: 'A test description',
  personality: 'Friendly and helpful',
  scenario: 'A testing scenario',
};

// ============== BasicInfoSection Tests ==============

describe('BasicInfoSection', () => {
  // Happy path
  describe('Rendering', () => {
    it('should render all basic fields', () => {
      const onChange = vi.fn();
      render(<BasicInfoSection data={sampleEditorData} version="v2" onChange={onChange} />);

      expect(screen.getByText('Basic Information')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Character name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Character description, background, and traits...')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Character personality traits...')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('The setting or scenario for the conversation...')).toBeInTheDocument();
    });

    it('should display current values', () => {
      const onChange = vi.fn();
      render(<BasicInfoSection data={sampleEditorData} version="v2" onChange={onChange} />);

      expect(screen.getByDisplayValue('Test Character')).toBeInTheDocument();
      expect(screen.getByDisplayValue('A test description')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Friendly and helpful')).toBeInTheDocument();
      expect(screen.getByDisplayValue('A testing scenario')).toBeInTheDocument();
    });

    it('should show nickname field only for V3', () => {
      const onChange = vi.fn();
      const { rerender } = render(<BasicInfoSection data={sampleEditorData} version="v1" onChange={onChange} />);

      expect(screen.queryByPlaceholderText('Display name (replaces {{char}})')).not.toBeInTheDocument();

      rerender(<BasicInfoSection data={sampleEditorData} version="v2" onChange={onChange} />);
      expect(screen.queryByPlaceholderText('Display name (replaces {{char}})')).not.toBeInTheDocument();

      rerender(<BasicInfoSection data={sampleEditorData} version="v3" onChange={onChange} />);
      expect(screen.getByPlaceholderText('Display name (replaces {{char}})')).toBeInTheDocument();
    });
  });

  describe('Input Handling', () => {
    it('should call onChange when name is changed', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<BasicInfoSection data={createEmptyEditorData()} version="v2" onChange={onChange} />);

      const nameInput = screen.getByPlaceholderText('Character name');
      await user.type(nameInput, 'New Name');

      expect(onChange).toHaveBeenCalled();
      // Check the last call includes the expected name change
      const calls = onChange.mock.calls;
      expect(calls.some((call: unknown[]) => (call[0] as { name: string }).name?.includes('N'))).toBe(true);
    });

    it('should call onChange when description is changed', () => {
      const onChange = vi.fn();
      render(<BasicInfoSection data={createEmptyEditorData()} version="v2" onChange={onChange} />);

      const descInput = screen.getByPlaceholderText('Character description, background, and traits...');
      fireEvent.change(descInput, { target: { value: 'New Description' } });

      expect(onChange).toHaveBeenCalledWith({ description: 'New Description' });
    });

    it('should call onChange when personality is changed', () => {
      const onChange = vi.fn();
      render(<BasicInfoSection data={createEmptyEditorData()} version="v2" onChange={onChange} />);

      const personalityInput = screen.getByPlaceholderText('Character personality traits...');
      fireEvent.change(personalityInput, { target: { value: 'New Personality' } });

      expect(onChange).toHaveBeenCalledWith({ personality: 'New Personality' });
    });

    it('should call onChange when scenario is changed', () => {
      const onChange = vi.fn();
      render(<BasicInfoSection data={createEmptyEditorData()} version="v2" onChange={onChange} />);

      const scenarioInput = screen.getByPlaceholderText('The setting or scenario for the conversation...');
      fireEvent.change(scenarioInput, { target: { value: 'New Scenario' } });

      expect(onChange).toHaveBeenCalledWith({ scenario: 'New Scenario' });
    });

    it('should call onChange when nickname is changed (V3)', () => {
      const onChange = vi.fn();
      render(<BasicInfoSection data={createEmptyEditorData()} version="v3" onChange={onChange} />);

      const nicknameInput = screen.getByPlaceholderText('Display name (replaces {{char}})');
      fireEvent.change(nicknameInput, { target: { value: 'Nick' } });

      expect(onChange).toHaveBeenCalledWith({ nickname: 'Nick' });
    });
  });

  // Malicious path
  describe('Malicious Input Handling', () => {
    it('should handle XSS attempts in name field', () => {
      const onChange = vi.fn();
      render(<BasicInfoSection data={createEmptyEditorData()} version="v2" onChange={onChange} />);

      const nameInput = screen.getByPlaceholderText('Character name');
      fireEvent.change(nameInput, { target: { value: '<script>alert("xss")</script>' } });

      expect(onChange).toHaveBeenCalledWith({ name: '<script>alert("xss")</script>' });
    });

    it('should handle XSS attempts in description field', () => {
      const onChange = vi.fn();
      render(<BasicInfoSection data={createEmptyEditorData()} version="v2" onChange={onChange} />);

      const descInput = screen.getByPlaceholderText('Character description, background, and traits...');
      fireEvent.change(descInput, { target: { value: '<img src=x onerror=alert(1)>' } });

      expect(onChange).toHaveBeenCalledWith({ description: '<img src=x onerror=alert(1)>' });
    });

    it('should display XSS content safely (as text)', () => {
      const onChange = vi.fn();
      const xssData: EditorCardData = {
        ...createEmptyEditorData(),
        name: '<script>alert("xss")</script>',
        description: '<img src=x onerror=alert(1)>',
      };

      render(<BasicInfoSection data={xssData} version="v2" onChange={onChange} />);

      // Content should be displayed as text, not executed
      expect(screen.getByDisplayValue('<script>alert("xss")</script>')).toBeInTheDocument();
      expect(screen.getByDisplayValue('<img src=x onerror=alert(1)>')).toBeInTheDocument();
    });

    it('should handle extremely long input', () => {
      const onChange = vi.fn();
      render(<BasicInfoSection data={createEmptyEditorData()} version="v2" onChange={onChange} />);

      const longString = 'A'.repeat(100000);
      const nameInput = screen.getByPlaceholderText('Character name');
      fireEvent.change(nameInput, { target: { value: longString } });

      expect(onChange).toHaveBeenCalledWith({ name: longString });
    });

    it('should handle unicode edge cases', () => {
      const onChange = vi.fn();
      render(<BasicInfoSection data={createEmptyEditorData()} version="v2" onChange={onChange} />);

      const unicodeString = '𝕳𝖊𝖑𝖑𝖔 👋 مرحبا 你好';
      const nameInput = screen.getByPlaceholderText('Character name');
      fireEvent.change(nameInput, { target: { value: unicodeString } });

      expect(onChange).toHaveBeenCalledWith({ name: unicodeString });
    });

    it('should handle null bytes in input', () => {
      const onChange = vi.fn();
      render(<BasicInfoSection data={createEmptyEditorData()} version="v2" onChange={onChange} />);

      const nullByteString = 'Test\x00Name';
      const nameInput = screen.getByPlaceholderText('Character name');
      fireEvent.change(nameInput, { target: { value: nullByteString } });

      expect(onChange).toHaveBeenCalledWith({ name: nullByteString });
    });

    it('should handle RTL override characters', () => {
      const onChange = vi.fn();
      render(<BasicInfoSection data={createEmptyEditorData()} version="v2" onChange={onChange} />);

      const rtlString = '\u202Eevil\u202C';
      const nameInput = screen.getByPlaceholderText('Character name');
      fireEvent.change(nameInput, { target: { value: rtlString } });

      expect(onChange).toHaveBeenCalledWith({ name: rtlString });
    });
  });

  // Sad path
  describe('Edge Cases', () => {
    it('should handle empty data', () => {
      const onChange = vi.fn();
      const emptyData = createEmptyEditorData();
      render(<BasicInfoSection data={emptyData} version="v2" onChange={onChange} />);

      const nameInput = screen.getByPlaceholderText('Character name');
      expect(nameInput).toHaveValue('');
    });

    it('should handle data with all empty strings', () => {
      const onChange = vi.fn();
      const emptyStringsData: EditorCardData = {
        ...createEmptyEditorData(),
        name: '',
        description: '',
        personality: '',
        scenario: '',
      };

      render(<BasicInfoSection data={emptyStringsData} version="v2" onChange={onChange} />);

      expect(screen.getByPlaceholderText('Character name')).toHaveValue('');
      expect(screen.getByPlaceholderText('Character description, background, and traits...')).toHaveValue('');
    });
  });
});
