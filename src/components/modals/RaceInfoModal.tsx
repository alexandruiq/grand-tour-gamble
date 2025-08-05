'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useTheme } from '@/lib/useTheme'

interface RaceInfoModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function RaceInfoModal({ isOpen, onClose }: RaceInfoModalProps) {
  const [activeTab, setActiveTab] = useState<'history' | 'map'>('history')
  const theme = useTheme()

  if (!isOpen) return null

  const renderHistoryTab = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">The Grand Tour Gamble</h3>
        <p className="text-gray-600">History & Legacy</p>
      </div>
      
      <div className="prose prose-sm text-gray-700 space-y-4">
        <p>
          In a sport where tradition is sacred and every move is analyzed, a bold experiment shattered expectations. 
          A secret coalition of retired cyclists, master tacticians, and behavioral scientists designed a new kind of 
          competition — one that wouldn't just test strength and stamina, but force riders to confront their deepest motivations.
        </p>
        
        <p>
          <strong>They called it The Grand Tour Gamble.</strong>
        </p>
        
        <p>
          Held once a year on ever-changing routes across the globe, the Gamble isn't like any other race. 
          There are no established favorites, no team captains, no fixed alliances. What it demands from riders 
          isn't just physical excellence, but nerve, foresight, and the courage to choose between team loyalty and personal ambition.
        </p>
        
        <p>
          In this race, every stage is a fork in the road: <strong>Sprint ahead</strong> and claim points — but burn precious 
          energy and risk alienating others. <strong>Cruise in sync</strong> with your fellow riders — and hope the favor is returned. 
          Sometimes it is. Sometimes… it isn't.
        </p>
        
        <p>
          Riders from all corners of the world have learned that reputation, negotiation, and timing matter just as much as raw talent. 
          Legends have been made from daring solo breaks — and others broken by misplaced trust or mistimed aggression.
        </p>
        
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <p className="font-semibold text-blue-900">Now it's your turn.</p>
          <p className="text-blue-800">
            You and your group will take the reins of a single rider from the mysterious <strong>Team Rubicon</strong>. 
            Each decision you make will ripple through the race. Will you play safe, build alliances, and wait for the 
            perfect moment — or take bold risks and race into the unknown?
          </p>
        </div>
        
        <div className="text-center text-lg font-semibold text-gray-900">
          Ten stages. Dozens of choices. One legacy.
        </div>
      </div>
    </div>
  )

  const renderMapTab = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Race Route</h3>
        <p className="text-gray-600">The Grand Tour Gamble Course</p>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <Image
          src="/map/map of the game.png"
          alt="Grand Tour Gamble Race Map"
          width={600}
          height={400}
          className="w-full h-auto object-contain"
          priority
        />
      </div>
      
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900">Stage Overview</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="font-medium text-gray-900">Stages 1-3</div>
            <div className="text-gray-600">Opening sprint stages</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="font-medium text-blue-900">Stage 4</div>
            <div className="text-blue-600">First negotiation round</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="font-medium text-gray-900">Stages 5-6</div>
            <div className="text-gray-600">Mountain stages</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="font-medium text-blue-900">Stage 7</div>
            <div className="text-blue-600">Second negotiation round</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="font-medium text-gray-900">Stage 8</div>
            <div className="text-gray-600">Time trial stage</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="font-medium text-blue-900">Stage 9</div>
            <div className="text-blue-600">Final negotiation round</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3 col-span-2">
            <div className="font-medium text-yellow-900">Stage 10</div>
            <div className="text-yellow-700">Grand finale - Paris sprint</div>
          </div>
        </div>
        
        <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
          <div className="text-sm text-amber-800">
            <div className="font-medium mb-1">🔥 Negotiation Stages (4, 7, 10)</div>
            <div>Team coordination can unlock powerful multipliers. Unanimous decisions yield the highest rewards!</div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div 
        className="rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden"
        style={{
          backgroundColor: theme.colors.background,
          borderRadius: theme.borders.radius,
          boxShadow: theme.effects?.shadow || '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-6 border-b"
          style={{
            borderColor: theme.colors.accent + '20'
          }}
        >
          <h2 
            className="text-xl font-bold"
            style={{
              color: theme.colors.text,
              fontFamily: theme.fonts.primary,
              fontWeight: theme.fonts.headingWeight
            }}
          >
            🗺️ Race Information
          </h2>
          <button
            onClick={onClose}
            className="hover:opacity-75 transition-opacity"
            style={{
              color: theme.colors.text + '60'
            }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'history'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📜 Race History
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'map'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            🗺️ Course Map
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'history' && renderHistoryTab()}
          {activeTab === 'map' && renderMapTab()}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="btn-primary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}