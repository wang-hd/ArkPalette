import { useState, useEffect, useRef } from 'react';
import { Listbox } from '@headlessui/react';
import { ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { findNearestColors, isValidHexColor, OperatorColor } from '@/utils/colorUtils';

interface ColorInputProps {
    index: number;
    color: string;
    onColorChange: (index: number, color: string) => void;
    onNearestColorChange: (index: number, color: string, operator: OperatorColor) => void;
    obtainedOperators: OperatorColor[];
    useObtainedOnly: boolean;
}

export default function ColorInput({
    index,
    color,
    onColorChange,
    onNearestColorChange,
    obtainedOperators,
    useObtainedOnly
}: ColorInputProps) {
    const [nearestColors, setNearestColors] = useState<OperatorColor[]>([]);
    const [selectedColor, setSelectedColor] = useState<OperatorColor | null>(null);
    const prevColorRef = useRef(color);
    const isInitialMount = useRef(true);
    const isUserSelection = useRef(false);
    const selectedColorRef = useRef<OperatorColor | null>(null);

    useEffect(() => {
        selectedColorRef.current = selectedColor;
    }, [selectedColor]);

    useEffect(() => {
        if (isUserSelection.current) {
            isUserSelection.current = false;
            return;
        }

        if (isInitialMount.current ||
            prevColorRef.current !== color ||
            useObtainedOnly) {
            const nearest = findNearestColors(color, obtainedOperators, useObtainedOnly);
            setNearestColors(nearest);

            if (isInitialMount.current ||
                prevColorRef.current !== color ||
                (useObtainedOnly && (!selectedColorRef.current || !obtainedOperators.some(op => op.unicode === selectedColorRef.current?.unicode)))) {
                if (nearest.length > 0) {
                    setSelectedColor(nearest[0]);
                    onNearestColorChange(index, nearest[0].hex, nearest[0]);
                }
            }

            prevColorRef.current = color;
            isInitialMount.current = false;
        }
    }, [color, index, onNearestColorChange, obtainedOperators, useObtainedOnly]);

    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newColor = e.target.value;
        if (newColor === '' || /^#?[0-9A-Fa-f]{0,6}$/.test(newColor)) {
            const formattedColor = newColor.startsWith('#') ? newColor : `#${newColor}`;
            onColorChange(index, formattedColor);
        }
    };

    const handleNearestColorChange = (color: OperatorColor) => {
        if (nearestColors.some(op => op.unicode === color.unicode)) {
            isUserSelection.current = true;
            setSelectedColor(color);
            onNearestColorChange(index, color.hex, color);
        }
    };

    return (
        <div className="flex flex-col space-y-2 p-3 bg-white rounded-lg shadow-md">
            <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium text-gray-700">
                    Color {index + 1}
                </label>
                <div className="flex flex-col space-y-2">
                    <input
                        type="color"
                        value={color}
                        onChange={handleColorChange}
                        className="w-full h-10 rounded cursor-pointer"
                    />
                    <input
                        type="text"
                        value={color}
                        onChange={handleColorChange}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        placeholder="#000000"
                        pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nearest Operator
                </label>
                <Listbox value={selectedColor} onChange={handleNearestColorChange}>
                    <div className="relative">
                        <Listbox.Button className="relative w-full py-1 pl-2 pr-8 text-left bg-white border border-gray-300 rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                            <div className="flex items-center space-x-2">
                                <div
                                    className="w-4 h-4 rounded border border-gray-300"
                                    style={{ backgroundColor: selectedColor?.hex }}
                                />
                                <span className="block truncate text-gray-900">
                                    {selectedColor ? selectedColor.name : 'Select operator'}
                                </span>
                            </div>
                            <span className="absolute inset-y-0 right-0 flex items-center pr-1 pointer-events-none">
                                <ChevronUpDownIcon className="w-4 h-4 text-gray-400" aria-hidden="true" />
                            </span>
                        </Listbox.Button>
                        <Listbox.Options className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                            {nearestColors.map((color) => (
                                <Listbox.Option
                                    key={color.hex}
                                    value={color}
                                    className={({ active }: { active: boolean }) =>
                                        `cursor-pointer select-none relative py-1 pl-2 pr-8 ${active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                                        }`
                                    }
                                >
                                    {({ selected }: { selected: boolean }) => (
                                        <div className="flex items-center space-x-2">
                                            <div
                                                className="w-4 h-4 rounded border border-gray-300"
                                                style={{ backgroundColor: color.hex }}
                                            />
                                            <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                                {color.name}
                                            </span>
                                        </div>
                                    )}
                                </Listbox.Option>
                            ))}
                        </Listbox.Options>
                    </div>
                </Listbox>
            </div>
        </div>
    );
} 