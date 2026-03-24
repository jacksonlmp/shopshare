import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { ThemeToggle } from '../components/ThemeToggle';
import { useSessionStore } from '../store/useSessionStore';

/** Hero: banca de frutas (`public/images/hero-frutas.png`) */
const HERO_IMG = '/images/hero-frutas.png';

const NAV_SECTIONS = ['como-funciona', 'sobre', 'contato'] as const;
type NavSectionId = (typeof NAV_SECTIONS)[number];

const CONTACT = {
  email: 'jacksonlmp17.jl@gmail.com',
  linkedin: 'https://www.linkedin.com/in/jacksonlmp/',
  github: 'https://github.com/jacksonlmp',
  instagramUrl: 'https://www.instagram.com/jacksonlmp/',
} as const;

function IconLinkedIn({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
      />
    </svg>
  );
}

function IconGitHub({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
      />
    </svg>
  );
}

function IconInstagram({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"
      />
    </svg>
  );
}

const contactLinkClass =
  'inline-flex items-center gap-2 rounded-full border border-outline-variant/40 bg-surface-container-lowest px-4 py-2.5 font-headline text-sm font-semibold text-on-surface transition-colors hover:border-primary/40 hover:bg-primary-container/25 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

function navButtonClass(active: boolean, compact?: boolean): string {
  const base = compact ? 'text-[11px]' : 'text-sm';
  return `${base} font-headline font-bold transition-colors duration-200 ${active ? 'nav-link-active' : 'nav-link-quiet'}`;
}

