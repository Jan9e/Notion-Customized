import { ArrowRight, Check, Menu, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import HeroIllustration from '../components/HeroIllustration'

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      const offset = 80 // Height of the navbar plus some padding
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset
      
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      })
    }
  }

  const scrollToTop = (e) => {
    e.preventDefault()
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    })
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="mx-auto max-w-7xl">
          <div className="relative flex items-center justify-between p-6 lg:px-8">
            <div className="flex lg:flex-1">
              <a
                href="/"
                onClick={scrollToTop}
                className="-m-1.5 p-1.5 hover:opacity-75 transition-opacity"
              >
                <span className="text-2xl font-bold">Notion Clone</span>
              </a>
            </div>
            
            {/* Mobile menu button */}
            <div className="flex lg:hidden">
              <button
                type="button"
                className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 hover:bg-gray-100/50"
                onClick={() => setMobileMenuOpen(true)}
              >
                <span className="sr-only">Open main menu</span>
                <Menu className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>

            {/* Desktop navigation */}
            <div className="hidden lg:flex lg:gap-x-12">
              <button
                onClick={() => scrollToSection('features')}
                className="text-sm font-semibold leading-6 text-gray-900 hover:text-gray-600 transition-colors cursor-pointer"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('pricing')}
                className="text-sm font-semibold leading-6 text-gray-900 hover:text-gray-600 transition-colors cursor-pointer"
              >
                Pricing
              </button>
            </div>
            <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:items-center">
              <Link 
                to="/login" 
                className="inline-flex items-center justify-center text-sm font-semibold leading-6 mr-4 px-3 py-2 rounded-lg text-gray-900 hover:bg-gray-100/50 transition-all duration-200"
              >
                Log in 
                <span className="ml-2 text-gray-400 group-hover:text-gray-600 transition-colors" aria-hidden="true">→</span>
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black/80 transition-all duration-200 ease-in-out hover:scale-105"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50">
            <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
              <div className="flex items-center justify-between">
                <a
                  href="/"
                  onClick={(e) => {
                    scrollToTop(e)
                    setMobileMenuOpen(false)
                  }}
                  className="-m-1.5 p-1.5 hover:opacity-75 transition-opacity"
                >
                  <span className="text-2xl font-bold">Notion Clone</span>
                </a>
                <button
                  type="button"
                  className="-m-2.5 rounded-md p-2.5 hover:bg-gray-100/50 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="sr-only">Close menu</span>
                  <X className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              <div className="mt-6 flow-root">
                <div className="-my-6 divide-y divide-gray-500/10">
                  <div className="space-y-2 py-6">
                    <button
                      onClick={() => {
                        scrollToSection('features')
                        setMobileMenuOpen(false)
                      }}
                      className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-100/50 transition-colors w-full text-left cursor-pointer"
                    >
                      Features
                    </button>
                    <button
                      onClick={() => {
                        scrollToSection('pricing')
                        setMobileMenuOpen(false)
                      }}
                      className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-100/50 transition-colors w-full text-left cursor-pointer"
                    >
                      Pricing
                    </button>
                  </div>
                  <div className="py-6 space-y-4">
                    <Link
                      to="/login"
                      className="flex items-center justify-center rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-100/50 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Log in
                      <span className="ml-2 text-gray-400" aria-hidden="true">→</span>
                    </Link>
                    <Link
                      to="/signup"
                      className="flex w-full items-center justify-center rounded-lg bg-black px-3 py-2.5 text-base font-semibold text-white shadow-sm hover:bg-black/80 transition-all duration-200 ease-in-out hover:scale-105"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Get Started
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Content with top padding for fixed navbar */}
      <div className="pt-24">
        {/* Hero Section */}
        <div className="relative isolate">
          {/* Background decorative elements */}
          <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
            <div
              className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-gray-200 via-gray-300 to-gray-400 opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem] animate-pulse"
              style={{
                clipPath:
                  'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
              }}
            />
          </div>
          
          {/* Additional background gradient */}
          <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
            <div
              className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-gray-300 via-gray-200 to-gray-400 opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem] animate-pulse"
              style={{
                clipPath:
                  'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
              }}
            />
          </div>

          <div className="py-24 sm:py-32 lg:pb-40">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <div className="mx-auto max-w-2xl text-center">
                <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
                  Your workspace, reimagined
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-600">
                  Write, plan, and get organized in one place. The all-in-one workspace for your notes, tasks, and collaboration.
                </p>
                <div className="mt-10 flex items-center justify-center gap-x-6">
                  <Link
                    to="/signup"
                    className="rounded-md bg-black px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-black/80 focus-visible:outline focus-visible:outline-offset-2 hover:scale-105 transition-all duration-200"
                  >
                    Get started for free <ArrowRight className="ml-2 inline-block h-4 w-4" />
                  </Link>
                </div>
              </div>

              {/* Hero Image/Illustration */}
              <div className="mt-16 flow-root sm:mt-24">
                <div className="relative mx-auto max-w-4xl">
                  <HeroIllustration />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section with Visual Improvements */}
        <div id="features" className="py-24 sm:py-32 relative scroll-mt-24 overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_30%,theme(colors.gray.100),white)] opacity-30" />
            <div className="absolute inset-y-0 right-1/2 -z-10 mr-16 w-[200%] origin-bottom-left skew-x-[-30deg] bg-white shadow-xl shadow-gray-600/10 ring-1 ring-gray-50 sm:mr-28 lg:mr-0 xl:mr-16 xl:origin-center" />
          </div>
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-gray-900">Features</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Everything you need to stay organized
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Powerful features to help you manage your notes, tasks, and projects all in one place.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                {features.map((feature) => (
                  <div key={feature.name} className="flex flex-col items-start">
                    <div className="rounded-lg bg-gray-50 p-2 ring-1 ring-gray-900/10">
                      <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-white shadow-md">
                        {feature.icon}
                      </div>
                    </div>
                    <dt className="mt-4 font-semibold">{feature.name}</dt>
                    <dd className="mt-2 leading-7 text-gray-600">{feature.description}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        <div id="pricing" className="py-24 sm:py-32 scroll-mt-24 relative overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-[radial-gradient(70%_70%_at_50%_100%,theme(colors.gray.100),white)] opacity-40" />
          </div>
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl sm:text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Simple, transparent pricing</h2>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Get started for free, upgrade when you need more features.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl rounded-3xl ring-1 ring-gray-200 sm:mt-20 lg:mx-0 lg:flex lg:max-w-none">
              <div className="p-8 sm:p-10 lg:flex-auto">
                <h3 className="text-2xl font-bold tracking-tight">Free Plan</h3>
                <p className="mt-6 text-base leading-7 text-gray-600">
                  Perfect for individuals and small teams getting started.
                </p>
                <div className="mt-10 flex items-center gap-x-4">
                  <h4 className="flex-none text-sm font-semibold leading-6">What's included</h4>
                  <div className="h-px flex-auto bg-gray-100" />
                </div>
                <ul role="list" className="mt-8 grid grid-cols-1 gap-4 text-sm leading-6 text-gray-600 sm:grid-cols-2 sm:gap-6">
                  {includedFeatures.map((feature) => (
                    <li key={feature} className="flex gap-x-3">
                      <Check className="h-6 w-5 flex-none" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="-mt-2 p-2 lg:mt-0 lg:w-full lg:max-w-md lg:flex-shrink-0">
                <div className="rounded-2xl bg-gray-50 py-10 text-center ring-1 ring-inset ring-gray-900/5 lg:flex lg:flex-col lg:justify-center lg:py-16">
                  <div className="mx-auto max-w-xs px-8">
                    <p className="text-base font-semibold">Get started today</p>
                    <p className="mt-6 flex items-baseline justify-center gap-x-2">
                      <span className="text-5xl font-bold tracking-tight">$0</span>
                      <span className="text-sm font-semibold leading-6 tracking-wide">/month</span>
                    </p>
                    <Link
                      to="/signup"
                      className="mt-10 block w-full rounded-md bg-black px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-black/80 focus-visible:outline focus-visible:outline-offset-2"
                    >
                      Get started
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-auto bg-black">
          <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
            <div className="mt-8 md:order-1 md:mt-0">
              <p className="text-center text-xs leading-5 text-gray-400">
                &copy; 2025 Notion Clone. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

const features = [
  {
    name: 'Notes & Docs',
    description: 'Create beautiful documents with rich text editing, images, and more.',
    icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 4V20H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4 16L8 12L12 16L20 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>,
  },
  {
    name: 'Tasks & Projects',
    description: 'Organize your work with tasks, projects, and deadlines.',
    icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>,
  },
  {
    name: 'Collaboration',
    description: 'Work together with your team in real-time.',
    icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>,
  },
]

const includedFeatures = [
  'Unlimited notes and documents',
  'Basic collaboration',
  'Mobile and desktop apps',
  'Basic templates',
] 