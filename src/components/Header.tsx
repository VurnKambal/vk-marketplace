'use client';

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface HeaderProps {
  onSearch?: (query: string) => void;
}

export function Header({ onSearch }: HeaderProps) {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearch?.(e.target.value);
  };

  return (
    <header className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 border-b border-purple-200 px-4 py-4 shadow-lg backdrop-blur-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="w-12 h-12 bg-gradient-to-br from-white to-blue-100 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-all duration-300 group-hover:rotate-3">
            <span className="text-blue-600 font-bold text-2xl">V</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              VK Marketplace
            </h1>
            <p className="text-blue-100 text-xs font-medium">
              Student Trading Hub
            </p>
          </div>
        </Link>

        {/* Search Bar */}
        <div className="flex-1 max-w-lg mx-8">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 group-focus-within:text-blue-500 transition-colors duration-200" />
            <Input
              type="text"
              placeholder="Search for textbooks, furniture, electronics..."
              onChange={handleSearchChange}
              className="pl-12 pr-4 py-3 bg-white/90 backdrop-blur-sm border-white/20 rounded-2xl focus:bg-white focus:ring-2 focus:ring-white/50 focus:border-transparent placeholder:text-gray-500 text-gray-800 shadow-lg transition-all duration-300 hover:shadow-xl focus:scale-[1.02]"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="default"
            asChild
            className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white hover:text-blue-600 transition-all duration-300 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
          >
            <Link href="/create">+ Sell Something</Link>
          </Button>
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 cursor-pointer"></div>
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-teal-500 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 cursor-pointer"></div>
            <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 cursor-pointer"></div>
          </div>
        </div>
      </div>
    </header>
  );
}