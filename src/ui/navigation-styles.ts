export const navigationStyles = `
.shell-navigation {
  width: min(100% - 2rem, 1180px);
  margin: 0.75rem auto 0;
}

body[data-route-id^='platform.'] main.site-main {
  padding-top: clamp(1.75rem, 3.5vw, 3.5rem);
}

.breadcrumb {
  font-size: 0.76rem;
  color: var(--muted);
}

.breadcrumb ol,
.secondary-navigation-list,
.related-navigation-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.breadcrumb ol {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  align-items: center;
}

.breadcrumb li {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}

.breadcrumb li + li::before {
  content: '/';
  color: var(--line-strong, var(--muted));
}

.breadcrumb a,
.secondary-navigation a,
.related-navigation a {
  color: inherit;
}

.breadcrumb a {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
}

.breadcrumb [aria-current='page'] {
  color: var(--paper);
}

.nav a[data-section-current] {
  color: var(--paper);
}

.secondary-navigation-shell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.2rem;
  min-width: 0;
}

.secondary-navigation,
.related-navigation {
  min-width: 0;
}

.secondary-navigation {
  flex: 1 1 auto;
  overflow-x: auto;
  overscroll-behavior-inline: contain;
  scrollbar-width: thin;
  border-bottom: 1px solid var(--line);
}

.secondary-navigation-list,
.related-navigation-list {
  display: flex;
  flex-wrap: nowrap;
  gap: 0.35rem;
  width: max-content;
}

.secondary-navigation-list {
  gap: 0;
  width: 100%;
}

.secondary-navigation a,
.related-navigation a {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  padding: 0.45rem 0.7rem;
  text-decoration: none;
  white-space: nowrap;
}

.secondary-navigation a {
  position: relative;
  justify-content: center;
  min-height: 52px;
  padding-inline: clamp(0.75rem, 2vw, 1.35rem);
  color: var(--muted);
  font: 800 0.74rem/1 var(--mono);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.related-navigation a {
  border: 1px solid var(--line);
  border-radius: 999px;
}

.secondary-navigation a::after {
  position: absolute;
  inset-inline: 0.55rem;
  bottom: -1px;
  height: 3px;
  background: transparent;
  content: '';
}

.secondary-navigation a:hover,
.secondary-navigation a:focus-visible {
  color: var(--paper);
  background: var(--panel-2);
}

.secondary-navigation a[data-route-current] {
  color: var(--paper);
  background: var(--panel-2);
}

.secondary-navigation a[data-route-current]::after {
  background: var(--acid);
}

.related-navigation a[data-route-current] {
  border: 1px solid var(--acid);
  border-radius: 999px;
  color: var(--paper);
}

.related-navigation {
  flex: 0 0 auto;
  padding-inline-start: 0.75rem;
  border-inline-start: 1px solid var(--line);
}

@media (max-width: 700px) {
  .site-header {
    gap: 0.2rem 0.6rem;
    padding-block: 0.4rem;
  }

  .brand {
    min-height: 44px;
  }

  .brand-copy small {
    display: none;
  }

  .nav {
    gap: 0;
    row-gap: 0;
  }

  .nav a,
  .nav button {
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    padding: 0.35rem 0.5rem;
  }

  .shell-navigation {
    width: min(100% - 1.25rem, 1180px);
    margin-top: 0.35rem;
  }

  .breadcrumb {
    line-height: 1.2;
  }

  .secondary-navigation-shell {
    display: block;
    margin-top: 0.2rem;
  }

  .secondary-navigation,
  .related-navigation {
    overflow-x: auto;
    overscroll-behavior-inline: contain;
  }

  .related-navigation {
    margin-top: 0.25rem;
    padding-inline-start: 0;
    border-inline-start: 0;
  }

  .secondary-navigation a,
  .related-navigation a {
    min-height: 44px;
    padding-block: 0.35rem;
  }

  .secondary-navigation a {
    min-height: 48px;
  }

  .site-main {
    padding-top: 0.6rem;
  }

  .page-header,
  .home-header {
    margin-top: 0;
    padding-top: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .secondary-navigation,
  .related-navigation {
    scroll-behavior: auto;
  }
}
`;
