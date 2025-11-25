import Link from 'next/link';

interface NavigationProps {
  currentFamily?: string;
  showOriginalLink?: boolean;
}

export function Navigation({ currentFamily, showOriginalLink = false }: NavigationProps) {
  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-6">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/" className="text-xl font-bold text-green-800 hover:text-green-900">
            🎅 Santa Secreto
          </Link>
          
          {currentFamily && (
            <span className="text-sm text-gray-500 text-center bg-gray-100 px-2 py-1 rounded">
              Sorteo: <span className="font-mono  font-medium">{currentFamily}</span>
            </span>
          )}
        </div>
        
        <div className=" hidden md:flex flex-col lg:flex-row items-center space-x-2">
          {showOriginalLink && (
            <Link href="/" className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors">
              🏠 Familia Perez Original
            </Link>
          )}
          
          {currentFamily && (
            <Link href="/crear-familia" className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors">
              ➕ Nueva Familia
            </Link>
          )}
          
        </div>
      </div>
    </nav>
  );
}