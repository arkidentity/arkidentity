import Link from 'next/link';
import Script from 'next/script';

export const metadata = {
  title: 'Giving - ARK Identity',
  description: 'Partner with ARK Identity to multiply disciples. Give directly or through our tax-deductible fiscal sponsor.',
};

export default function Giving() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="py-20" style={{ background: 'linear-gradient(135deg, var(--navy) 0%, var(--maroon) 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            Partner With Us
          </h1>
          <p className="text-xl text-gray-200 leading-relaxed max-w-3xl mx-auto">
            You want to invest in people. You give generously to ministries, but deep down you wonder—is this producing real life change? Are we creating disciples who make disciples, or just funding programs that fill seats? If your heart longs to invest in something that multiplies—not just maintains—then you&apos;re not alone.
          </p>
        </div>
      </section>

      {/* Two Giving Options */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12 text-center" style={{ color: 'var(--navy)' }}>
            Choose Your Giving Method
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Option 1: Direct Giving */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2" style={{ borderColor: 'var(--navy)' }}>
              <div className="p-6" style={{ backgroundColor: 'var(--navy)' }}>
                <h3 className="text-2xl font-bold text-white">Direct Giving</h3>
                <p className="text-gray-200 mt-2">Support ARK Identity directly</p>
              </div>
              <div className="p-6">
                <p className="text-gray-700 mb-4">
                  These funds go straight to development, hosting, and content creation.
                </p>
                <p className="text-sm text-gray-600 mb-6">
                  <strong>Note:</strong> Donations are not tax-deductible
                </p>

                {/* Embedded Square Checkout */}
                <div className="bg-gray-100 rounded-lg mb-4">
                  <iframe
                    src="https://checkout.square.site/merchant/MLC3G13NXWEVC/checkout/KF3JBKCHDFBPSV32MKF62UU3"
                    className="w-full rounded-lg"
                    style={{ height: '800px' }}
                    title="Direct Giving via Square"
                  />
                </div>
              </div>
            </div>

            {/* Option 2: Tax-Deductible */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2" style={{ borderColor: 'var(--gold)' }}>
              <div className="p-6" style={{ backgroundColor: 'var(--gold)' }}>
                <h3 className="text-2xl font-bold" style={{ color: 'var(--navy)' }}>Tax-Deductible Donation</h3>
                <p className="text-gray-700 mt-2">Give through our fiscal sponsor</p>
              </div>
              <div className="p-6">
                <p className="text-gray-700 mb-4">
                  Give through our fiscal sponsor, Global Service Associates (501c3). You&apos;ll receive a tax receipt.
                </p>
                <p className="text-sm text-gray-600 mb-6">
                  <strong>Note:</strong> Tax-deductible via Global Service Associates (501c3)
                </p>

                {/* Embedded Global Service Associates Form - DonorView */}
                <div className="bg-gray-100 rounded-lg mb-4">
                  <Script
                    src="https://app.donorview.com/scripts/shared/iframeResizer/iframeResizer.min.js"
                    strategy="lazyOnload"
                  />
                  <iframe
                    src="https://app.dvforms.net/api/dv/zkyz4k"
                    frameBorder="0"
                    scrolling="yes"
                    id="dv-iframe"
                    allow="payment"
                    name="dv-iframe"
                    className="w-full rounded-lg"
                    style={{ width: '100%', height: '800px' }}
                    title="Tax-Deductible Giving via Global Service Associates"
                  />
                  <Script id="dv-iframe-resizer" strategy="lazyOnload">
                    {`
                      if (typeof iFrameResize !== 'undefined') {
                        iFrameResize({
                          checkOrigin: false,
                          inPageLinks: true,
                          heightCalculationMethod: 'taggedElement'
                        }, '#dv-iframe');
                      }
                    `}
                  </Script>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision 2026 CTA */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--navy)' }}>
            See Where Your Giving Goes
          </h2>
          <p className="text-lg text-gray-700 mb-8">
            Learn about our Vision 2026 goals and how your partnership helps us multiply disciples nationwide.
          </p>
          <Link
            href="/vision-2026"
            className="inline-block px-8 py-4 rounded-lg font-semibold text-lg transition hover:opacity-90"
            style={{ backgroundColor: 'var(--navy)', color: 'white' }}
          >
            See Vision 2026
          </Link>
        </div>
      </section>
    </div>
  );
}
