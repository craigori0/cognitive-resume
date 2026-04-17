import Header from "@/components/Header";
import {
  DownloadIcon,
  MailIcon,
  LinkedInIcon,
  ExternalLinkIcon,
} from "@/components/Icons";

const SECTION_LABEL =
  "text-[14px] font-medium tracking-[0.84px] uppercase text-[#1f1b16]";

const experience = [
  {
    company: "frog design",
    role: "Executive Director, Design Strategy",
    dates: "2015 – Present",
    current: true,
    bullets: [
      "Lead multi-disciplinary teams on high-stakes product, growth, and innovation challenges for Fortune 500 clients across healthcare, fintech, food delivery, and government.",
      "Now working almost exclusively on AI product design, with a focus on cognitive and agentic systems — operating in a player-coach mode that pairs hands-on building with executive leadership.",
      "Started as a strategist 11 years ago and grew into the executive director role leading frog's product strategy practice.",
    ],
  },
  {
    company: "NYU",
    role: "Adjunct Professor, Design Strategies",
    dates: "2021 – Present",
    bullets: [
      "Teach undergraduates how to combine design and business frameworks to convert human insights into high-impact product and growth strategy. 5 years in the role.",
    ],
  },
  {
    company: "Amazon",
    role: "Vendor Manager, Books — Milan",
    dates: "2014",
    bullets: [
      "Designed strategy to accelerate growth of a new retail category, driving 2x revenue and a 500-point margin increase.",
    ],
  },
  {
    company: "Pre-MBA — Software Project Management",
    role: "Healthcare IT & Executive Search SaaS",
    dates: "2009 – 2012",
    bullets: [
      "Led a major EHR transformation for a healthcare organization, designing and delivering training and change management across 100 field offices.",
      "Project-managed CRM strategy, data readiness, and process design for a software company in the executive search industry.",
    ],
  },
];

const education = [
  {
    school: "SDA Bocconi",
    degree: "MBA · Milan",
    year: "2014",
  },
  {
    school: "University of Maryland, College Park",
    degree: "BA, International Economics (Literature minor)",
    year: "2009",
  },
];

const skills = [
  "AI Product Design",
  "Cognitive & Agentic Systems",
  "Design Strategy",
  "Product & Growth Strategy",
  "Qualitative Research",
  "Researching Fast & Slow",
  "Workshop Facilitation",
  "Stakeholder Management",
  "Healthcare, Fintech & Gov Domains",
  "Team Leadership & Mentoring",
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
            I&apos;m Executive Director of Design Strategy at frog design. By
            night, I teach Design Strategies as an adjunct at NYU and build
            cognitive systems like this one.
          </p>

          <p className="mt-6 text-[17px] leading-[1.65] text-[rgba(31,27,22,0.6)]">
            For 11 years at frog I&apos;ve led multi-disciplinary teams through
            high-stakes product and innovation challenges for Fortune 500
            companies across healthcare, fintech, food delivery, and government.
            Over the past year, the AI boom has shifted my role significantly
            — I&apos;m now working almost exclusively on AI product design, with
            a focus on cognitive and agentic systems. That&apos;s required me
            to step back into a player-coach mode: leading creative exploration
            with the new mediums while still fulfilling senior management
            duties.
          </p>

          <p className="mt-6 text-[17px] leading-[1.65] text-[rgba(31,27,22,0.6)]">
            My core thesis is that cognitive systems — software that maintains
            structured knowledge and reasons over it — will drive the next
            wave of product innovation. This RAG Resume is itself a cognitive
            system, designed to demonstrate that thesis firsthand.
          </p>
        </section>

        {/* What I'm looking for */}
        <section className="mt-16">
          <h2 className={SECTION_LABEL}>What I&apos;m looking for next</h2>
          <div className="mt-5 space-y-5">
            <p className="text-[17px] leading-[1.65] text-[rgba(31,27,22,0.6)]">
              I&apos;m focused on designing and building AI products that
              improve the human experience. I want a player-coach role where I
              can be hands-on with exploration, design, and build — with a
              special focus on cognitive and agentic systems — while still
              leveraging 12 years of strategic leadership experience to lead
              teams when necessary.
            </p>
            <p className="text-[17px] leading-[1.65] text-[rgba(31,27,22,0.6)]">
              I&apos;m open to both principal and director roles, as long as
              they empower building alongside leadership.
            </p>
          </div>
        </section>

        {/* Divider */}
        <div className="mt-16 border-t border-[rgba(31,27,22,0.08)]" />

        {/* Resume */}
        <section className="mt-12">
          <div className="flex items-center justify-between">
            <h2 className={SECTION_LABEL}>Resume</h2>
            <a
              href="/craig-cisero-resume.pdf"
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
                Executive Director, Design Strategy · frog design · Brooklyn, NY
              </p>
            </div>

            {/* Experience */}
            <div className="mt-10">
              <h3 className="text-[13px] font-semibold tracking-[0.78px] uppercase text-[#1f1b16]">
                Experience
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
                    <p className="mt-1 text-[14px] text-[rgba(31,27,22,0.5)]">
                      {job.role}
                    </p>
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
                    <p className="text-[13px] text-[rgba(31,27,22,0.4)] pt-1">
                      {edu.year}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div className="mt-12">
              <h3 className="text-[13px] font-semibold tracking-[0.78px] uppercase text-[#1f1b16]">
                Skills &amp; Expertise
              </h3>
              <div className="mt-5 flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1.5 rounded-full bg-[rgba(31,27,22,0.03)] border border-[rgba(31,27,22,0.06)] text-[13px] text-[rgba(31,27,22,0.6)]"
                  >
                    {skill}
                  </span>
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
              href="mailto:craig.cisero@gmail.com"
              className="inline-flex items-center gap-3 h-[46px] pl-5 pr-6 rounded-full bg-[#1f1b16] text-[#faf7f2] text-[14px] font-medium hover:bg-[#2e2920] transition-colors"
            >
              <MailIcon />
              craig.cisero@gmail.com
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
