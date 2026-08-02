import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDb } from "@/lib/db";
import { BarChart3, TrendingUp, Search, Shield, ArrowRight, Truck, Database } from "lucide-react";

const METRICS = [
  { label: "Collision", desc: "Claim cost index for collision coverage" },
  { label: "Comp", desc: "Comprehensive claim cost index (incl. theft)" },
  { label: "DCPD", desc: "Direct Compensation Property Damage index" },
  { label: "AB", desc: "Accident Benefits personal injury index" },
  { label: "Theft", desc: "Theft-related claim frequency index" },
];

function getLandingStats() {
  const db = getDb();
  const total = db.prepare("SELECT COUNT(*) as c FROM insurance_rates").all() as { c: number }[];
  const makes = db.prepare("SELECT COUNT(DISTINCT make) as c FROM insurance_rates").all() as { c: number }[];
  const years = db.prepare("SELECT MIN(model_year) as mn, MAX(model_year) as mx FROM insurance_rates").all() as { mn: number; mx: number }[];
  return {
    total: total[0].c,
    makes: makes[0].c,
    minYear: years[0].mn,
    maxYear: years[0].mx,
  };
}

export default function LandingPage() {
  const stats = getLandingStats();

  return (
    <div className="min-h-screen">
      {/* ────── Navigation Bar ────── */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
          <div className="flex items-center gap-2 font-semibold text-lg">
            <BarChart3 className="h-6 w-6 text-primary" />
            <span>HCMU Explorer</span>
          </div>
        </div>
      </header>

      <main>
        {/* ────── Hero Section ────── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
            <div className="max-w-3xl">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight">
                How Cars{" "}
                <span className="text-primary">Measure Up</span>
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
                Explore Canada&apos;s national vehicle insurance rate indexes. Compare claim costs
                across <strong>{stats.makes} makes</strong>, <strong>{stats.total.toLocaleString()} vehicles</strong>,
                and model years <strong>{stats.minYear}–{stats.maxYear}</strong> — all from the
                Insurance Bureau of Canada&apos;s authoritative dataset.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/explore">
                  <Button size="lg" className="gap-2">
                    Explore the Data <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/explore/browse">
                  <Button size="lg" variant="outline" className="gap-2">
                    Browse Vehicles
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          {/* Decorative gradient blob */}
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        </section>

        {/* ────── Stats Bar ────── */}
        <section className="border-y bg-muted/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <p className="text-3xl sm:text-4xl font-bold">{stats.total.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground mt-1">Vehicle Models</p>
              </div>
              <div>
                <p className="text-3xl sm:text-4xl font-bold">{stats.makes}</p>
                <p className="text-sm text-muted-foreground mt-1">Manufacturers</p>
              </div>
              <div>
                <p className="text-3xl sm:text-4xl font-bold">{stats.minYear}–{stats.maxYear}</p>
                <p className="text-sm text-muted-foreground mt-1">Model Years</p>
              </div>
              <div>
                <p className="text-3xl sm:text-4xl font-bold">5</p>
                <p className="text-sm text-muted-foreground mt-1">Insurance Metrics</p>
              </div>
            </div>
          </div>
        </section>

        {/* ────── What Is HCMU ────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">What is &ldquo;How Cars Measure Up&rdquo;?</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Published annually by the <strong>Insurance Bureau of Canada (IBC)</strong>, the
                HCMU dataset provides relative claim cost indexes for virtually every vehicle sold
                in Canada. These indexes help insurers, analysts, and consumers understand how
                different vehicles compare in terms of insurance claim costs.
              </p>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                All indexes are relative to <strong>100 (the average)</strong>. A score of 122
                means 22% above average claim costs; 87 means 13% below average.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {["Collision", "Comp", "DCPD", "AB", "Theft"].map((m) => (
                  <span key={m} className="bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full">
                    {m}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <Shield className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold">Collision &amp; Comp</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Damage to your vehicle from collisions and non-collision incidents (theft, vandalism, weather).
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <TrendingUp className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold">DCPD &amp; AB</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Direct Compensation Property Damage and Accident Benefits — key coverages in Canada&apos;s auto insurance system.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <Search className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold">Theft Frequency</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Relative frequency of theft claims, from the most-stolen to least-stolen vehicles.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <Truck className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold">By Body Style</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Compare SUVs, sedans, pickup trucks, vans, and wagons across all metrics.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* ────── Metric Descriptions ────── */}
        <section className="bg-muted/40 border-y">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <h2 className="text-3xl font-bold tracking-tight text-center mb-12">The Five Metrics</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {METRICS.map((m) => (
                <Card key={m.label} className="text-center">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-primary mb-2">{m.label}</div>
                    <p className="text-sm text-muted-foreground">{m.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ────── Features ────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <h2 className="text-3xl font-bold tracking-tight text-center mb-4">Explore the Data Your Way</h2>
          <p className="text-muted-foreground text-center max-w-xl mx-auto mb-12">
            Four interactive views into Canada&apos;s vehicle insurance rate landscape
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg">📊 Overview</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Key stats, average indexes across all metrics, body-style distribution, and top theft vehicles.
                </p>
                <Link href="/explore" className="text-sm font-medium text-primary mt-3 inline-flex items-center gap-1 hover:underline">
                  View overview <ArrowRight className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg">🔍 Browse</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Filter by make, body style, and power type. Sort by any metric. Pagination for easy browsing.
                </p>
                <Link href="/explore/browse" className="text-sm font-medium text-primary mt-3 inline-flex items-center gap-1 hover:underline">
                  Browse data <ArrowRight className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg">🏭 By Make</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Horizontal bar charts comparing manufacturers. Toggle metrics and top-N with a full data table.
                </p>
                <Link href="/explore/by-make" className="text-sm font-medium text-primary mt-3 inline-flex items-center gap-1 hover:underline">
                  Compare makes <ArrowRight className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg">📈 Trends</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Multi-series line charts showing how indexes have changed across model years from 1997 to 2025.
                </p>
                <Link href="/explore/trends" className="text-sm font-medium text-primary mt-3 inline-flex items-center gap-1 hover:underline">
                  View trends <ArrowRight className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ────── Blog Section ────── */}
        <section className="bg-muted/40 border-y">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Latest Updates</h2>
                <p className="text-muted-foreground mt-1">Insights and analysis from the HCMU dataset</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  title: "The HCMU Dataset: A National View",
                  excerpt: "Understanding how the Insurance Bureau of Canada compiles relative claim cost indexes for vehicles across Canada.",
                  date: "Coming soon",
                },
                {
                  title: "Top 10 Most Stolen Vehicles in Canada",
                  excerpt: "Which vehicles top the theft frequency index? The results may surprise you.",
                  date: "Coming soon",
                },
                {
                  title: "EV vs Gas: Insurance Cost Trends",
                  excerpt: "How do battery electric vehicles compare to traditional gasoline-powered cars across all five insurance metrics?",
                  date: "Coming soon",
                },
              ].map((post) => (
                <Card key={post.title} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <p className="text-xs text-muted-foreground mb-2">{post.date}</p>
                    <h3 className="font-semibold">{post.title}</h3>
                    <p className="text-sm text-muted-foreground mt-2">{post.excerpt}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ────── CTA ────── */}
        <section className="bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
            <h2 className="text-3xl font-bold tracking-tight">Ready to Explore?</h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Dive into {stats.total.toLocaleString()} vehicle records spanning {stats.minYear}–{stats.maxYear}.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href="/explore">
                <Button size="lg" className="gap-2">
                  Open Dashboard <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/explore/browse">
                <Button size="lg" variant="outline">
                  Start Browsing
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ────── Footer ────── */}
      <footer className="border-t bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <BarChart3 className="h-4 w-4" />
            HCMU Explorer
          </div>
          <p>
            Data source:{" "}
            <a
              href="https://www.ibc.ca/insurance-basics/auto/how-cars-measure-up"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              Insurance Bureau of Canada — How Cars Measure Up
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}