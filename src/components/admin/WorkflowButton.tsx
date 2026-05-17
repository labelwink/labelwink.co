import { ButtonHTMLAttributes, ReactNode } from 'react';

interface WorkflowButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  color?: 'green' | 'blue' | 'gold' | 'red' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'outline' | 'solid';
  loading?: boolean;
  children: ReactNode;
}

export default function WorkflowButton({
  color = 'gold',
  size = 'md',
  variant = 'solid',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}: WorkflowButtonProps) {
  let baseClass = 'font-bold rounded-lg transition-all flex justify-center items-center gap-2 ';
  
  if (size === 'sm') baseClass += 'py-1.5 px-3 text-xs ';
  if (size === 'md') baseClass += 'py-2.5 px-4 text-sm ';
  if (size === 'lg') baseClass += 'py-3 px-5 text-base ';
  if (size === 'xl') baseClass += 'py-4 px-6 text-lg rounded-xl ';

  if (variant === 'outline') {
    baseClass += 'border-2 bg-white ';
    if (color === 'red') baseClass += 'border-red-500 text-red-600 hover:bg-red-50 ';
    else if (color === 'green') baseClass += 'border-emerald-500 text-emerald-600 hover:bg-emerald-50 ';
    else if (color === 'blue') baseClass += 'border-blue-500 text-blue-600 hover:bg-blue-50 ';
    else baseClass += 'border-gray-300 text-gray-700 hover:bg-gray-50 ';
  } else {
    if (color === 'green') baseClass += 'bg-emerald-600 text-white hover:bg-emerald-700 ';
    else if (color === 'blue') baseClass += 'bg-blue-600 text-white hover:bg-blue-700 ';
    else if (color === 'gold') baseClass += 'bg-[#c9a84c] text-[#ffffff] hover:bg-[#b5953e] ';
    else if (color === 'red') baseClass += 'bg-red-600 text-white hover:bg-red-700 ';
    else baseClass += 'bg-[#1b3a34] text-white hover:bg-[#16312b] ';
  }

  if (disabled || loading) {
    baseClass += 'opacity-60 cursor-not-allowed ';
  }

  return (
    <button
      className={`${baseClass} ${className} shadow-sm`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : null}
      {children}
    </button>
  );
}
