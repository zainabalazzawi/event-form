import { LoaderCircleIcon } from 'lucide-react';
import * as React from 'react';

interface LoadingStateProps {
	text?: string;
	iconSize?: number;
	className?: string;
}

export const LoadingState = ({ className, text, iconSize }: LoadingStateProps) => (
	<div className="w-full h-screen flex items-center justify-center bg-neutral-100 flex-col">
		<LoaderCircleIcon className={className} size={iconSize} />
		{text && <span className="mt-1 text-neutral-500">{text}</span>}
	</div>
);
