"use client";

import { Smartphone, Shield, Zap, Star } from "lucide-react";
import Image from "next/image";

export default function DownloadAppPage() {
  const features = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Get your deliveries in record time with our optimized routing system."
    },
    {
      icon: Shield,
      title: "Secure Payments",
      description: "Your transactions are protected with bank-level encryption."
    },
    {
      icon: Smartphone,
      title: "Easy to Use",
      description: "Intuitive interface designed for the best user experience."
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Hero Section */}
      <section className="relative py-32 px-8">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#E4FF2C]/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-[#E4FF2C] text-lg font-medium mb-4 block">DOWNLOAD THE APP</span>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white mb-8">
                Get <span className="text-[#E4FF2C]">Liyt</span><br />
                Today
              </h1>
              <p className="text-xl text-white/70 mb-10">
                Experience the future of delivery at your fingertips.
                Available on iOS and Android.
              </p>

              {/* App Store Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="flex items-center gap-4 bg-white text-black py-4 px-8 rounded-2xl font-bold hover:bg-gray-100 transition-colors">
                  <svg viewBox="0 0 24 24" className="w-8 h-8 fill-current">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                  <div className="text-left">
                    <div className="text-xs text-gray-600">Download on the</div>
                    <div className="text-lg font-bold">App Store</div>
                  </div>
                </button>

                <button className="flex items-center gap-4 bg-white text-black py-4 px-8 rounded-2xl font-bold hover:bg-gray-100 transition-colors">
                  <svg viewBox="0 0 24 24" className="w-8 h-8 fill-current">
                    <path d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12L3.84 21.85C3.34 21.6 3 21.09 3 20.5ZM16.81 15.12L6.05 21.34L14.54 12.85L16.81 15.12ZM20.16 10.81C20.5 11.08 20.75 11.5 20.75 12C20.75 12.5 20.53 12.9 20.18 13.18L17.89 14.5L15.39 12L17.89 9.5L20.16 10.81ZM6.05 2.66L16.81 8.88L14.54 11.15L6.05 2.66Z" />
                  </svg>
                  <div className="text-left">
                    <div className="text-xs text-gray-600">Get it on</div>
                    <div className="text-lg font-bold">Google Play</div>
                  </div>
                </button>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-4 mt-8">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-6 h-6 text-[#E4FF2C] fill-[#E4FF2C]" />
                  ))}
                </div>
                <span className="text-white font-bold text-lg">4.8</span>
                <span className="text-white/60">(2,000+ reviews)</span>
              </div>
            </div>

            {/* Phone Image */}
            <div className="flex justify-center">
              <div className="relative" style={{ maxWidth: '400px' }}>
                <Image
                  src="/phone1.png"
                  alt="LIYT App"
                  width={400}
                  height={600}
                  className="w-full h-auto drop-shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 px-8 bg-[#E4FF2C]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-black/70 text-lg font-medium mb-4 block">Why Choose Liyt</span>
            <h2 className="text-4xl md:text-5xl font-black text-black">
              Features You&apos;ll Love
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="relative bg-black rounded-3xl p-8 overflow-hidden group cursor-pointer transition-all duration-300 hover:scale-105"
              >
                {/* Logo Background - Top Right Corner */}
                <div className="absolute -top-2 -right-2 w-40 h-40 opacity-0 group-hover:opacity-30 transition-opacity duration-300 pointer-events-none overflow-hidden">
                  <Image
                    src="/logo.png"
                    alt=""
                    width={160}
                    height={160}
                    className="object-contain transform translate-x-2 -translate-y-2 rotate-12 scale-125"
                  />
                </div>

                {/* Content */}
                <div className="relative z-10">
                  <feature.icon className="w-12 h-12 text-[#E4FF2C] mb-6" />
                  <h3 className="text-white font-bold text-xl mb-4">{feature.title}</h3>
                  <p className="text-white/70">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-32 px-8">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-5xl md:text-6xl font-black text-[#E4FF2C] mb-2">+2k</div>
            <div className="text-white/70 text-lg">Downloads</div>
          </div>
          <div className="text-center">
            <div className="text-5xl md:text-6xl font-black text-[#E4FF2C] mb-2">4.8</div>
            <div className="text-white/70 text-lg">Rating</div>
          </div>
          <div className="text-center">
            <div className="text-5xl md:text-6xl font-black text-[#E4FF2C] mb-2">50+</div>
            <div className="text-white/70 text-lg">Cities</div>
          </div>
          <div className="text-center">
            <div className="text-5xl md:text-6xl font-black text-[#E4FF2C] mb-2">24/7</div>
            <div className="text-white/70 text-lg">Support</div>
          </div>
        </div>
      </section>
    </div>
  );
}
