import operators from '../data/operators.json';

// Type for operator color data
export interface OperatorColor {
    name: string;
    hex: string;
    unicode: string;
}

// Get all operator colors
export const operatorColors: OperatorColor[] = Object.values(operators).map(op => ({
    name: op.name,
    hex: op.hex,
    unicode: op.unicode
}));

// Convert hex to HSL
function hexToHSL(hex: string): { h: number; s: number; l: number } {
    // Convert hex to RGB
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
}

// Calculate color distance using HSL values with more weight on hue
export function calculateColorDistance(color1: string, color2: string): number {
    const hsl1 = hexToHSL(color1);
    const hsl2 = hexToHSL(color2);

    // Normalize hue difference to be between 0 and 180 degrees
    const hueDiff = Math.min(
        Math.abs(hsl1.h - hsl2.h),
        360 - Math.abs(hsl1.h - hsl2.h)
    );

    // Weights for different components
    const hueWeight = 0.6;    // 60% weight for hue
    const satWeight = 0.2;    // 20% weight for saturation
    const lightWeight = 0.2;  // 20% weight for lightness

    // Calculate weighted differences
    const hueDistance = (hueDiff / 180) * hueWeight;
    const satDistance = (Math.abs(hsl1.s - hsl2.s) / 100) * satWeight;
    const lightDistance = (Math.abs(hsl1.l - hsl2.l) / 100) * lightWeight;

    return hueDistance + satDistance + lightDistance;
}

// Find the 5 nearest colors from the operator list
export function findNearestColors(
    inputColor: string,
    obtainedOperators: OperatorColor[] = [],
    useObtainedOnly: boolean = false
): OperatorColor[] {
    // Filter operators based on obtained list if useObtainedOnly is true
    const availableOperators = useObtainedOnly
        ? obtainedOperators
        : operatorColors;

    const distances = availableOperators.map(op => ({
        ...op,
        distance: calculateColorDistance(inputColor, op.hex)
    }));

    return distances
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 5);
}

// Validate hex color format
export function isValidHexColor(color: string): boolean {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
} 