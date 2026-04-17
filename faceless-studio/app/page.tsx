import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import ProblemSolution from '@/components/landing/ProblemSolution'
import HowItWorks from '@/components/landing/HowItWorks'
import AgentsSection from '@/components/landing/AgentsSection'
import Testimonials from '@/components/landing/Testimonials'
import Pricing from '@/components/landing/Pricing'
import { FinalCTA, Footer } from '@/components/landing/Footer'

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <ProblemSolution />
        <HowItWorks />
        <AgentsSection />
        <Testimonials />
        <Pricing />
        <FinalCTA />
      </main>
      <Footer />
    </>
  )
}