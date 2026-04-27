import Header from "@/components/Header";
import PortfolioCarousel from "@/components/PortfolioCarousel";
import {
  DownloadIcon,
  MailIcon,
  LinkedInIcon,
  ExternalLinkIcon,
} from "@/components/Icons";

const RESUME_PDF_PATH = "/Cisero_cv_2026.pdf";
const PORTFOLIO_PDF_PATH = "/Cisero_Portfolio_2026_v1_lowres.pdf";

const SECTION_LABEL =
  "text-[14px] font-medium tracking-[0.84px] uppercase text-[#1f1b16]";

const experience = [
  {
    company: "frog design",
    role: "Executive Director of Strategic Design",
    location: "New York, NY / Milan, Italy",
    dates: "Mar 2015 – Present",
    current: true,
    bullets: [
      "Lead multidisciplinary teams through high-stakes growth strategy and product design for F500 clients.",
      "Ship 0-to-1 products: structure ambiguity, find the breakthrough insight, and carry strategy through to market.",
      "Head of Strategy for frog North America, growing a team of 25 strategists and evolving our op model.",
      "Full-stack AI builder, shipping production-quality product with modern AI pipelines.",
      "Launched 20+ new products, built 4 net-new businesses, and contributed to over $100M in value creation.",
    ],
  },
  {
    company: "NYU",
    role: "Adjunct Professor — Design Strategies",
    location: "New York, NY",
    dates: "Jan 2021 – Present",
    bullets: [
      "Teach engineering and design students how to integrate design vision into high-impact business strategy.",
    ],
  },
  {
    company: "Amazon",
    role: "Vendor Manager (MBA Internship)",
    location: "Milan, Italy",
    dates: "Jun – Dec 2014",
    bullets: [
      "Designed strategy to accelerate growth of new retail category, driving 2x revenue and a 500-point margin increase.",
    ],
  },
];

const keyProjects = [
  {
    title: "Digital Growth & Product Strategy",
    client: "U.S. Healthcare System",
    bullets: [
      "Defined a digital growth strategy that unlocked a multi-year investment commitment from the board.",
      "Launched 3 new digital health products including a postpartum telehealth subscription and a healthspan platform.",
      "Hoag Nona (postpartum product) has driven 60% adoption among new mothers and ~$10M LTV uplift.",
    ],
  },
  {
    title: "Platform Growth Strategy",
    client: "Deliveroo",
    bullets: [
      "Increased rider retention and market share through a rider kit redesign.",
      "Rolled out across 180k riders globally; supported revenue growth from £700M to £2.2B between 2019–2023.",
      "Led multi-method research and product vision, including a custom experiment to quantify growth projections.",
    ],
  },
  {
    title: "Full-Stack AI Product Builds",
    client: "Multiple Clients & Personal Projects",
    bullets: [
      "Walmart Hybrid Personas: “live” agentic personas that react to market signals every day to identify new opportunities.",
      "Living Research Model: cognitive system that converts insights into a live knowledge layer for strategy decisions.",
      "Keystone (personal): structured AI context engine for personal finance management.",
    ],
  },
];

const education = [
  {
    school: "SDA Bocconi",
    degree: "MBA — Strategy & Innovation focus",
    location: "Milan, Italy",
    year: "2013 – 2014",
  },
  {
    school: "University of Maryland",
    degree: "B.A. International Economics",
    location: "College Park, MD",
    year: "2005 – 2009",
  },
];

const skillCategories = [
  {
    label: "Core",
    items: [
      "Product Design",
      "Strategic Game Boarding",
      "Design Research",
      "Quant Methods",
      "Segmentation",
    ],
  },
  {
    label: "AI",
    items: [
      "Agentic Coding Systems",
      "Design in Code",
      "Prototyping",
      "RAG Architecture",
      "Cognitive System Design",
    ],
  },
];

