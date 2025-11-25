interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

export default function Spinner({ size = 'medium', color = '#ce3b46' }: SpinnerProps) {
  const sizeClasses = {
    small: 'w-6 h-6 border-2',
    medium: 'w-12 h-12 border-3',
    large: 'w-16 h-16 border-4',
  };

  return (
    <div className="flex items-center justify-center">
      <div
        className={`${sizeClasses[size]} border-t-transparent rounded-full animate-spin`}
        style={{ borderColor: color, borderTopColor: 'transparent' }}
      />
    </div>
  );
}
