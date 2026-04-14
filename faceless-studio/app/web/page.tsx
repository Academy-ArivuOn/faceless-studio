import Navbar from '@/components/layout/Navbar'
import Hero from '@/components/landing/Hero'
import HowItWorks from '@/components/landing/HowItWorks'
import AgentsSection from '@/components/landing/AgentsSection'
import Pricing from '@/components/landing/Pricing'
import Footer from '@/components/landing/Footer'

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <AgentsSection />
        <Pricing />
      </main>
      <Footer />
    </>
  )
}