import { useEffect, useRef, useState } from 'react'
import { process, projects, services, skills, type Project } from './data'

const Arrow = () => <svg aria-hidden="true" viewBox="0 0 20 20"><path d="M4 10h11M11 5l5 5-5 5" /></svg>
const Expand = () => <svg aria-hidden="true" viewBox="0 0 20 20"><path d="M7 3H3v4M13 3h4v4M7 17H3v-4M13 17h4v-4" /></svg>

function EmailLink({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const parts = ['reidklassen', 'gmail', 'com']
  const openEmail = () => { window.location.href = `mailto:${parts[0]}@${parts[1]}.${parts[2]}` }
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

function App() {
  const [activeProject, setActiveProject] = useState<Project | null>(null)
  return (
    <>
      <a className="skip-link" href="#work">Skip to selected work</a>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Reid, home"><span>R</span> Reid</a>
        <nav aria-label="Main navigation"><a href="#work">Work</a><a href="#services">Services</a><a href="#process">Process</a></nav>
        <EmailLink className="header-contact">Start a project <Arrow /></EmailLink>
      </header>

      <main>
        <section className="hero" id="top">
          <picture className="hero-art" aria-hidden="true">
            <source srcSet="/media/generated/hero-workshop.avif" type="image/avif" />
            <source srcSet="/media/generated/hero-workshop.webp" type="image/webp" />
            <img src="/media/generated/hero-workshop.png" alt="" fetchPriority="high" />
          </picture>
          <div className="hero-grid" aria-hidden="true" />
          <div className="availability"><i /> Available for select projects <span>2026</span></div>
          <div className="hero-copy">
            <p className="kicker">Independent software developer · Canada</p>
            <h1>I build practical<br /><em>AI software</em><br />that runs.</h1>
            <p className="hero-deck">Custom phone apps, desktop software, MCU firmware, and AI tools—designed with care and built to do real work.</p>
            <div className="hero-actions"><EmailLink className="button primary">Start a project <Arrow /></EmailLink><a className="button secondary" href="#work">View my work</a></div>
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
          <div className="section-heading compact"><p><span>02</span> What I build</p><h2>From rough idea<br />to <em>working system.</em></h2></div>
          <div className="service-list">{services.map((service) => <article key={service.title}><span>{service.number}</span><h3>{service.title}<small>{service.price}</small></h3><p>{service.body}</p><Arrow /></article>)}</div>
        </section>

        <section className="process section" id="process">
          <div className="process-intro"><p className="eyebrow">A direct process</p><h2>Less theatre.<br /><em>More working software.</em></h2><p>Clear scope, visible progress, and proof that the result works where it matters.</p></div>
          <ol>{process.map((item, index) => <li key={item.step}><span>0{index + 1}</span><div><h3>{item.step}</h3><p>{item.body}</p></div></li>)}</ol>
        </section>

        <section className="contact section" id="contact"><p className="eyebrow">Have a workflow worth fixing?</p><h2>Let’s make it<br /><em>work better.</em></h2><EmailLink className="contact-link">Tell me what you’re building <Arrow /></EmailLink><div className="contact-glow" aria-hidden="true" /></section>
      </main>

      <footer><a className="brand" href="#top"><span>R</span> Reid</a><p>Custom software · Built in Canada</p><div><a href="https://github.com/reidklassen-design" target="_blank" rel="noreferrer">GitHub ↗</a><a href="#top">Back to top ↑</a></div></footer>
      {activeProject && <Lightbox project={activeProject} close={() => setActiveProject(null)} />}
    </>
  )
}

export default App
