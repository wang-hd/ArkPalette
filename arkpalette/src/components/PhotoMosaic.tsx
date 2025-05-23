import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { OperatorColor, findNearestColors } from '@/utils/colorUtils';
import operatorsData from '@/data/operators_1.json';

interface OperatorData {
    name: string;
    unicode: string;
    index: number;
    hex: string;
    palette: string[];
    pixels: number[][];
}

interface PhotoMosaicProps {
    selectedOperators: OperatorColor[];
    obtainedOperators: OperatorColor[];
    useObtainedOnly: boolean;
}

const RESOLUTIONS = [
    { id: 'small', name: '小 (10x10)', size: 10 },
    { id: 'medium', name: '中 (20x20)', size: 20 },
    { id: 'large', name: '大 (40x40)', size: 40 },
];

const PREVIEW_SIZE = 400; // Fixed size for the preview

export default function PhotoMosaic({ selectedOperators, obtainedOperators, useObtainedOnly }: PhotoMosaicProps) {
    const [selectedResolution, setSelectedResolution] = useState(RESOLUTIONS[0]);
    const [mosaicData, setMosaicData] = useState<{ color: string; operator: OperatorColor }[][]>([]);
    const [sourceImage, setSourceImage] = useState<string | null>(null);
    const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
    const [selectedGrid, setSelectedGrid] = useState<{ x: number; y: number } | null>(null);
    const [nearestOperators, setNearestOperators] = useState<OperatorColor[]>([]);
    const [pixelUsage, setPixelUsage] = useState<{ [key: string]: number }>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Check if file is an image
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file');
            return;
        }

        // Create object URL for the image
        const imageUrl = URL.createObjectURL(file);
        setSourceImage(imageUrl);

        // Reset mosaic data when new image is uploaded
        setMosaicData([]);
        setPixelUsage({});
        setImageDimensions(null);
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const rgbToHsv = (r: number, g: number, b: number): [number, number, number] => {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const delta = max - min;

        let h = 0;
        let s = max === 0 ? 0 : delta / max;
        let v = max;

        if (delta !== 0) {
            if (max === r) {
                h = ((g - b) / delta) % 6;
            } else if (max === g) {
                h = (b - r) / delta + 2;
            } else {
                h = (r - g) / delta + 4;
            }

            h = Math.round(h * 60);
            if (h < 0) h += 360;
        }

        return [h, s, v];
    };

    const calculateColorDistance = (color1: string, color2: string): number => {
        const r1 = parseInt(color1.slice(1, 3), 16);
        const g1 = parseInt(color1.slice(3, 5), 16);
        const b1 = parseInt(color1.slice(5, 7), 16);
        const r2 = parseInt(color2.slice(1, 3), 16);
        const g2 = parseInt(color2.slice(3, 5), 16);
        const b2 = parseInt(color2.slice(5, 7), 16);

        const [h1, s1, v1] = rgbToHsv(r1, g1, b1);
        const [h2, s2, v2] = rgbToHsv(r2, g2, b2);

        // Calculate weighted distance in HSV space
        const hDiff = Math.min(Math.abs(h1 - h2), 360 - Math.abs(h1 - h2)) / 180.0;
        const sDiff = Math.abs(s1 - s2);
        const vDiff = Math.abs(v1 - v2);

        return hDiff * 0.5 + sDiff * 0.25 + vDiff * 0.25;
    };

    const generateMosaic = async () => {
        if (!sourceImage) return;

        // Create a canvas to analyze the source image
        const img = document.createElement('img');
        img.src = sourceImage;
        await new Promise((resolve) => {
            img.onload = resolve;
        });

        // Store original dimensions
        setImageDimensions({ width: img.width, height: img.height });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Calculate dimensions maintaining aspect ratio
        const aspectRatio = img.width / img.height;
        let mosaicWidth, mosaicHeight;

        if (img.width > img.height) {
            mosaicHeight = selectedResolution.size;
            mosaicWidth = Math.round(selectedResolution.size * aspectRatio);
        } else {
            mosaicWidth = selectedResolution.size;
            mosaicHeight = Math.round(selectedResolution.size / aspectRatio);
        }

        // Set canvas size to match the calculated dimensions
        canvas.width = mosaicWidth;
        canvas.height = mosaicHeight;
        ctx.drawImage(img, 0, 0, mosaicWidth, mosaicHeight);

        // Get pixel data
        const imageData = ctx.getImageData(0, 0, mosaicWidth, mosaicHeight);
        const pixels = imageData.data;

        // Create mosaic data
        const mosaic: { color: string; operator: OperatorColor }[][] = [];
        const usage: { [key: string]: number } = {};

        // Filter available operators based on obtained list
        const availableOperators = useObtainedOnly
            ? obtainedOperators
            : Object.values(operatorsData as unknown as Record<string, OperatorData>);

        for (let y = 0; y < mosaicHeight; y++) {
            const row: { color: string; operator: OperatorColor }[] = [];
            for (let x = 0; x < mosaicWidth; x++) {
                const i = (y * mosaicWidth + x) * 4;
                const r = pixels[i];
                const g = pixels[i + 1];
                const b = pixels[i + 2];
                const color = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

                // Find nearest operator color using HSV distance
                const nearestOperator = availableOperators
                    .reduce((nearest, current) => {
                        const currentDistance = calculateColorDistance(color, current.hex);
                        const nearestDistance = calculateColorDistance(color, nearest.hex);
                        return currentDistance < nearestDistance ? current : nearest;
                    });

                // Count pixel usage
                usage[nearestOperator.name] = (usage[nearestOperator.name] || 0) + 1;

                row.push({ color, operator: { name: nearestOperator.name, hex: nearestOperator.hex, unicode: nearestOperator.unicode } });
            }
            mosaic.push(row);
        }
        setMosaicData(mosaic);
        setPixelUsage(usage);
    };

    const handleGridClick = (x: number, y: number, color: string) => {
        setSelectedGrid({ x, y });

        // Find 5 nearest operators from available operators
        const availableOperators = useObtainedOnly
            ? obtainedOperators
            : Object.values(operatorsData as unknown as Record<string, OperatorData>)
                .map(op => ({ name: op.name, hex: op.hex, unicode: op.unicode }));

        const sortedOperators = availableOperators
            .map(op => ({
                ...op,
                distance: calculateColorDistance(color, op.hex)
            }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 5)
            .map(({ name, hex, unicode }) => ({ name, hex, unicode }));

        setNearestOperators(sortedOperators);
    };

    const handleOperatorSelect = (operator: OperatorColor) => {
        if (!selectedGrid || !mosaicData) return;

        const { x, y } = selectedGrid;
        const newMosaicData = [...mosaicData];
        const row = [...newMosaicData[y]];

        // Get the full operator data from operatorsData
        const operatorData = (operatorsData as unknown as Record<string, OperatorData>)[operator.unicode];
        if (!operatorData) return;

        row[x] = {
            color: row[x].color,
            operator: {
                name: operatorData.name,
                hex: operatorData.hex,
                unicode: operatorData.unicode
            }
        };

        newMosaicData[y] = row;
        setMosaicData(newMosaicData);
        setSelectedGrid(null);
    };

    const renderMosaic = () => {
        if (!mosaicData.length || !imageDimensions) return null;

        const pixelSize = PREVIEW_SIZE / Math.max(mosaicData[0].length, mosaicData.length);
        const gridSize = 8; // Size of the operator's pixel art grid to use

        return (
            <div
                className="relative"
                style={{
                    width: PREVIEW_SIZE,
                    height: PREVIEW_SIZE * (mosaicData.length / mosaicData[0].length),
                }}
            >
                {mosaicData.map((row, y) =>
                    row.map(({ operator, color }, x) => {
                        const operatorData = (operatorsData as unknown as Record<string, OperatorData>)[operator.unicode];
                        if (!operatorData) return null;

                        const { pixels, palette } = operatorData;
                        // Get the 8x8 grid starting from pixels[12][2]
                        const startRow = 12;
                        const startCol = 2;

                        // Get the 8x8 grid of pixel indices
                        const gridPixels = Array.from({ length: gridSize * gridSize }, (_, i) => {
                            const pixelRow = Math.floor(i / gridSize);
                            const pixelCol = i % gridSize;
                            return pixels[startRow + pixelRow][startCol + pixelCol];
                        });

                        // Calculate tooltip position
                        const isTopRow = y === 0;
                        const isBottomRow = y === mosaicData.length - 1;
                        const isLeftColumn = x === 0;
                        const isRightColumn = x === mosaicData[0].length - 1;

                        const tooltipPosition = {
                            top: isTopRow ? '100%' : 'auto',
                            bottom: isBottomRow ? '100%' : 'auto',
                            left: isLeftColumn ? '0' : isRightColumn ? 'auto' : '50%',
                            right: isRightColumn ? '0' : 'auto',
                            transform: isLeftColumn || isRightColumn ? 'none' : 'translateX(-50%)',
                        };

                        const isSelected = selectedGrid?.x === x && selectedGrid?.y === y;

                        return (
                            <div
                                key={`${x}-${y}`}
                                style={{
                                    position: 'absolute',
                                    left: x * pixelSize,
                                    top: y * pixelSize,
                                    width: pixelSize,
                                    height: pixelSize,
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(8, 1fr)',
                                    gridTemplateRows: 'repeat(8, 1fr)',
                                }}
                                className="group relative"
                                onClick={() => handleGridClick(x, y, color)}
                            >
                                <div className="absolute inset-0 grid grid-cols-8 grid-rows-8">
                                    {gridPixels.map((pixelIndex, i) => (
                                        <div
                                            key={i}
                                            style={{
                                                backgroundColor: palette[pixelIndex],
                                            }}
                                        />
                                    ))}
                                </div>
                                <div
                                    className="absolute px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20"
                                    style={tooltipPosition}
                                >
                                    {operator.name}
                                </div>
                                {isSelected && (
                                    <div
                                        className="absolute z-30 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5"
                                        style={{
                                            ...(isTopRow ? { top: '100%' } : { bottom: '100%' }),
                                            ...(isLeftColumn ? { left: '0' } :
                                                isRightColumn ? { right: '0' } :
                                                    { left: '50%', transform: 'translateX(-50%)' }),
                                        }}
                                    >
                                        <div className="py-1" role="menu">
                                            {nearestOperators.map((op) => (
                                                <button
                                                    key={op.unicode}
                                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOperatorSelect(op);
                                                    }}
                                                >
                                                    <div
                                                        className="w-4 h-4 rounded-full mr-2"
                                                        style={{ backgroundColor: op.hex }}
                                                    />
                                                    {op.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                />
                <button
                    onClick={handleUploadClick}
                    className="w-full sm:w-auto bg-blue-500 text-white px-4 py-1 rounded-md hover:bg-blue-600 transition-colors"
                >
                    选择图片
                </button>
                <select
                    value={selectedResolution.id}
                    onChange={(e) => setSelectedResolution(RESOLUTIONS.find(r => r.id === e.target.value) || RESOLUTIONS[0])}
                    className="w-full sm:w-auto bg-white border border-gray-300 rounded-md px-3 py-1 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {RESOLUTIONS.map(res => (
                        <option key={res.id} value={res.id}>{res.name}</option>
                    ))}
                </select>
                <button
                    onClick={generateMosaic}
                    disabled={!sourceImage}
                    className={`w-full sm:w-auto px-4 py-1 rounded-md transition-colors ${sourceImage
                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                >
                    生成马赛克
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">原图</h3>
                    {sourceImage ? (
                        <div className="relative w-full aspect-square">
                            <Image
                                src={sourceImage}
                                alt="Source"
                                fill
                                className="object-contain"
                            />
                        </div>
                    ) : (
                        <div
                            className="w-full aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors"
                            onClick={handleUploadClick}
                        >
                            <div className="text-center text-gray-500">
                                <p>点击或拖拽图片到此处</p>
                                <p className="text-sm mt-1">支持 JPG、PNG 格式</p>
                            </div>
                        </div>
                    )}
                </div>

                <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">马赛克预览</h3>
                    <div className="relative w-full aspect-square overflow-auto flex items-center justify-center">
                        {renderMosaic()}
                    </div>
                </div>
            </div>

            {Object.keys(pixelUsage).length > 0 && (
                <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">像素使用统计</h3>
                    <div className="bg-white rounded-lg shadow-md p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {Object.entries(pixelUsage)
                                .sort(([, a], [, b]) => b - a)
                                .map(([name, count]) => {
                                    const operator = Object.values(operatorsData as unknown as Record<string, OperatorData>)
                                        .find(op => op.name === name);
                                    return (
                                        <div key={name} className="flex items-center gap-2">
                                            <div
                                                className="w-4 h-4 rounded-full"
                                                style={{ backgroundColor: operator?.hex || '#000000' }}
                                            />
                                            <span className="text-sm text-gray-600">{name}: {count} 像素</span>
                                        </div>
                                    );
                                })}
                        </div>
                        <div className="mt-4 text-sm text-gray-600">
                            共使用 {Object.keys(pixelUsage).length} 个干员
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 