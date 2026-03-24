"use client";

import Image from "next/image";
import { ArrowDown, ArrowRight, ChevronRight } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] w-full overflow-x-hidden">
      {/* Hero Section - Full Screen behind transparent navbar */}
      <section className="relative min-h-screen w-full flex flex-col items-center justify-center px-6 pb-12 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 z-0 w-full">
          <Image
            src="/bg.png"
            alt="Background"
            fill
            className="object-cover w-full"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#0a0a0a]" />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center w-full px-4 pt-28">
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-white mb-8 tracking-tight">
            The <span className="text-[#E4FF2C]">liyt</span> way
          </h1>
          <p className="text-xl md:text-2xl text-white/80 mb-10 w-full">
            LIYT is a smart delivery platform for social commerce businesses. Create, track, and complete last-mile deliveries with a shared driver network.
          </p>

          {/* Phone Image */}
          <div className="relative mx-auto mb-10" style={{ maxWidth: '850px' }}>
            <Image
              src="/phone.png"
              alt="LIYT App"
              width={850}
              height={1275}
              className="w-full h-auto drop-shadow-2xl"
              priority
            />
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="relative z-10 w-full px-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-auto pb-8">
          <button className="group flex flex-row items-center justify-center gap-3 bg-[#E4FF2C] text-black py-4 md:py-6 px-6 md:px-8 rounded-2xl font-bold text-lg md:text-xl hover:bg-[#d4ef1c] transition-colors">
            <span>GET THE APP</span>
            <ArrowDown className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-y-1 transition-transform" />
          </button>
          <button className="group flex flex-row items-center justify-center gap-3 bg-[#2a2a2a] text-white py-4 md:py-6 px-6 md:px-8 rounded-2xl font-bold text-lg md:text-xl hover:bg-[#3a3a3a] transition-colors">
            <span>LEARN MORE</span>
            <ArrowRight className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Get It Delivered / Drive & Earn Section */}
      <section id="how-it-works" className="grid grid-cols-1 md:grid-cols-2 w-full">
        {/* Left Side - Get It Delivered */}
        <div className="relative min-h-[90vh] w-full flex flex-col items-center justify-center p-12 overflow-hidden">
          <Image
            src="/map.png"
            alt="Map"
            fill
            className="object-cover w-full"
          />
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative z-10 text-center w-full">
            <h2 className="text-6xl md:text-7xl lg:text-8xl font-black text-white mb-6">
              Get it
            </h2>
            <h2 className="text-6xl md:text-7xl lg:text-8xl font-black text-[#E4FF2C] mb-8">
              Delivered
            </h2>
            <p className="text-white/80 text-lg md:text-xl mb-10 max-w-md mx-auto">
              Premium, reliable service at your fingertips. From across town to your doorstep
            </p>
            <button className="group flex items-center gap-3 bg-[#E4FF2C] text-black py-4 px-8 rounded-full font-bold text-base hover:bg-[#d4ef1c] transition-colors mx-auto">
              Book now
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          <div className="absolute bottom-8 left-8 text-white/20 text-7xl md:text-8xl font-black">
            Customer
          </div>
        </div>

        {/* Right Side - Drive & Earn */}
        <div className="relative min-h-[90vh] w-full flex flex-col items-center justify-center p-12 bg-[#0a0a0a]">
          <div className="text-center w-full">
            <h2 className="text-6xl md:text-7xl lg:text-8xl font-black text-white mb-6">
              Drive and
            </h2>
            <h2 className="text-6xl md:text-7xl lg:text-8xl font-black text-[#E4FF2C] mb-8">
              Earn
            </h2>
            <p className="text-white/80 text-lg md:text-xl mb-10 max-w-md mx-auto">
              Set your own schedule. Be your own boss. Earn more on every trip you make
            </p>
            <button className="group flex items-center gap-3 bg-[#E4FF2C] text-black py-4 px-8 rounded-full font-bold text-base hover:bg-[#d4ef1c] transition-colors mx-auto">
              Start Earning
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          <div className="absolute bottom-8 right-8 text-white/10 text-7xl md:text-8xl font-black">
            Driver
          </div>
        </div>
      </section>

      {/* Features Section - Diagonal Layout from Top-Left to Bottom-Right */}
      <section id="features" className="py-32 px-8 bg-[#0a0a0a] w-full">
        <div className="w-full relative">
          {/* Feature 1 - Left (Top) */}
          <div className="w-full md:w-auto md:ml-[5%]">
            <span className="text-[#E4FF2C] text-lg font-medium mb-4 block">01</span>
            <h3 className="text-5xl md:text-6xl lg:text-7xl font-black text-white mb-3">
              Real-time
            </h3>
            <h3 className="text-5xl md:text-6xl lg:text-7xl font-black text-[#E4FF2C] mb-6">
              Tracking
            </h3>
            <p className="text-white/70 text-lg md:text-xl max-w-lg">
              GPS precision that keeps you informed every second of the journey. No more guessing.
            </p>
          </div>

          {/* Feature 2 - Center (Middle) */}
          <div className="mt-24 md:mt-32 w-full md:w-auto md:mx-auto md:text-center">
            <span className="text-[#E4FF2C] text-lg font-medium mb-4 block md:text-center">02</span>
            <h3 className="text-5xl md:text-6xl lg:text-7xl font-black text-[#E4FF2C] mb-3">
              Transparent
            </h3>
            <h3 className="text-5xl md:text-6xl lg:text-7xl font-black text-white mb-6">
              Pricing
            </h3>
            <p className="text-white/70 text-lg md:text-xl max-w-lg md:mx-auto">
              Clear, standardized fees so businesses can price confidently and customers know the cost upfront.
            </p>
          </div>

          {/* Feature 3 - Right (Bottom) */}
          <div className="mt-24 md:mt-32 w-full md:w-auto md:mr-[5%] md:ml-auto md:text-right">
            <span className="text-[#E4FF2C] text-lg font-medium mb-4 block md:text-right">03</span>
            <h3 className="text-5xl md:text-6xl lg:text-7xl font-black text-[#E4FF2C] mb-3">
              24/7
            </h3>
            <h3 className="text-5xl md:text-6xl lg:text-7xl font-black text-white mb-6">
              Support
            </h3>
            <p className="text-white/70 text-lg md:text-xl max-w-lg md:ml-auto">
              Our dedicated team is always online to ensure your experience is flawless.
            </p>
          </div>
        </div>
      </section>

      {/* Get The App Section */}
      <section id="download" className="bg-[#E4FF2C] py-32 px-8 w-full">
        <div className="w-full">
          <h2 className="text-5xl md:text-7xl lg:text-8xl font-black text-black text-center mb-16">
            Get the app
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center w-full">
            {/* App Store Button */}
            <div className="flex flex-col items-center lg:items-end">
              <button className="flex items-center gap-4 bg-black text-white py-5 px-10 rounded-full hover:bg-gray-800 transition-colors">
                <svg viewBox="0 0 24 24" className="w-8 h-8 fill-current">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                <span className="text-lg font-bold">App Store</span>
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Phone Image */}
            <div className="flex justify-center w-full">
              <div className="relative" style={{ maxWidth: '680px' }}>
                <Image
                  src="/phone.png"
                  alt="LIYT App"
                  width={680}
                  height={1020}
                  className="w-full h-auto drop-shadow-2xl"
                />
              </div>
            </div>

            {/* Google Play Button */}
            <div className="flex flex-col items-center lg:items-start">
              <button className="flex items-center gap-4 bg-black text-white py-5 px-10 rounded-full hover:bg-gray-800 transition-colors">
                <svg viewBox="0 0 24 24" className="w-8 h-8 fill-current">
                  <path d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12L3.84 21.85C3.34 21.6 3 21.09 3 20.5ZM16.81 15.12L6.05 21.34L14.54 12.85L16.81 15.12ZM20.16 10.81C20.5 11.08 20.75 11.5 20.75 12C20.75 12.5 20.53 12.9 20.18 13.18L17.89 14.5L15.39 12L17.89 9.5L20.16 10.81ZM6.05 2.66L16.81 8.88L14.54 11.15L6.05 2.66Z" />
                </svg>
                <span className="text-lg font-bold">Google Play</span>
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16 pt-10 border-t-2 border-black/20 w-full">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-black">+2k</div>
              <div className="text-base md:text-lg text-black/60 mt-2">Downloads</div>
            </div>
            <div className="text-center border-x-2 border-black/20">
              <div className="text-4xl md:text-5xl font-bold text-black">4.5</div>
              <div className="text-base md:text-lg text-black/60 mt-2">Rating</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-black">24/7</div>
              <div className="text-base md:text-lg text-black/60 mt-2">Support</div>
            </div>
          </div>
        </div>
      </section>


    </main>
  );
}
