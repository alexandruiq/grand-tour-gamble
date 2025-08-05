'use client'

import Link from 'next/link'
import { useTheme } from '@/lib/useTheme'

export default function Home() {
  const theme = useTheme()
  
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Fullscreen Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-no-repeat bg-right-center"
        style={{
          backgroundImage: "url('/images/team-rubicon.jpg')"
        }}
      />
      
      {/* Lighter Overlay for Better Immersion */}
      <div className="absolute inset-0 bg-black/30" />
      
      {/* Game Overlay Title */}
      <div className="absolute top-1/4 right-8 md:right-16 lg:right-24 z-10 text-right max-w-md">
        <h2 
          className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight opacity-90"
          style={{
            color: theme.colors.background,
            fontFamily: theme.fonts.primary,
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
          }}
        >
          The Grand Tour Gamble
        </h2>
        <p 
          className="text-sm md:text-base lg:text-lg mt-2 opacity-80"
          style={{
            color: theme.colors.background,
            fontFamily: theme.fonts.primary,
            textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
          }}
        >
          A soft-skills strategy game on wheels
        </p>
        
        {/* Qualians Logo - Below Title, Right Aligned */}
        <div className="mt-4 flex justify-end">
          <img
            src="/logos/qualians-logo.png"
            alt="Qualians"
            className="object-contain h-8 md:h-10 opacity-70"
          />
        </div>
      </div>
      
      {/* Main CTA Card - Left Side (Smaller) */}
      <div className="absolute left-6 md:left-12 lg:left-16 top-1/2 transform -translate-y-1/2 z-20 max-w-xs md:max-w-sm lg:max-w-md w-full">
        <div 
          className="rounded-2xl p-5 md:p-6 lg:p-7 shadow-2xl backdrop-blur-md border"
          style={{
            backgroundColor: theme.colors.background + 'F0',
            borderColor: theme.colors.accent + '40',
            borderRadius: theme.borders.radius
          }}
        >
          <div className="text-left">
            <h1 
              className="text-xl md:text-2xl lg:text-3xl font-bold mb-3 text-center"
              style={{
                color: theme.colors.text,
                fontFamily: theme.fonts.primary,
                fontWeight: theme.fonts.headingWeight
              }}
            >
              Join the Race
            </h1>
            
            <p 
              className="text-sm md:text-base lg:text-lg mb-5 md:mb-6 leading-relaxed text-center"
              style={{
                color: theme.colors.text + '90',
                fontFamily: theme.fonts.primary
              }}
            >
              Join your team in a high-stakes cycling showdown where every decision counts.
            </p>
            
            <Link 
              href="/login"
              className="inline-block w-full px-5 md:px-6 py-2.5 md:py-3 text-base md:text-lg font-bold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl mb-5 md:mb-6 text-center"
              style={{
                backgroundColor: theme.colors.primary,
                color: theme.colors.background,
                borderRadius: theme.borders.buttonRadius,
                fontFamily: theme.fonts.primary
              }}
            >
              Start the Race
            </Link>
            
            {/* Game Features with Tooltips */}
            <div className="grid grid-cols-1 gap-2 text-xs md:text-sm">
              <div 
                className="flex items-center justify-center space-x-2 group cursor-help relative"
                style={{
                  color: theme.colors.text + '80',
                  fontFamily: theme.fonts.primary
                }}
              >
                <span className="text-yellow-500">🏆</span>
                <span>Team Strategy</span>
                <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap z-30">
                  Collaborate with teammates to maximize points
                </div>
              </div>
              
              <div 
                className="flex items-center justify-center space-x-2 group cursor-help relative"
                style={{
                  color: theme.colors.text + '80',
                  fontFamily: theme.fonts.primary
                }}
              >
                <span className="text-blue-500">⚡</span>
                <span>Real-time Decisions</span>
                <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap z-30">
                  Make split-second choices that impact the race
                </div>
              </div>
              
              <div 
                className="flex items-center justify-center space-x-2 group cursor-help relative"
                style={{
                  color: theme.colors.text + '80',
                  fontFamily: theme.fonts.primary
                }}
              >
                <span className="text-purple-500">🧠</span>
                <span>Soft Skills Training</span>
                <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap z-30">
                  Develop leadership and communication skills
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile CTA Card */}
      <div className="block md:hidden absolute inset-x-4 bottom-8 z-20">
        <div 
          className="rounded-2xl p-5 shadow-2xl backdrop-blur-md border text-center"
          style={{
            backgroundColor: theme.colors.background + 'E6',
            borderColor: theme.colors.accent + '40',
            borderRadius: theme.borders.radius
          }}
        >
          <h1 
            className="text-lg font-bold mb-2"
            style={{
              color: theme.colors.text,
              fontFamily: theme.fonts.primary,
              fontWeight: theme.fonts.headingWeight
            }}
          >
            Join the Race
          </h1>
          
          <p 
            className="text-sm mb-4"
            style={{
              color: theme.colors.text + '90',
              fontFamily: theme.fonts.primary
            }}
          >
            High-stakes cycling showdown where every decision counts
          </p>
          
          <Link 
            href="/login"
            className="inline-block w-full px-5 py-2.5 text-base font-bold rounded-xl transition-all duration-300 mb-4"
            style={{
              backgroundColor: theme.colors.primary,
              color: theme.colors.background,
              borderRadius: theme.borders.buttonRadius,
              fontFamily: theme.fonts.primary
            }}
          >
            Start the Race
          </Link>
          
          <div className="flex justify-center space-x-4 text-xs">
            <span style={{ color: theme.colors.text + '80' }}>🏆 Strategy</span>
            <span style={{ color: theme.colors.text + '80' }}>⚡ Real-time</span>
            <span style={{ color: theme.colors.text + '80' }}>🧠 Training</span>
          </div>
        </div>
      </div>
    </main>
  )
}