import React from 'react'
import { Check, Calendar, FileText, Users, Star } from 'lucide-react'

export default function HeroIllustration() {
  return (
    <div className="relative w-full aspect-[4/3] bg-white rounded-lg shadow-2xl ring-1 ring-gray-900/10">
      {/* Container with padding to accommodate floating elements */}
      <div className="absolute inset-8">
        {/* Main illustration content */}
        <div className="relative w-full h-full rounded-lg overflow-hidden">
          {/* Sidebar */}
          <div className="absolute left-0 top-0 bottom-0 w-48 bg-gray-50 border-r border-gray-200">
            <div className="p-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-gray-300"></div>
                <div className="h-4 w-24 bg-gray-300 rounded"></div>
              </div>
              <div className="mt-6 space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded bg-gray-200"></div>
                    <div className="h-3 w-20 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="absolute left-48 right-0 top-0 bottom-0">
            {/* Header */}
            <div className="h-16 border-b border-gray-200 px-6 flex items-center">
              <div className="flex items-center space-x-4">
                <div className="h-8 w-8 rounded bg-blue-100 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                <div className="h-4 w-32 bg-gray-200 rounded"></div>
              </div>
              <div className="ml-auto flex items-center space-x-3">
                <div className="flex -space-x-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-gray-200"></div>
                  ))}
                </div>
                <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center">
                  <Star className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="space-y-4">
                <div className="h-8 w-3/4 bg-gray-100 rounded-lg"></div>
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-4 w-full bg-gray-100 rounded"></div>
                  ))}
                </div>
                
                {/* Task List */}
                <div className="mt-8 space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Check className="h-4 w-4 text-green-500" />
                      <div className="h-4 w-full bg-gray-200 rounded"></div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div className="h-4 w-20 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Elements - positioned relative to the outer container */}
      <div className="absolute -top-4 -left-4 z-10">
        <div className="rounded-lg bg-white shadow-xl p-4 ring-1 ring-gray-900/10">
          <div className="flex items-center space-x-3">
            <Check className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium">Task completed</span>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-4 -right-4 z-10">
        <div className="rounded-lg bg-white shadow-xl p-4 ring-1 ring-gray-900/10">
          <div className="flex items-center space-x-3">
            <Users className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-medium">Real-time collaboration</span>
          </div>
        </div>
      </div>
    </div>
  )
} 