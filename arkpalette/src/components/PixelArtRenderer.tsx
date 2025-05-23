import { OperatorColor } from '@/utils/colorUtils';
import operatorsData from '@/data/operators_1.json';

interface OperatorData {
    name: string;
    unicode: string;
    index: number;
    hex: string;
    palette: string[];
    pixels: number[][];
}

interface PixelArtRendererProps {
    selectedOperators: OperatorColor[];
}

export default function PixelArtRenderer({ selectedOperators }: PixelArtRendererProps) {
    const renderPixelArt = (operator: OperatorColor) => {
        const operatorData = (operatorsData as unknown as Record<string, OperatorData>)[operator.unicode];
        if (!operatorData) return null;

        const { pixels, palette } = operatorData;
        const pixelSize = 16; // Each pixel is 20x20
        const gridWidth = 10; // 10 pixels wide
        const gridHeight = 20; // 20 pixels high

        return (
            <div
                className="relative"
                style={{
                    width: gridWidth * pixelSize,
                    height: gridHeight * pixelSize,
                }}
            >
                {pixels.flat().map((colorIndex: number, i: number) => {
                    const row = Math.floor(i / gridWidth);
                    const col = i % gridWidth;
                    const color = palette[colorIndex];

                    return (
                        <div
                            key={i}
                            style={{
                                position: 'absolute',
                                left: col * pixelSize,
                                top: row * pixelSize,
                                width: pixelSize,
                                height: pixelSize,
                                backgroundColor: color,
                            }}
                        />
                    );
                })}
            </div>
        );
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">通行证预览</h2>
            <div className="flex flex-wrap justify-center gap-4">
                {selectedOperators.map((operator, index) => (
                    <div key={index} className="relative">
                        {renderPixelArt(operator)}
                        <div className="mt-2 text-center text-sm text-gray-600">
                            {operator.name}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
} 