import { useEffect, useRef, useState } from 'react'
import { process, productSites, projects, services, skills, type ProductSite, type Project } from './data'

const Arrow = () => <svg aria-hidden="true" viewBox="0 0 20 20"><path d="M4 10h11M11 5l5 5-5 5" /></svg>
const Expand = () => <svg aria-hidden="true" viewBox="0 0 20 20"><path d="M7 3H3v4M13 3h4v4M7 17H3v-4M13 17h4v-4" /></svg>

function EmailLink({ children, className = '', preview = false }: { children: React.ReactNode; className?: string; preview?: boolean }) {
  const parts = ['reidklassen', 'gmail', 'com']
  const openEmail = () => {
    const rawSource = new URLSearchParams(window.location.search).get('src') ?? ''
    const source = rawSource.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32) || 'direct'
    const subject = preview ? `Free app preview · ${source}` : `Project brief · ${source}`
    const body = (preview ? [
      'What should the app help you do?',
      '',
      'Where should it run (iPhone, Android, or desktop)?',
      '',
      'What should the preview screen show?',
    ] : [
      'What should it do?',
      '',
      'Where should it run?',
      '',
      'What would make it useful?',
    ]).join('\n')
    window.location.href = `mailto:${parts[0]}@${parts[1]}.${parts[2]}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }
  return <button className={className} type="button" onClick={openEmail}>{children}</button>
}

function Lightbox({ project, close }: { project: Project; close: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    document.body.classList.add('modal-open')
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.classList.remove('modal-open'); window.removeEventListener('keydown', onKey); previous?.focus() }
  }, [close])
  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={`${project.title} screenshot`} onMouseDown={(e) => { if (e.target === e.currentTarget) close() }}>
      <button ref={closeRef} className="lightbox-close" onClick={close} aria-label="Close screenshot">Close <span>×</span></button>
      <div className="lightbox-frame"><img src={project.image} alt={project.alt} /><p><span>{project.index}</span>{project.title}</p></div>
    </div>
  )
}

function ProductEmail({ site, className = '' }: { site: ProductSite; className?: string }) {
  const parts = ['reidklassen', 'gmail', 'com']
  const openEmail = () => {
    const rawSource = new URLSearchParams(window.location.search).get('src') ?? ''
    const source = rawSource.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32) || site.source
    const subject = `${site.name} pilot · ${source}`
    const body = [
      'What workflow should this fix?',
      '',
      'What sample files, device, or batch can you provide?',
      '',
      'What would prove the pilot worked?',
    ].join('\n')
    window.location.href = `mailto:${parts[0]}@${parts[1]}.${parts[2]}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }
  return <button className={className} type="button" onClick={openEmail}>{site.cta} <Arrow /></button>
}

