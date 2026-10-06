import { DocumentNotice } from './DocumentNotice.js';
import { DocumentWorkspace } from './DocumentWorkspace.js';
import { useEffect, useState } from 'react';
import type { ExampleLocale } from './examples.js';
import { workspaceMessages } from './product-copy.js';
import { DocumentHome } from './DocumentHome.js';
import { DocumentInput } from './DocumentInput.js';
import { documentServices, useDocumentSession } from './useDocumentSession.js';
import type { DocumentServices } from './useDocumentSession.js';
import { initialLocale, persistLocale } from './locale.js';
import './workspace.css';
export function DocumentApp({
  services = documentServices,
}: {
  services?: DocumentServices;
}) {
  const [locale, setLocale] = useState<ExampleLocale>(initialLocale);
  const t = workspaceMessages[locale];
  const controller = useDocumentSession(services);
  const busy = !['home', 'upload', 'ready'].includes(controller.status);
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  const upload = () => {
    controller.upload();
  };
  const loaded = controller.loaded;
  return (
    <>
      <a href="#main" className="skip">
        {t.skip}
      </a>
      <header className="shell">
        <a
          className="brand"
          href="#main"
          onClick={() => {
            controller.home();
          }}
        >
          <img src="/brand/brand-highlight.svg" width="36" height="36" alt="" />
          <span>Evidence Assistant</span>
        </a>
        <div className="header-right">
          <label className="language">
            <span>{t.language}</span>
            <select
              aria-label={t.language}
              value={locale}
              onChange={(event) => {
                const selected = event.target.value as ExampleLocale;
                setLocale(selected);
                persistLocale(selected);
              }}
            >
              <option value="en">English</option>
              <option value="pt-BR">Português (Brasil)</option>
              <option value="es">Español</option>
            </select>
          </label>
        </div>
      </header>
      <main id="main" className="shell">
        <DocumentNotice
          controller={controller}
          locale={locale}
          t={t}
          upload={upload}
        />
        {controller.status === 'home' && (
          <DocumentHome
            t={t}
            locale={locale}
            example={(kind) => {
              controller.example(locale, kind);
            }}
            upload={upload}
          />
        )}
        {!loaded && controller.status !== 'home' && (
          <DocumentInput
            t={t}
            busy={busy}
            read={(file) => {
              controller.read(file);
            }}
            home={() => {
              controller.home();
            }}
          />
        )}
        {loaded && (
          <DocumentWorkspace
            key={loaded.document.id}
            controller={controller}
            loaded={loaded}
            locale={locale}
            t={t}
            upload={upload}
          />
        )}
      </main>
      <footer className="shell">
        <span>{t.footer}</span>
        <span>{t.footerNote}</span>
      </footer>
    </>
  );
}