export function LandingPage() {
  const user = useSessionStore((s) => s.user);
  const appHref = user ? '/home' : '/onboarding';
  const [activeNav, setActiveNav] = useState<NavSectionId | null>(null);

  const scrollToSection = useCallback((id: NavSectionId) => {
    setActiveNav(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  /* Scroll spy: secção visível abaixo do header fixo */
  useEffect(() => {
    const headerReserve = 140;

    const resolveActive = () => {
      const marker = window.scrollY + headerReserve;
      let chosen: NavSectionId | null = null;

      for (let i = NAV_SECTIONS.length - 1; i >= 0; i--) {
        const id = NAV_SECTIONS[i];
        const el = document.getElementById(id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top + window.scrollY;
        if (top <= marker) {
          chosen = id;
          break;
        }
      }
      setActiveNav(chosen);
    };

    resolveActive();
    window.addEventListener('scroll', resolveActive, { passive: true });
    window.addEventListener('resize', resolveActive, { passive: true });
    return () => {
      window.removeEventListener('scroll', resolveActive);
      window.removeEventListener('resize', resolveActive);
    };
  }, []);

  const navButtons = (
    <>
      <button
        type="button"
        onClick={() => scrollToSection('como-funciona')}
        className={navButtonClass(activeNav === 'como-funciona')}
        aria-current={activeNav === 'como-funciona' ? 'true' : undefined}
      >
        Como Funciona
      </button>
      <button
        type="button"
        onClick={() => scrollToSection('sobre')}
        className={navButtonClass(activeNav === 'sobre')}
        aria-current={activeNav === 'sobre' ? 'true' : undefined}
      >
        Sobre
      </button>
      <button
        type="button"
        onClick={() => scrollToSection('contato')}
        className={navButtonClass(activeNav === 'contato')}
        aria-current={activeNav === 'contato' ? 'true' : undefined}
      >
        Contato
      </button>
    </>
  );

  const navButtonsMobile = (
    <>
      <button
        type="button"
        onClick={() => scrollToSection('como-funciona')}
        className={navButtonClass(activeNav === 'como-funciona', true)}
        aria-current={activeNav === 'como-funciona' ? 'true' : undefined}
      >
        Como Funciona
      </button>
      <button
        type="button"
        onClick={() => scrollToSection('sobre')}
        className={navButtonClass(activeNav === 'sobre', true)}
        aria-current={activeNav === 'sobre' ? 'true' : undefined}
      >
        Sobre
      </button>
      <button
        type="button"
        onClick={() => scrollToSection('contato')}
        className={navButtonClass(activeNav === 'contato', true)}
        aria-current={activeNav === 'contato' ? 'true' : undefined}
      >
        Contato
      </button>
    </>
  );

  return (
    <div className="font-body bg-surface text-on-surface flex min-h-screen flex-col overflow-x-hidden antialiased">
      <header className="glass-nav fixed top-0 z-50 w-full">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 sm:h-[4.5rem] sm:px-8">
          <Link
            to="/"
            className="font-headline text-xl font-extrabold tracking-tight text-primary sm:text-2xl"
          >
            ShopShare
          </Link>
          <nav
            className="hidden items-center gap-1 font-headline md:flex"
            aria-label="Secções"
          >
            {navButtons}
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to={appHref}
              className="btn-secondary-surface inline-flex items-center justify-center px-5 py-2.5 text-sm sm:px-6 sm:text-sm"
            >
              {user ? 'Abrir app' : 'Login'}
            </Link>
            <ThemeToggle />
          </div>
        </div>
        <div className="flex justify-center gap-1 bg-surface-container-low/90 px-4 py-2.5 backdrop-blur-md md:hidden">
          {navButtonsMobile}
        </div>
      </header>

      <main className="flex-grow pt-[6.5rem] md:pt-[4.5rem]">
        <section className="relative mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-12 px-4 pb-20 pt-12 sm:px-8 md:gap-16 md:pb-28 md:pt-20 lg:grid-cols-2 lg:pt-24">
          <div className="z-10 lg:pr-4">
            <div className="curator-chip mb-6 inline-flex items-center px-4 py-2.5">
              NOVA FUNÇÃO: CARRINHO COMPARTILHADO
            </div>
            <h1 className="display-hero mb-8 text-4xl sm:text-5xl md:text-6xl lg:text-[3.5rem]">
              Compras, <br />
              <span className="text-primary italic">Melhor Juntos.</span>
            </h1>
            <p className="mb-10 max-w-lg font-body text-lg leading-relaxed text-on-surface-variant sm:text-xl">
              A boutique moderna para suas listas. Crie, compartilhe e sincronize suas coleções
              de compras com um código simples.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to={appHref}
                className="btn-primary-jewel inline-flex items-center justify-center px-8 py-4 text-lg"
              >
                Começar Agora
              </Link>
            </div>
          </div>
          <div className="relative lg:pl-2">
            <div
              className="pointer-events-none absolute -left-8 -top-8 h-56 w-56 rounded-full bg-primary/10 blur-3xl md:h-64 md:w-64"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-8 -right-8 h-72 w-72 rounded-full bg-tertiary/10 blur-3xl md:h-80 md:w-80"
              aria-hidden
            />
            <div className="relative overflow-hidden rounded-[2rem] bg-surface-container-lowest border-ghost">
              <img
                src={HERO_IMG}
                alt="Banca de mercado com frutas e vegetais frescos, coloridos e bem organizados"
                className="aspect-square w-full rounded-[1.5rem] object-cover"
                width={600}
                height={600}
                loading="eager"
                decoding="async"
              />
            </div>
          </div>
        </section>

        <section
          id="como-funciona"
          className="scroll-mt-28 bg-surface-container-low px-4 py-16 sm:px-8 md:scroll-mt-24 md:py-28"
        >
          <div className="mx-auto max-w-[1200px]">
            <div className="mb-14 text-center md:mb-20">
              <h2 className="font-headline mb-4 text-3xl font-bold tracking-tight text-on-surface md:text-4xl">
                Colaboração Reinventada
              </h2>
              <p className="font-body text-lg text-on-surface-variant">
                Feito para minimalistas que valorizam a eficiência e a simplicidade.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-7 md:grid-cols-3 md:gap-8">
              <article className="flex flex-col items-start rounded-[2rem] bg-surface-container-lowest p-8 md:p-10">
                <div className="mb-7 flex h-16 w-16 items-center justify-center rounded-[2rem] bg-surface-container-high text-primary md:mb-8">
                  <span className="material-symbols-outlined text-4xl">edit_note</span>
                </div>
                <h3 className="font-headline mb-4 text-xl font-bold text-on-surface md:text-2xl">
                  Crie suas listas
                </h3>
                <p className="font-body leading-relaxed text-on-surface-variant">
                  Organize seus desejos em coleções lindas e categorizadas com uma interface
                  inspirada em editoriais.
                </p>
              </article>
              <article className="flex flex-col items-start rounded-[2rem] bg-surface-container-lowest p-8 md:p-10">
                <div className="mb-7 flex h-16 w-16 items-center justify-center rounded-[2rem] bg-primary-container text-on-primary-container md:mb-8">
                  <span className="material-symbols-outlined text-4xl">qr_code_2</span>
                </div>
                <h3 className="font-headline mb-4 text-xl font-bold text-on-surface md:text-2xl">
                  Compartilhe com um código
                </h3>
                <p className="font-body leading-relaxed text-on-surface-variant">
                  Sem necessidade de conta para amigos. Basta gerar um código único e começar a
                  colaborar instantaneamente.
                </p>
              </article>
              <article className="flex flex-col items-start rounded-[2rem] bg-surface-container-lowest p-8 md:p-10">
                <div className="mb-7 flex h-16 w-16 items-center justify-center rounded-[2rem] bg-surface-container-high text-primary md:mb-8">
                  <span className="material-symbols-outlined text-4xl">sync</span>
                </div>
                <h3 className="font-headline mb-4 text-xl font-bold text-on-surface md:text-2xl">
                  Sincronização em tempo real
                </h3>
                <p className="font-body leading-relaxed text-on-surface-variant">
                  Experimente atualizações com zero latência. Quando alguém adiciona um item, ele
                  aparece na sua tela como mágica.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section id="sobre" className="scroll-mt-28 px-4 py-14 sm:px-8 md:scroll-mt-24 md:py-20">
          <div className="mx-auto max-w-[800px] text-center">
            <h2 className="font-headline mb-5 text-2xl font-bold tracking-tight text-on-surface md:text-3xl">
              Sobre o ShopShare
            </h2>
            <p className="font-body text-lg leading-relaxed text-on-surface-variant">
              O ShopShare é uma experiência web responsiva para famílias e grupos criarem listas de
              compras partilhadas, entrarem com um código de 6 caracteres e verem as alterações em
              tempo real — ideal para quem quer simplicidade, sem complicações de login tradicional.
              Na primeira visita, você escolhe um nome e um emoji; depois, suas listas ficam ligadas
              ao seu perfil neste dispositivo.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-[1200px] px-4 py-14 sm:px-8 md:py-24">
          <div className="relative flex flex-col items-center overflow-hidden rounded-[2rem] bg-surface-container-highest p-10 text-center md:p-16">
            <div
              className="pointer-events-none absolute right-0 top-0 h-80 w-80 -translate-y-1/2 translate-x-1/2 rounded-full bg-primary/5 blur-3xl"
              aria-hidden
            />
            <h2 className="font-headline relative z-10 mb-8 text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl md:text-5xl">
              Pronto para comprar de forma inteligente?
            </h2>
            <p className="relative z-10 mb-12 max-w-2xl font-body text-lg text-on-surface-variant sm:text-xl">
              Junte-se a quem já transformou a compra de uma tarefa comum em um momento social
              organizado — listas claras, códigos curtos e sincronização instantânea.
            </p>
            <Link
              to={appHref}
              className="btn-primary-jewel relative z-10 inline-flex items-center justify-center px-10 py-5 text-lg sm:text-xl"
            >
              Comece Grátis
            </Link>
          </div>
        </section>

        <section
          id="contato"
          className="scroll-mt-28 bg-surface-container-low px-4 py-16 sm:px-8 md:scroll-mt-24 md:py-24"
        >
          <div className="mx-auto max-w-[640px] text-center">
            <h2 className="font-headline mb-8 text-2xl font-bold tracking-tight text-on-surface md:mb-10 md:text-3xl">
              Contato
            </h2>
            <ul className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <li>
                <a href={`mailto:${CONTACT.email}`} className={contactLinkClass}>
                  <span className="material-symbols-outlined text-[22px] text-primary" aria-hidden>
                    mail
                  </span>
                  E-mail
                </a>
              </li>
              <li>
                <a
                  href={CONTACT.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={contactLinkClass}
                >
                  <IconLinkedIn className="h-[22px] w-[22px] shrink-0 text-primary" />
                  LinkedIn
                </a>
              </li>
              <li>
                <a
                  href={CONTACT.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={contactLinkClass}
                >
                  <IconGitHub className="h-[22px] w-[22px] shrink-0 text-primary" />
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href={CONTACT.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={contactLinkClass}
                >
                  <IconInstagram className="h-[22px] w-[22px] shrink-0 text-primary" />
                  Instagram
                </a>
              </li>
            </ul>
          </div>
        </section>
      </main>

      <footer className="mt-auto w-full bg-surface-container py-12">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center justify-between gap-6 px-4 sm:px-8 md:flex-row">
          <div className="font-headline text-lg font-bold text-on-surface">ShopShare</div>
          <div className="flex flex-wrap justify-center gap-4 font-body text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant sm:gap-6 sm:text-xs">
            <a href="#" className="transition-colors hover:text-primary">
              Termos de Serviço
            </a>
            <a href="#" className="transition-colors hover:text-primary">
              Privacidade
            </a>
            <a href="#" className="transition-colors hover:text-primary">
              Suporte
            </a>
            <a
              href="/health"
              className="transition-colors hover:text-primary"
              onClick={(e) => {
                e.preventDefault();
                window.open(
                  `${import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:8000'}/health/`,
                  '_blank',
                  'noopener,noreferrer',
                );
              }}
            >
              Status da API
            </a>
          </div>
          <div className="text-center font-body text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant md:text-right sm:text-xs">
            © {new Date().getFullYear()} ShopShare v2.1.0. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