export default function AboutPage() {
  return (
    <div
      className="relative min-h-screen flex flex-col about-gradient"
    >
      <Header />

      <main className="flex-1 mx-auto w-full max-w-[760px] px-6 pt-28 pb-24">
        {/* Intro */}
        <section>
          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/craig-portrait.png"
              alt="Illustrated portrait of Craig Cisero"
              width={160}
              height={160}
              className="w-40 h-40 rounded-full object-cover"
            />
          </div>

          <p className="mt-12 font-light text-[22px] leading-[1.65] tracking-[-0.22px] text-[#1f1b16]">
            I&apos;m a strategic design leader focused on building the next
            generation of AI-native products and cognitive systems. By day,
            I&apos;m Executive Director of Strategic Design at frog design. By
            night, I teach Design Strategies as an adjunct at NYU and build
            cognitive systems like this one.
          </p>

          <p className="mt-6 text-[17px] leading-[1.65] text-[rgba(31,27,22,0.6)]">
            For 11 years at frog I&apos;ve led multi-disciplinary teams through
            high-stakes product innovation challenges for Fortune 500 companies
            across a wide range of industries. Over the past year, my role has
            shifted to working almost exclusively on AI product design, with a
            focus on cognitive and agentic systems. That&apos;s required me to
            step back into a player-coach mode: leading creative exploration
            with the new mediums while still fulfilling senior management duties.
          </p>

          <p className="mt-6 text-[17px] leading-[1.65] text-[rgba(31,27,22,0.6)]">
            My core thesis is that cognitive systems (i.e. the systems of
            structured knowledge, data, and reasoning frameworks that enable
            high quality agentic experiences) will drive the next wave of
            growth and product innovation. This RAG Resume is itself a
            cognitive system, designed to demonstrate that thesis firsthand.
          </p>
        </section>

        {/* What I'm looking for */}
        <section className="mt-16">
          <h2 className={SECTION_LABEL}>What I&apos;m looking for next</h2>
          <div className="mt-5 space-y-5">
            <p className="text-[17px] leading-[1.65] text-[rgba(31,27,22,0.6)]">
              I am looking for a role where I can design AI systems that
              amplify human agency and improve the human experience.
            </p>
            <p className="text-[17px] leading-[1.65] text-[rgba(31,27,22,0.6)]">
              I believe all leaders need to be hands on with the new AI
              mediums and tools in order to effectively drive teams and create
              value. I am aiming to find a player-coach role where I can get
              hands on as a full-stack AI product builder while still
              leveraging 12+ years of strategic leadership experience to lead
              teams when necessary.
            </p>
            <p className="text-[17px] leading-[1.65] text-[rgba(31,27,22,0.6)]">
              I&apos;m seeking both principal and director roles, as long as
              they empower building alongside leadership.
            </p>
          </div>
        </section>

        {/* Divider */}
        <div className="mt-16 border-t border-[rgba(31,27,22,0.08)]" />

        {/* Portfolio */}
        <section id="portfolio" className="mt-12 scroll-mt-32">
          <div className="flex items-center justify-between">
            <h2 className={SECTION_LABEL}>Portfolio</h2>
            <a
              href={PORTFOLIO_PDF_PATH}
              download
              className="inline-flex items-center gap-2 h-9 px-4 rounded-full border border-[rgba(31,27,22,0.1)] text-[13px] font-medium text-[rgba(31,27,22,0.6)] hover:text-[#1f1b16] hover:border-[rgba(31,27,22,0.2)] transition-colors"
            >
              <DownloadIcon />
              Download PDF
            </a>
          </div>
          <p className="mt-5 text-[15px] leading-[1.6] text-[rgba(31,27,22,0.5)]">
            A visual selection of recent work. Click any page to flip through full-size, or download the full PDF.
          </p>
          <div className="mt-8">
            <PortfolioCarousel />
          </div>
        </section>

        {/* Resume */}
        <section className="mt-16">
          <div className="flex items-center justify-between">
            <h2 className={SECTION_LABEL}>Resume</h2>
            <a
              href={RESUME_PDF_PATH}
              download
              className="inline-flex items-center gap-2 h-9 px-4 rounded-full border border-[rgba(31,27,22,0.1)] text-[13px] font-medium text-[rgba(31,27,22,0.6)] hover:text-[#1f1b16] hover:border-[rgba(31,27,22,0.2)] transition-colors"
            >
              <DownloadIcon />
              Download PDF
            </a>
          </div>

          <div className="mt-8 bg-white rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.04)] px-14 py-14">
            <div className="pb-5 border-b border-[rgba(31,27,22,0.06)]">
              <h1 className="font-display font-thin text-[36px] tracking-[-0.72px] text-[#1f1b16]">
                Craig Cisero
              </h1>
              <p className="mt-1 text-[15px] text-[rgba(31,27,22,0.5)]">
                Executive Director of Strategic Design · frog design · Brooklyn, NY
              </p>
            </div>

            {/* Summary */}
            <p className="mt-8 text-[14px] leading-[1.65] text-[rgba(31,27,22,0.7)]">
              Strategic design leader with 12 years of experience designing
              products and growth strategies. I&apos;m currently focused on
              designing the next generation of AI-native products and cognitive
              systems. I think in systems, I build things, and I&apos;m most
              energized when I&apos;m converting abstract complexity into
              something actionable.
            </p>

            {/* Experience */}
            <div className="mt-10">
              <h3 className="text-[13px] font-semibold tracking-[0.78px] uppercase text-[#1f1b16]">
                Professional Experience
              </h3>
              <div className="mt-6 flex flex-col gap-6">
                {experience.map((job, i) => (
                  <div
                    key={i}
                    className="relative pl-5 border-l border-[rgba(31,27,22,0.08)]"
                  >
                    {job.current && (
                      <span className="absolute -left-[5px] top-2 w-2 h-2 rounded-full bg-[#b5703f]" />
                    )}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <p className="text-[15px] font-semibold text-[#1f1b16]">
                          {job.company}
                        </p>
                        {job.current && (
                          <span className="px-2 py-[2px] rounded text-[10px] font-semibold tracking-[0.25px] uppercase bg-[rgba(181,112,63,0.1)] text-[#b5703f]">
                            Present
                          </span>
                        )}
                      </div>
                      <p className="shrink-0 text-[13px] text-[rgba(31,27,22,0.4)]">
                        {job.dates}
                      </p>
                    </div>
                    <div className="mt-1 flex items-baseline justify-between gap-4">
                      <p className="text-[14px] text-[rgba(31,27,22,0.5)]">
                        {job.role}
                      </p>
                      <p className="shrink-0 text-[12px] text-[rgba(31,27,22,0.4)]">
                        {job.location}
                      </p>
                    </div>
                    <ul className="mt-3 space-y-1.5">
                      {job.bullets.map((b, j) => (
                        <li
                          key={j}
                          className="relative pl-4 text-[14px] leading-[1.55] text-[rgba(31,27,22,0.6)]"
                        >
                          <span className="absolute left-0 top-[10px] w-1 h-1 rounded-full bg-[rgba(31,27,22,0.2)]" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Projects */}
            <div className="mt-12">
              <h3 className="text-[13px] font-semibold tracking-[0.78px] uppercase text-[#1f1b16]">
                Key Projects
              </h3>
              <div className="mt-6 flex flex-col gap-6">
                {keyProjects.map((proj, i) => (
                  <div
                    key={i}
                    className="relative pl-5 border-l border-[rgba(31,27,22,0.08)]"
                  >
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <p className="text-[15px] font-semibold text-[#1f1b16]">
                        {proj.title}
                      </p>
                      <span className="text-[13px] text-[rgba(31,27,22,0.4)]">
                        | {proj.client}
                      </span>
                    </div>
                    <ul className="mt-3 space-y-1.5">
                      {proj.bullets.map((b, j) => (
                        <li
                          key={j}
                          className="relative pl-4 text-[14px] leading-[1.55] text-[rgba(31,27,22,0.6)]"
                        >
                          <span className="absolute left-0 top-[10px] w-1 h-1 rounded-full bg-[rgba(31,27,22,0.2)]" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Education */}
            <div className="mt-12">
              <h3 className="text-[13px] font-semibold tracking-[0.78px] uppercase text-[#1f1b16]">
                Education
              </h3>
              <div className="mt-5 flex flex-col gap-3">
                {education.map((edu) => (
                  <div
                    key={edu.school}
                    className="flex items-start justify-between gap-4"
                  >
                    <div>
                      <p className="text-[15px] font-semibold text-[#1f1b16]">
                        {edu.school}
                      </p>
                      <p className="mt-1 text-[14px] text-[rgba(31,27,22,0.5)]">
                        {edu.degree}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[13px] text-[rgba(31,27,22,0.5)]">
                        {edu.location}
                      </p>
                      <p className="mt-0.5 text-[13px] text-[rgba(31,27,22,0.4)]">
                        {edu.year}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div className="mt-12">
              <h3 className="text-[13px] font-semibold tracking-[0.78px] uppercase text-[#1f1b16]">
                Additional Skills
              </h3>
              <div className="mt-5 flex flex-col gap-4">
                {skillCategories.map((cat) => (
                  <div key={cat.label} className="flex flex-col gap-2">
                    <p className="text-[12px] font-semibold tracking-[0.4px] uppercase text-[rgba(31,27,22,0.45)]">
                      {cat.label}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {cat.items.map((skill) => (
                        <span
                          key={skill}
                          className="px-3 py-1.5 rounded-full bg-[rgba(31,27,22,0.03)] border border-[rgba(31,27,22,0.06)] text-[13px] text-[rgba(31,27,22,0.6)]"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Get in touch */}
        <section className="mt-16 pt-12 border-t border-[rgba(31,27,22,0.08)]">
          <h2 className={SECTION_LABEL}>Get in touch</h2>
          <p className="mt-4 text-[17px] leading-[1.6] text-[rgba(31,27,22,0.5)]">
            Interested in working together, or just want to talk shop? I&apos;d
            love to hear from you.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="mailto:craig@ciserodesign.co"
              className="inline-flex items-center gap-3 h-[46px] pl-5 pr-6 rounded-full bg-[#1f1b16] text-[#faf7f2] text-[14px] font-medium hover:bg-[#2e2920] transition-colors"
            >
              <MailIcon />
              craig@ciserodesign.co
            </a>
            <a
              href="https://www.linkedin.com/in/craigcisero/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 h-[46px] pl-5 pr-5 rounded-full border border-[rgba(31,27,22,0.1)] text-[14px] font-medium text-[rgba(31,27,22,0.7)] hover:text-[#1f1b16] hover:border-[rgba(31,27,22,0.2)] transition-colors"
            >
              <LinkedInIcon />
              LinkedIn
              <ExternalLinkIcon className="opacity-50" />
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
