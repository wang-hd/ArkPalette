import Image from 'next/image';
import { useState } from 'react';
import { OperatorColor } from '@/utils/colorUtils';

interface OperatorImageProps {
    selectedOperators: OperatorColor[];
}

export default function OperatorImage({ selectedOperators }: OperatorImageProps) {
    const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>({});

    const handleImageError = (unicode: string) => {
        setImageErrors(prev => ({
            ...prev,
            [unicode]: true
        }));
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Selected Operators</h2>
            <div className="flex flex-wrap justify-center gap-4">
                {selectedOperators.map((operator, index) => (
                    <div key={index} className="relative w-32 h-40 overflow-hidden">
                        {!imageErrors[operator.unicode] ? (
                            <div className="relative w-full h-full">
                                <Image
                                    src={`/txz/${operator.unicode}.jpg`}
                                    alt={operator.name}
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    className="object-contain"
                                    onError={() => handleImageError(operator.unicode)}
                                />
                            </div>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500 text-sm">
                                {operator.name}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
} 