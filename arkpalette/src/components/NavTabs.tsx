import { Tab } from '@headlessui/react';
import { cn } from '@/utils/cn';

interface NavTabsProps {
    tabs: {
        id: string;
        name: string;
    }[];
    selectedTab: string;
    onTabChange: (tabId: string) => void;
}

export default function NavTabs({ tabs, selectedTab, onTabChange }: NavTabsProps) {
    return (
        <Tab.Group onChange={(index) => onTabChange(tabs[index].id)}>
            <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1">
                {tabs.map((tab) => (
                    <Tab
                        key={tab.id}
                        className={({ selected }) =>
                            cn(
                                'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                                'ring-white/60 ring-offset-2 ring-offset-gray-400 focus:outline-none focus:ring-2',
                                selected
                                    ? 'bg-white text-gray-900 shadow'
                                    : 'text-gray-600 hover:bg-white/[0.12] hover:text-gray-800'
                            )
                        }
                    >
                        {tab.name}
                    </Tab>
                ))}
            </Tab.List>
        </Tab.Group>
    );
} 