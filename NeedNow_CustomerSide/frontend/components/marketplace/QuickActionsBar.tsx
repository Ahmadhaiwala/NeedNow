'use client';

interface QuickActionsBarProps {
  onQuickAction: (action: 'sell' | 'need' | 'service' | 'nearby') => void;
}

// Quick action discovery cards removed per user request
export default function QuickActionsBar({ onQuickAction: _ }: QuickActionsBarProps) {
  return null;
}
