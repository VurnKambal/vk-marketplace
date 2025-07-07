'use client';

import { CATEGORIES } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SidebarProps {
  selectedCategory?: string;
  onCategorySelect?: (categoryId: string) => void;
}

export function Sidebar({ selectedCategory, onCategorySelect }: SidebarProps) {
  const handleCategoryClick = (categoryId: string) => {
    onCategorySelect?.(categoryId === selectedCategory ? '' : categoryId);
  };

  return (
    <aside className="w-72 bg-gradient-to-b from-gray-50 to-white border-r border-gray-200 h-full shadow-inner">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Browse Categories</h2>
          <p className="text-sm text-gray-600">Find exactly what you need</p>
        </div>
        <nav className="space-y-2">
          {CATEGORIES.map((category, index) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              style={{ animationDelay: `${index * 50}ms` }}
              className={cn(
                "w-full text-left px-4 py-3 text-sm rounded-2xl transition-all duration-300 group relative overflow-hidden",
                "hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2",
                "transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]",
                "animate-fade-in-up",
                selectedCategory === category.id
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-[1.02] border-l-4 border-yellow-400"
                  : "text-gray-700 hover:text-gray-900"
              )}
            >
              {/* Background animation for selected state */}
              {selectedCategory === category.id && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-500/20 animate-pulse rounded-2xl"></div>
              )}
              
              <div className="flex justify-between items-center relative z-10">
                <span className="font-medium group-hover:font-semibold transition-all duration-200">
                  {category.name}
                </span>
                {category.count && (
                  <span className={cn(
                    "text-xs px-2 py-1 rounded-full font-medium transition-all duration-200",
                    selectedCategory === category.id
                      ? "bg-white/20 text-white"
                      : "bg-gray-200 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-700"
                  )}>
                    {category.count}
                  </span>
                )}
              </div>

              {/* Hover effect overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
            </button>
          ))}
        </nav>

        {/* Fun decorative element */}
        <div className="mt-8 p-4 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-2xl border border-yellow-200">
          <div className="text-2xl mb-2">🎒</div>
          <h3 className="font-semibold text-gray-800 mb-1">Student Special</h3>
          <p className="text-xs text-gray-600">Get verified student deals!</p>
        </div>
      </div>
    </aside>
  );
}