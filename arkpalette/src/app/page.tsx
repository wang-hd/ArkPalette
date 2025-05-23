'use client';

import { useState, useEffect } from 'react';
import ColorInput from '@/components/ColorInput';
import PixelArtRenderer from '@/components/PixelArtRenderer';
import NavTabs from '@/components/NavTabs';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { OperatorColor, findNearestColors } from '@/utils/colorUtils';
import presets from '@/data/presets.json';
import PhotoMosaic from '@/components/PhotoMosaic';

interface Preset {
  name: string;
  colors: string[];
}

const TABS = [
  { id: 'passport', name: '色盘平铺' },
  { id: 'new-function', name: '照片马赛克' },
];

export default function Home() {
  const [colors, setColors] = useState<string[]>(['#000000']);
  const [nearestColors, setNearestColors] = useState<OperatorColor[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [selectedTab, setSelectedTab] = useState<string>('passport');

  useEffect(() => {
    // Select the first preset on page load
    if (presets.presets.length > 0) {
      const firstPreset = presets.presets[0];
      setSelectedPreset(firstPreset.name);
      handlePresetChange(firstPreset.name);
    }
  }, []);

  const handleColorChange = (index: number, color: string) => {
    const newColors = [...colors];
    newColors[index] = color;
    setColors(newColors);
  };

  const handleNearestColorChange = (index: number, color: string, operator: OperatorColor) => {
    const newNearestColors = [...nearestColors];
    newNearestColors[index] = operator;
    setNearestColors(newNearestColors);
  };

  const handleAddColor = () => {
    if (colors.length < 6) {
      setColors([...colors, '#000000']);
      setNearestColors([...nearestColors, { name: '', hex: '#000000', unicode: '' }]);
    }
  };

  const handleRemoveColor = (index: number) => {
    if (index > 0) {  // Don't remove the first color
      const newColors = colors.filter((_, i) => i !== index);
      const newNearestColors = nearestColors.filter((_, i) => i !== index);
      setColors(newColors);
      setNearestColors(newNearestColors);
    }
  };

  const handlePresetChange = (presetName: string) => {
    const preset = presets.presets.find(p => p.name === presetName);
    if (preset) {
      setSelectedPreset(presetName);
      // Set the colors
      setColors(preset.colors);

      // Initialize nearestColors array with the same length as preset colors
      const newNearestColors = new Array(preset.colors.length).fill(null).map((_, index) => {
        const nearest = findNearestColors(preset.colors[index])[0];
        return nearest || { name: '', hex: preset.colors[index], unicode: '' };
      });
      setNearestColors(newNearestColors);
    }
  };

  const renderPassportFunction = () => (
    <div className="space-y-8">
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h2 className="text-xl font-semibold text-gray-800">选择颜色</h2>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label htmlFor="preset" className="text-sm text-gray-700 whitespace-nowrap">预设色盘:</label>
            <select
              id="preset"
              className="bg-white border border-gray-300 rounded-md px-3 py-1 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
              onChange={(e) => handlePresetChange(e.target.value)}
              value={selectedPreset}
            >
              <option value="" disabled className="text-gray-500">选择</option>
              {presets.presets.map((preset: Preset) => (
                <option key={preset.name} value={preset.name} className="text-gray-900">
                  {preset.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {colors.map((color, index) => (
            <div key={index} className="relative">
              <ColorInput
                index={index}
                color={color}
                onColorChange={handleColorChange}
                onNearestColorChange={handleNearestColorChange}
              />
              {index > 0 && (
                <button
                  onClick={() => handleRemoveColor(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-white text-gray-600 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors shadow-md"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          {colors.length < 6 && (
            <button
              onClick={handleAddColor}
              className="flex items-center justify-center w-12 h-12 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow self-center"
            >
              <PlusIcon className="w-6 h-6 text-gray-600" />
            </button>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">颜色预览</h2>
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {colors.map((color, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="flex flex-col items-center w-full">
                  <div
                    className="w-full h-24"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-sm text-gray-600 mt-1">Input: {color}</span>
                </div>
                <div className="flex flex-col items-center w-full">
                  <div
                    className="w-full h-24"
                    style={{ backgroundColor: nearestColors[index]?.hex }}
                  />
                  <span className="text-sm text-gray-600 mt-1">
                    {nearestColors[index] ? `${nearestColors[index].name} ${nearestColors[index].hex}` : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <PixelArtRenderer selectedOperators={nearestColors.filter(op => op.name)} />
    </div>
  );

  const renderNewFunction = () => (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">照片马赛克</h2>
      <PhotoMosaic selectedOperators={nearestColors.filter(op => op.name)} />
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-100 py-4 sm:py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8 text-center">
          我有通行症：通行证平铺助手
        </h1>

        <div className="mb-6 sm:mb-8">
          <NavTabs
            tabs={TABS}
            selectedTab={selectedTab}
            onTabChange={setSelectedTab}
          />
        </div>

        {selectedTab === 'passport' && renderPassportFunction()}
        {selectedTab === 'new-function' && renderNewFunction()}
      </div>
    </main>
  );
}
