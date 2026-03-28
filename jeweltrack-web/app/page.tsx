import { Button } from "@/components/ui/button";
import Link from "next/link";

const features = [
  {
    title: 'Smart billing',
    desc: 'Estimate and actual bills with auto gold rate. Mixed purity in one bill. GST ready.',
    icon: '📄',
  },
  {
    title: 'Stock distribution',
    desc: 'Give stock to small shops, track returns, calculate metal owed using purity + touch.',
    icon: '📦',
  },
  {
    title: 'Gold rate log',
    desc: 'Update 22K and 18K rates anytime. Auto fills in billing. Full rate history.',
    icon: '📈',
  },
  {
    title: 'Jewel loans',
    desc: 'Give loans against jewellery. Track principal and interest. Customer photos on bill.',
    icon: '💍',
  },
];

const plans = [
  {
    name: 'Basic',
    price: '₹199',
    features: ['Estimate billing', 'Actual billing', 'Gold rate log'],
    missing: ['Stock distribution', 'Gold loans'],
    popular: false,
  },
  {
    name: 'Pro',
    price: '₹499',
    features: ['Everything in Basic', 'Stock distribution', 'Touch calculation', 'Customer history'],
    missing: ['Gold loans'],
    popular: true,
  },
  {
    name: 'Premium',
    price: '₹999',
    features: ['Everything in Pro', 'Gold loans', 'Loan photos', 'Data export', 'Priority support'],
    missing: [],
    popular: false,
  },
];

const steps = [
  { num: '1', title: 'Register shop', desc: 'Create account with shop details' },
  { num: '2', title: 'Set gold rate', desc: 'Enter today\'s 22K and 18K rate' },
  { num: '3', title: 'Start billing', desc: 'Create estimates and actual bills' },
  { num: '4', title: 'Track everything', desc: 'Stock, loans, customers in one place' },
];



