import { useState, useEffect } from 'react';
import { OperatorColor } from '@/utils/colorUtils';
import operatorsData from '@/data/operators_1.json';

interface OperatorSearchProps {
    onObtainedChange: (operators: OperatorColor[]) => void;
    useObtainedOnly: boolean;
    onUseObtainedChange: (useObtained: boolean) => void;
}

export default function OperatorSearch({ onObtainedChange, useObtainedOnly, onUseObtainedChange }: OperatorSearchProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [obtainedOperators, setObtainedOperators] = useState<OperatorColor[]>([]);
    const [searchResults, setSearchResults] = useState<OperatorColor[]>([]);
    const [showTooltip, setShowTooltip] = useState(false);

    // Load obtained operators from localStorage on component mount
    useEffect(() => {
        const savedOperators = localStorage.getItem('obtainedOperators');
        if (savedOperators) {
            const parsed = JSON.parse(savedOperators);
            setObtainedOperators(parsed);
            onObtainedChange(parsed);
        }
    }, []);

    // Save obtained operators to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('obtainedOperators', JSON.stringify(obtainedOperators));
        onObtainedChange(obtainedOperators);
    }, [obtainedOperators]);

    const handleSearch = (value: string) => {
        setSearchTerm(value);
        if (!value.trim()) {
            setSearchResults([]);
            return;
        }

        const results = Object.values(operatorsData)
            .filter((op: any) =>
                op.name.toLowerCase().includes(value.toLowerCase())
            )
            .map((op: any) => ({
                name: op.name,
                unicode: op.unicode,
                hex: op.hex
            }));

        setSearchResults(results);
    };

    const addToObtained = (operator: OperatorColor) => {
        if (!obtainedOperators.some(op => op.unicode === operator.unicode)) {
            setObtainedOperators([...obtainedOperators, operator]);
        }
        setSearchTerm('');
        setSearchResults([]);
    };

    const removeFromObtained = (unicode: string) => {
        setObtainedOperators(obtainedOperators.filter(op => op.unicode !== unicode));
    };

    const handleCheckboxChange = (checked: boolean) => {
        if (obtainedOperators.length === 0) {
            setShowTooltip(true);
            setTimeout(() => setShowTooltip(false), 2000);
            return;
        }
        onUseObtainedChange(checked);
    };

    return (
        <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
                <div className="flex-1">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="搜索干员..."
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                    />
                </div>
                <div className="relative">
                    <label className="flex items-center gap-2 text-gray-900">
                        <input
                            type="checkbox"
                            checked={useObtainedOnly}
                            onChange={(e) => handleCheckboxChange(e.target.checked)}
                            disabled={obtainedOperators.length === 0}
                            className={`w-4 h-4 ${obtainedOperators.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                        <span>仅使用已获得干员</span>
                    </label>
                    {showTooltip && (
                        <div className="absolute left-0 top-full mt-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm whitespace-nowrap">
                            请先添加已获得干员
                        </div>
                    )}
                </div>
            </div>

            {searchResults.length > 0 && (
                <div className="absolute z-10 w-full bg-white border rounded-lg shadow-lg mt-1">
                    {searchResults.map((operator) => (
                        <div
                            key={operator.unicode}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-900"
                            onClick={() => addToObtained(operator)}
                        >
                            {operator.name}
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2 text-gray-900">已获得干员 ({obtainedOperators.length})</h3>
                <div className="flex flex-wrap gap-2">
                    {obtainedOperators.map((operator) => (
                        <div
                            key={operator.unicode}
                            className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full text-gray-900 border border-gray-300"
                        >
                            <span>{operator.name}</span>
                            <button
                                onClick={() => removeFromObtained(operator.unicode)}
                                className="text-red-600 hover:text-red-800"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
} 