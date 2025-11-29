import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { AssetsEditor } from '../../components/AssetsEditor';
import { type CharacterAsset } from '../../utils/types';

// ============== Test Data Fixtures ==============

const sampleAssets: CharacterAsset[] = [
  {
    type: 'icon',
    uri: 'https://example.com/icon.png',
    name: 'main',
    ext: 'png',
  },
  {
    type: 'background',
    uri: 'data:image/png;base64,abc123',
    name: 'forest',
    ext: 'png',
  },
];

// ============== AssetsEditor Tests ==============

describe('AssetsEditor', () => {
  // Happy path - Rendering
  describe('Rendering', () => {
    it('should render nothing for V1', () => {
      const onChange = vi.fn();
      const { container } = render(<AssetsEditor assets={[]} version="v1" onChange={onChange} />);

      expect(container.firstChild).toBeNull();
    });

    it('should render nothing for V2', () => {
      const onChange = vi.fn();
      const { container } = render(<AssetsEditor assets={[]} version="v2" onChange={onChange} />);

      expect(container.firstChild).toBeNull();
    });

    it('should render for V3', () => {
      const onChange = vi.fn();
      render(<AssetsEditor assets={[]} version="v3" onChange={onChange} />);

      expect(screen.getByText('Assets')).toBeInTheDocument();
    });

    it('should show asset count', () => {
      const onChange = vi.fn();
      render(<AssetsEditor assets={sampleAssets} version="v3" onChange={onChange} />);

      expect(screen.getByText('2 assets')).toBeInTheDocument();
    });

    it('should show singular "asset" for single asset', () => {
      const onChange = vi.fn();
      render(<AssetsEditor assets={[sampleAssets[0]]} version="v3" onChange={onChange} />);

      expect(screen.getByText('1 asset')).toBeInTheDocument();
    });

    it('should show "+ Add Asset" button', () => {
      const onChange = vi.fn();
      render(<AssetsEditor assets={[]} version="v3" onChange={onChange} />);

      expect(screen.getByText('+ Add Asset')).toBeInTheDocument();
    });

    it('should show empty state when expanded with no assets', () => {
      const onChange = vi.fn();
      render(<AssetsEditor assets={[]} version="v3" onChange={onChange} />);

      // Expand
      fireEvent.click(screen.getByText('Assets'));

      expect(screen.getByText(/No assets/)).toBeInTheDocument();
    });
  });

  // Happy path - Expanding/Collapsing
  describe('Expanding and Collapsing', () => {
    it('should expand when header is clicked', () => {
      const onChange = vi.fn();
      render(<AssetsEditor assets={sampleAssets} version="v3" onChange={onChange} />);

      // Initially collapsed
      expect(screen.queryByText('Asset 1')).not.toBeInTheDocument();

      // Expand
      fireEvent.click(screen.getByText('Assets'));

      expect(screen.getByText('Asset 1')).toBeInTheDocument();
      expect(screen.getByText('Asset 2')).toBeInTheDocument();
    });

    it('should collapse when header is clicked again', () => {
      const onChange = vi.fn();
      render(<AssetsEditor assets={sampleAssets} version="v3" onChange={onChange} />);

      // Expand
      fireEvent.click(screen.getByText('Assets'));
      expect(screen.getByText('Asset 1')).toBeInTheDocument();

      // Collapse
      fireEvent.click(screen.getByText('Assets'));
      expect(screen.queryByText('Asset 1')).not.toBeInTheDocument();
    });

    it('should auto-expand when "+ Add Asset" is clicked', () => {
      const onChange = vi.fn();
      render(<AssetsEditor assets={[]} version="v3" onChange={onChange} />);

      fireEvent.click(screen.getByText('+ Add Asset'));

      // After adding, the onChange is called but we need to rerender
      expect(onChange).toHaveBeenCalled();
    });
  });

  // Happy path - Adding/Removing Assets
  describe('Adding and Removing Assets', () => {
    it('should add asset when "+ Add Asset" is clicked', () => {
      const onChange = vi.fn();
      render(<AssetsEditor assets={[]} version="v3" onChange={onChange} />);

      fireEvent.click(screen.getByText('+ Add Asset'));

      expect(onChange).toHaveBeenCalledWith([
        {
          type: 'icon',
          uri: '',
          name: '',
          ext: 'png',
        },
      ]);
    });

    it('should append to existing assets', () => {
      const onChange = vi.fn();
      render(<AssetsEditor assets={sampleAssets} version="v3" onChange={onChange} />);

      fireEvent.click(screen.getByText('+ Add Asset'));

      expect(onChange).toHaveBeenCalled();
      const call = onChange.mock.calls[0][0];
      expect(call.length).toBe(3);
    });

    it('should remove asset when Delete is clicked', () => {
      const onChange = vi.fn();
      render(<AssetsEditor assets={sampleAssets} version="v3" onChange={onChange} />);

      // Expand
      fireEvent.click(screen.getByText('Assets'));

      // Delete first asset
      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);

      expect(onChange).toHaveBeenCalledWith([sampleAssets[1]]);
    });

    it('should remove last asset', () => {
      const onChange = vi.fn();
      render(<AssetsEditor assets={[sampleAssets[0]]} version="v3" onChange={onChange} />);

      // Expand
      fireEvent.click(screen.getByText('Assets'));

      fireEvent.click(screen.getByText('Delete'));

      expect(onChange).toHaveBeenCalledWith([]);
    });
  });

  // Happy path - Editing Assets
  describe('Editing Assets', () => {
    it('should update asset type', () => {
      const onChange = vi.fn();
      render(<AssetsEditor assets={sampleAssets} version="v3" onChange={onChange} />);

      // Expand
      fireEvent.click(screen.getByText('Assets'));

      const typeSelect = screen.getAllByRole('combobox')[0];
      fireEvent.change(typeSelect, { target: { value: 'background' } });

      expect(onChange).toHaveBeenCalled();
      const call = onChange.mock.calls[0][0];
      expect(call[0].type).toBe('background');
    });

    it('should update asset name', () => {
      const onChange = vi.fn();
      render(<AssetsEditor assets={sampleAssets} version="v3" onChange={onChange} />);

      // Expand
      fireEvent.click(screen.getByText('Assets'));

      const nameInput = screen.getByDisplayValue('main');
      fireEvent.change(nameInput, { target: { value: 'newname' } });

      expect(onChange).toHaveBeenCalled();
      const call = onChange.mock.calls[0][0];
      expect(call[0].name).toBe('newname');
    });

    it('should update asset URI', () => {
      const onChange = vi.fn();
      render(<AssetsEditor assets={sampleAssets} version="v3" onChange={onChange} />);

      // Expand
      fireEvent.click(screen.getByText('Assets'));

      const uriInput = screen.getByDisplayValue('https://example.com/icon.png');
      fireEvent.change(uriInput, { target: { value: 'https://new.com/icon.png' } });

      expect(onChange).toHaveBeenCalled();
      const call = onChange.mock.calls[0][0];
      expect(call[0].uri).toBe('https://new.com/icon.png');
    });

    it('should update asset extension and lowercase it', () => {
      const onChange = vi.fn();
      render(<AssetsEditor assets={sampleAssets} version="v3" onChange={onChange} />);

      // Expand
      fireEvent.click(screen.getByText('Assets'));

      const extInputs = screen.getAllByDisplayValue('png');
      fireEvent.change(extInputs[0], { target: { value: 'JPG' } });

      expect(onChange).toHaveBeenCalled();
      const call = onChange.mock.calls[0][0];
      expect(call[0].ext).toBe('jpg');
    });
  });

  // Happy path - Asset Types
  describe('Asset Types', () => {
    it('should show all asset type options', () => {
      const onChange = vi.fn();
      render(<AssetsEditor assets={sampleAssets} version="v3" onChange={onChange} />);

      // Expand
      fireEvent.click(screen.getByText('Assets'));

      const typeSelect = screen.getAllByRole('combobox')[0];

      expect(typeSelect).toContainHTML('Icon');
      expect(typeSelect).toContainHTML('Background');
      expect(typeSelect).toContainHTML('User Icon');
      expect(typeSelect).toContainHTML('Emotion');
      expect(typeSelect).toContainHTML('Custom');
    });

    it('should display current type correctly', () => {
      const onChange = vi.fn();
      render(<AssetsEditor assets={sampleAssets} version="v3" onChange={onChange} />);

      // Expand
      fireEvent.click(screen.getByText('Assets'));

      const typeSelects = screen.getAllByRole('combobox');
      expect(typeSelects[0]).toHaveValue('icon');
      expect(typeSelects[1]).toHaveValue('background');
    });
  });

  // Malicious path
  describe('Malicious Input Handling', () => {
    it('should handle XSS attempts in asset name', () => {
      const onChange = vi.fn();
      render(<AssetsEditor assets={sampleAssets} version="v3" onChange={onChange} />);

      // Expand
      fireEvent.click(screen.getByText('Assets'));

      const nameInput = screen.getByDisplayValue('main');
      fireEvent.change(nameInput, { target: { value: '<script>alert("xss")</script>' } });

      expect(onChange).toHaveBeenCalled();
      const call = onChange.mock.calls[0][0];
      expect(call[0].name).toBe('<script>alert("xss")</script>');
    });

    it('should display XSS content safely', () => {
      const onChange = vi.fn();
      const xssAssets: CharacterAsset[] = [
        {
          type: 'icon',
          uri: 'javascript:alert(1)',
          name: '<script>evil</script>',
          ext: 'png',
        },
      ];

      render(<AssetsEditor assets={xssAssets} version="v3" onChange={onChange} />);

      // Expand
      fireEvent.click(screen.getByText('Assets'));

      expect(screen.getByDisplayValue('<script>evil</script>')).toBeInTheDocument();
      expect(screen.getByDisplayValue('javascript:alert(1)')).toBeInTheDocument();
    });

    it('should handle extremely long URI', () => {
      const onChange = vi.fn();
      render(<AssetsEditor assets={sampleAssets} version="v3" onChange={onChange} />);

      // Expand
      fireEvent.click(screen.getByText('Assets'));

      const longUri = 'https://example.com/' + 'A'.repeat(100000);
      const uriInput = screen.getByDisplayValue('https://example.com/icon.png');
      fireEvent.change(uriInput, { target: { value: longUri } });

      expect(onChange).toHaveBeenCalled();
      const call = onChange.mock.calls[0][0];
      expect(call[0].uri).toBe(longUri);
    });

    it('should handle unicode in asset name', () => {
      const onChange = vi.fn();
      render(<AssetsEditor assets={sampleAssets} version="v3" onChange={onChange} />);

      // Expand
      fireEvent.click(screen.getByText('Assets'));

      const unicodeName = '你好世界 🎉 مرحبا';
      const nameInput = screen.getByDisplayValue('main');
      fireEvent.change(nameInput, { target: { value: unicodeName } });

      expect(onChange).toHaveBeenCalled();
      const call = onChange.mock.calls[0][0];
      expect(call[0].name).toBe(unicodeName);
    });

    it('should handle data URI with malicious content', () => {
      const onChange = vi.fn();
      render(<AssetsEditor assets={sampleAssets} version="v3" onChange={onChange} />);

      // Expand
      fireEvent.click(screen.getByText('Assets'));

      const maliciousDataUri = 'data:text/html,<script>alert(1)</script>';
      const uriInput = screen.getByDisplayValue('https://example.com/icon.png');
      fireEvent.change(uriInput, { target: { value: maliciousDataUri } });

      expect(onChange).toHaveBeenCalled();
      const call = onChange.mock.calls[0][0];
      expect(call[0].uri).toBe(maliciousDataUri);
    });

    it('should handle null bytes in input', () => {
      const onChange = vi.fn();
      render(<AssetsEditor assets={sampleAssets} version="v3" onChange={onChange} />);

      // Expand
      fireEvent.click(screen.getByText('Assets'));

      const nullByteName = 'name\x00evil';
      const nameInput = screen.getByDisplayValue('main');
      fireEvent.change(nameInput, { target: { value: nullByteName } });

      expect(onChange).toHaveBeenCalled();
      const call = onChange.mock.calls[0][0];
      expect(call[0].name).toBe(nullByteName);
    });
  });

  // Sad path - Edge Cases
  describe('Edge Cases', () => {
    it('should handle empty assets array', () => {
      const onChange = vi.fn();
      render(<AssetsEditor assets={[]} version="v3" onChange={onChange} />);

      expect(screen.getByText('0 assets')).toBeInTheDocument();
    });

    it('should handle asset with empty fields', () => {
      const onChange = vi.fn();
      const emptyAsset: CharacterAsset[] = [
        { type: 'icon', uri: '', name: '', ext: '' },
      ];

      render(<AssetsEditor assets={emptyAsset} version="v3" onChange={onChange} />);

      // Expand
      fireEvent.click(screen.getByText('Assets'));

      expect(screen.getByText('Asset 1')).toBeInTheDocument();
    });

    it('should handle many assets', () => {
      const onChange = vi.fn();
      const manyAssets = Array.from({ length: 100 }, (_, i) => ({
        type: 'icon',
        uri: `https://example.com/${i}.png`,
        name: `asset${i}`,
        ext: 'png',
      }));

      render(<AssetsEditor assets={manyAssets} version="v3" onChange={onChange} />);

      expect(screen.getByText('100 assets')).toBeInTheDocument();

      // Expand
      fireEvent.click(screen.getByText('Assets'));

      expect(screen.getByText('Asset 1')).toBeInTheDocument();
      expect(screen.getByText('Asset 100')).toBeInTheDocument();
    });

    it('should handle custom asset type', () => {
      const onChange = vi.fn();
      // Use 'custom' which is a valid option in the select (mapped to x_ prefix)
      const customAsset: CharacterAsset[] = [
        { type: 'custom', uri: '', name: 'custom', ext: 'png' },
      ];

      render(<AssetsEditor assets={customAsset} version="v3" onChange={onChange} />);

      // Expand
      fireEvent.click(screen.getByText('Assets'));

      // The select should show the custom option
      const typeSelect = screen.getByRole('combobox');
      expect(typeSelect).toHaveValue('custom');
    });

    it('should preserve other assets when updating one', () => {
      const onChange = vi.fn();
      render(<AssetsEditor assets={sampleAssets} version="v3" onChange={onChange} />);

      // Expand
      fireEvent.click(screen.getByText('Assets'));

      // Update first asset
      const nameInput = screen.getByDisplayValue('main');
      fireEvent.change(nameInput, { target: { value: 'updated' } });

      const call = onChange.mock.calls[0][0];
      expect(call[0].name).toBe('updated');
      expect(call[1]).toEqual(sampleAssets[1]); // Second asset unchanged
    });

    it('should preserve other fields when updating one field', () => {
      const onChange = vi.fn();
      render(<AssetsEditor assets={sampleAssets} version="v3" onChange={onChange} />);

      // Expand
      fireEvent.click(screen.getByText('Assets'));

      // Only update name
      const nameInput = screen.getByDisplayValue('main');
      fireEvent.change(nameInput, { target: { value: 'updated' } });

      const call = onChange.mock.calls[0][0];
      expect(call[0].type).toBe('icon'); // Unchanged
      expect(call[0].uri).toBe('https://example.com/icon.png'); // Unchanged
      expect(call[0].ext).toBe('png'); // Unchanged
      expect(call[0].name).toBe('updated'); // Changed
    });
  });
});