function ProductSitePage({ site }: { site: ProductSite }) {
  const isIndependentHost = window.location.hostname.split('.')[0] === site.slug
  const homeHref = isIndependentHost ? '/' : `/${site.slug}/`
  const visualClass = site.theme === 'ledger' ? 'product-visual ledger-visual' : 'product-visual'
  return (
    <main className={`product-site ${site.theme}`}>
      <section className="product-hero">
        <nav className="product-nav" aria-label={`${site.name} navigation`}>
          <a href={homeHref} aria-label={`${site.name} home`}>{site.name}</a>
          <ProductEmail site={site} className="product-nav-cta" />
        </nav>
        <div className="product-copy">
          <p className="product-kicker">{site.proofLabel} · {site.offer}</p>
          <h1>{site.title}</h1>
          <p>{site.deck}</p>
          <ProductEmail site={site} className="product-primary" />
        </div>
        <div className={visualClass} aria-label={`${site.name} workflow illustration`}>
          {site.theme === 'ledger' ? (
            <>
              <div className="ledger-sheet" aria-hidden="true">
                <div className="ledger-header"><i /><i /><i /></div>
                <div className="ledger-row"><b>Date</b><b>Description</b><b className="lc-amt">Amount</b></div>
                <div className="ledger-row"><b>03/14</b><b>INV-2847 — Acme Corp</b><b className="lc-amt">$4,200.00</b></div>
                <div className="ledger-row"><b>03/14</b><b>INV-2847 — Acme Corp</b><b className="lc-amt">$4,200.00</b></div>
                <div className="ledger-row lc-dup"><b>03/15</b><b>Wire — Acme Holdings</b><b className="lc-amt">$4,200.00</b></div>
                <div className="ledger-row"><b>03/16</b><b>SUB-0912 — CloudHost</b><b className="lc-amt">-$189.00</b></div>
                <div className="ledger-row"><b>03/18</b><b>INV-2850 — Brightpath</b><b className="lc-amt">$1,750.00</b></div>
              </div>
              <div className="ledger-steps" aria-label="Workflow steps">
                {site.steps.map((step, index) => (
                  <div key={step} className="ledger-step">
                    <div className="step-num">{index + 1}</div>
                    <div className="step-label">{step}</div>
                    {index < site.steps.length - 1 && <div className="step-line" aria-hidden="true" />}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              {site.steps.map((step, index) => <span key={step} style={{ '--i': index } as React.CSSProperties}>{step}</span>)}
              <i />
            </>
          )}
        </div>
      </section>
      <section className="product-band">
        <article><span>Built for</span><p>{site.audience}</p></article>
        <article><span>Pilot offer</span><p>{site.offer}. Fixed written scope before payment.</p></article>
      </section>
      <section className="product-details">
        <div><p className="product-kicker">What the pilot proves</p><h2>One workflow. One acceptance test. No sprawling build.</h2></div>
        <ul>{site.bullets.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>
      <section className="product-limits">
        <p>Not included</p>
        <div>{site.exclusions.map((item) => <span key={item}>{item}</span>)}</div>
      </section>
      <footer className="product-footer">
        <span>{site.name}</span>
        <p>Built in Canada · Custom software</p>
        <a href={homeHref}>Back to {isIndependentHost ? 'portfolio' : 'home'} ↑</a>
      </footer>
    </main>
  )
}

function App() {
  const [activeProject, setActiveProject] = useState<Project | null>(null)
  const slug = window.location.pathname.split('/').filter(Boolean)[0]
  const hostSlug = window.location.hostname.split('.')[0]
  const productSite = productSites.find((site) => site.slug === slug || site.slug === hostSlug)
  if (productSite) return <ProductSitePage site={productSite} />

  return (
    <>
      <a className="skip-link" href="#work">Skip to selected work</a>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Reid, home"><span>R</span> Reid</a>
        <nav aria-label="Main navigation"><a href="#work">Work</a><a href="#services">Services</a><a href="#process">Process</a></nav>
        <EmailLink className="header-contact">Describe your task <Arrow /></EmailLink>
      </header>

      <main>
        <section className="hero" id="top">
          <picture className="hero-art" aria-hidden="true">
            <source srcSet="/media/generated/hero-workshop.avif" type="image/avif" />
            <source srcSet="/media/generated/hero-workshop.webp" type="image/webp" />
            <img src="/media/generated/hero-workshop.png" alt="" fetchPriority="high" />
          </picture>
          <div className="hero-grid" aria-hidden="true" />
          <div className="availability"><i /> Free custom app preview <span>No purchase required</span></div>
          <div className="hero-copy">
            <p className="kicker">Founding client pricing · First 5 paid projects</p>
            <h1>See your app.<br /><em>Before you build it.</em></h1>
            <p className="hero-deck">Tell me what your app should do. I’ll create a free custom preview image of its key screen, so you can see the direction before deciding whether to build. Phone and desktop app projects start at CAD $60.</p>
            <div className="offer-summary" aria-label="Founding client prices"><span><b>Phone app</b>From CAD $60</span><span><b>Desktop app</b>From CAD $60</span><span><b>MCU firmware</b>From CAD $40</span></div>
            <div className="hero-actions"><EmailLink className="button primary" preview>Get my free preview <Arrow /></EmailLink><a className="button secondary" href="#work">See what I’ve built</a></div>
          </div>
          <div className="hero-index" aria-hidden="true"><span>Selected work</span><b>↓</b></div>
        </section>

        <div className="skills" aria-label="Technical capabilities"><p>Tools &amp; capabilities</p><div>{skills.map((skill) => <span key={skill}>{skill}</span>)}</div></div>

        <section className="work section" id="work">
          <div className="section-heading"><p><span>01</span> Selected work</p><h2>Software with<br /><em>something to prove.</em></h2></div>
          <div className="project-list">
            {projects.map((project) => (
              <article className={`project ${project.tone}`} key={project.title}>
                <div className="project-copy"><p className="project-index">{project.index} / 03</p><div><p className="eyebrow">{project.eyebrow}</p><h3>{project.title}</h3><p className="description">{project.description}</p><ul aria-label="Technologies">{project.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul></div></div>
                <button className="project-media" onClick={() => setActiveProject(project)} aria-label={`Expand ${project.title} screenshot`}><img src={project.image} alt={project.alt} loading="lazy" /><span className="expand"><Expand /> Expand</span></button>
              </article>
            ))}
          </div>
        </section>

        <section className="security section" aria-labelledby="security-title">
          <div className="security-visual">
            <picture><source srcSet="/media/generated/securitycam-atmosphere.avif" type="image/avif" /><source srcSet="/media/generated/securitycam-atmosphere.webp" type="image/webp" /><img src="/media/generated/securitycam-atmosphere.png" alt="Abstract blue-hour home perimeter with a camera aperture motif" loading="lazy" /></picture>
            <div className="scanline" aria-hidden="true" /><p className="coming"><i /> In development</p>
            <figure className="security-proof"><img src="/media/projects/securitycam-coming-soon.webp" alt="Sanitized SecurityCam interface preview with natural-language search and archive playback" loading="lazy" /><figcaption>Working interface preview</figcaption></figure>
          </div>
          <div className="security-copy"><p className="eyebrow">Coming soon · Local vision</p><h2 id="security-title">Security<span>Cam</span></h2><p>A local-first camera archive that records USB and Wi-Fi cameras, searches observed moments in ordinary language, and opens the original footage with pre-roll context.</p><ul><li>Local-first archive</li><li>Natural-language search</li><li>Multi-camera locate</li></ul><div className="aperture" aria-hidden="true"><i /><i /><i /></div></div>
        </section>

        <section className="services section" id="services">
          <div className="section-heading compact"><p><span>02</span> Founding client offer</p><h2>Small price.<br />A <em>real custom build.</em></h2></div>
          <div className="service-list">{services.map((service) => <article key={service.title}><span>{service.number}</span><h3>{service.title}<small>{service.price}</small></h3><div className="service-details"><p>{service.body}</p><p className="starter-includes"><b>Starter includes</b>{service.includes}</p><p className="starter-limits">{service.limits}</p></div><Arrow /></article>)}</div>
        </section>

        <section className="process section" id="process">
          <div className="process-intro"><p className="eyebrow">A direct process</p><h2>Less theatre.<br /><em>More working software.</em></h2><p>Clear scope, visible progress, and proof that the result works where it matters.</p></div>
          <ol>{process.map((item, index) => <li key={item.step}><span>0{index + 1}</span><div><h3>{item.step}</h3><p>{item.body}</p></div></li>)}</ol>
        </section>

        <section className="contact section" id="contact"><p className="eyebrow">One custom screen concept · No purchase required</p><h2>Picture it first.<br /><em>Build it when it feels right.</em></h2><EmailLink className="contact-link" preview>Get my free app preview <Arrow /></EmailLink><p className="contact-note">You’ll receive one visual concept for a key phone or desktop app screen. It’s a preview image—not working software or a prototype.</p><div className="contact-glow" aria-hidden="true" /></section>
      </main>

      <footer><a className="brand" href="#top"><span>R</span> Reid</a><p>Custom software · Built in Canada</p><div><a href="https://github.com/reidklassen-design" target="_blank" rel="noreferrer">GitHub ↗</a><a href="#top">Back to top ↑</a></div></footer>
      {activeProject && <Lightbox project={activeProject} close={() => setActiveProject(null)} />}
    </>
  )
}

export default App