export default function LandingPAge(){


  return(
    <main className="min-h-screen bg-page-bg">

      {/* {Navebar} */}
        <nav className="bg-sidebar-dark px-6 md:px-16  py-4 flex items-center justify-between">
          <div className="text-gold-text font-medium text-lg">
              JewelTrack
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
            <Button variant="ghost" className="text-muted-foreground hover:text-gold-text text-sm">
              Login
            </Button>            
            </Link>
            <Link href={"/register"} >
              <Button className=" bg-gold hover:bg-gold/90 text-white text-sm">
                Get started free
              </Button>
              </Link>
          </div>
        </nav>

        {/* Hero */}
        <section className="bg-sidebar-dark px-6 md:px-16 py-20 text-center">
          <div className="inline-block bg-sidebar-active text-gold-text text-xs px-4 py-1.5 rounded-full border border-gold/20 mb-6">
            Made for Indian jewellery shops
          </div>

          <h1 className="text-4xl md:text-5xl font-medium text-gold-text leading-tight mb-5 max-w-2xl mx-auto  ">
            Run your jewellery shop smarter, not harder
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
             JewelTrack handles billing, stock distribution, gold loans, and karigar tracking — all in one place. Built for how you actually work.
          </p>

          <div className=" flex gap-3 justify-center  flex-wrap">
            <Link href={'/register'}>
            <Button className="bg-gold cursor-pointer hover:bg-gold/90 text-white px-8 py-5">
              Start free trail
            </Button>
            </Link>

            <Link href={'/login'}>
            <Button variant={"outline"} className="border-gold/30 text-gold cursor-pointer hover:bg-sidebar-active px-8 py-5">
               Login to your shop
            </Button>
            </Link>

          </div>

        </section>

        {/* Sattus bar */}
        <div className="bg-sidebar-active px-6 md:px-16 py-6 flex justify-center gap-12 flex-wrap border-y border-gold/10">
          {[
          { num: '4', label: 'Core modules' },
          { num: '916 & 18K', label: 'Touch calculation' },
          { num: 'Metal ledger', label: 'Stock settlements' },
          { num: 'Instant', label: 'Estimate billing' },
          ].map((s)=>(
            <div key={s.label} className="text-center">
              <div className="text-gold-text font-medium text-lg">{s.num}</div>
              <div className="text-muted-foreground text-xs mt-1">{s.label}</div>
            </div>
          ))

          }
        </div>

          {/* Features */} v
          <section className="px-6 md:px-16 py-16">
            <h2 className=" text-2xl font-medium text-foreground text-center mb-2"> Everything your shop needs</h2>
            <p className="text-sm text-muted-foreground text-center mb-10">
                Purpose-built for jewellery — not a generic billing app
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto">
               {features.map((f) => (
            <div key={f.title} className="bg-white border border-gold rounded-xl p-6">
              <div className="w-10 h-10 bg-gold-light rounded-lg flex items-center justify-center text-lg mb-4">
                {f.icon}
              </div>
              <h3 className="font-medium text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}

            </div>
          </section>

          {/* How it works */}
      <section className="bg-white px-6 md:px-16 py-16">
        <h2 className="text-2xl font-medium text-foreground text-center mb-2">
          How it works
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-12">
          Up and running in minutes
        </p>
        <div className="flex flex-col md:flex-row items-start justify-center gap-6 max-w-3xl mx-auto">
          {steps.map((step, i) => (
            <div key={step.num} className="flex md:flex-col items-center md:items-center gap-4 md:gap-3 flex-1">
              <div className="w-10 h-10 rounded-full bg-sidebar-dark text-gold-text flex items-center justify-center font-medium text-sm flex-shrink-0">
                {step.num}
              </div>
              <div className="md:text-center">
                <div className="font-medium text-foreground text-sm mb-1">{step.title}</div>
                <div className="text-xs text-muted-foreground">{step.desc}</div>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden md:block text-gold text-xl mx-2">→</div>
              )}
            </div>
          ))}
        </div>
      </section>


       {/* Pricing */}
      <section className="px-6 md:px-16 py-16">
        <h2 className="text-2xl font-medium text-foreground text-center mb-2">
          Simple pricing
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-10">
          Start free, upgrade when you need more
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-3xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl p-6 border ${plan.popular
                ? 'border-gold bg-white shadow-sm'
                : 'border-border bg-page'}`}
            >
              {plan.popular && (
                <div className="bg-gold-light text-gold-dark text-xs px-3 py-1 rounded-full inline-block mb-3 font-medium">
                  Most popular
                </div>
              )}

              <div className="font-medium text-foreground mb-1">{plan.name}</div>
              <div className="text-3xl font-medium text-gold mb-1">{plan.price}</div>
              <div className="text-xs text-muted-foreground mb-5">per month</div>
              <div className="flex flex-col gap-2 text-sm mb-6">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-foreground">
                    <span className="text-gold">✓</span> {f}
                  </div>
                ))}
                {plan.missing.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-muted-foreground">
                    <span className="text-border">✗</span> {f}
                  </div>
                ))}
              </div>
              <Link href="/register">
                <Button
                  className={`w-full ${plan.popular
                    ? 'bg-gold hover:bg-gold/90 text-white'
                    : 'border-gold text-gold bg-transparent hover:bg-gold-light'}`}
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  Get started
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </section>

         {/* CTA */}
      <section className="bg-sidebar-dark px-6 md:px-16 py-16 text-center">
        <h2 className="text-2xl font-medium text-gold-text mb-3">
          Ready to modernise your shop?
        </h2>
        <p className="text-sm text-muted-foreground mb-8">
          Join jewellery shops across Tamil Nadu already using JewelTrack
        </p>
        <Link href="/register">
          <Button className="bg-gold hover:bg-gold/90 text-white px-10 py-5">
            Start your free trial
          </Button>
        </Link>
      </section>

          {/* Footer */}
      <footer className="bg-sidebar-dark border-t border-gold/10 px-6 md:px-16 py-6 flex items-center justify-between flex-wrap gap-4">
        <div className="text-gold-text font-medium">JewelTrack</div>
        <div className="text-xs text-muted-foreground">
          Built for Indian jewellery shops · 2026
        </div>
      </footer>









    </main>
  )
}


