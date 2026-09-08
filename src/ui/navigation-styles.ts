export const navigationStyles = `
.shell-navigation {
  width: min(100% - 2rem, 1180px);
  margin: 0.75rem auto 0;
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
  margin-top: 0.45rem;
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
}

.secondary-navigation-list,
.related-navigation-list {
  display: flex;
  flex-wrap: nowrap;
  gap: 0.35rem;
  width: max-content;
}

.secondary-navigation a,
.related-navigation a {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  padding: 0.45rem 0.7rem;
  border: 1px solid var(--line);
  border-radius: 999px;
  text-decoration: none;
  white-space: nowrap;
}

.secondary-navigation a[data-route-current],
.related-navigation a[data-route-current] {
  border-color: var(--acid);
  color: var(--paper);
}

.related-navigation {
  flex: 0 0 auto;
  padding-left: 0.75rem;
  border-left: 1px solid var(--line);
}

.architecture-domain + .architecture-domain {
  margin-top: 2.5rem;
}

.architecture-domain .section-head h2 a {
  color: inherit;
  text-decoration: none;
}

.architecture-domain .section-head h2 a:hover,
.architecture-domain .section-head h2 a:focus-visible {
  text-decoration: underline;
  text-underline-offset: 0.2em;
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
    padding-left: 0;
    border-left: 0;
  }

  .secondary-navigation a,
  .related-navigation a {
    min-height: 44px;
    padding-block: 0.35rem;
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
