'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

// Light scroll animation: sections and cards fade and rise a little the first
// time they scroll into view. No library; one IntersectionObserver for the
// whole page. Content already on screen when the page loads is never hidden,
// and nothing moves for people who ask their device to reduce motion.
const TARGETS = [
  '.showcase-header', '.spotlight', '.workflow-item', '.pcard', '.faq-item',
  '.help-card', '.tut-card', '.pp-section', '.info-section', '.info-contact-card', '.info-cta',
].join(',');

export default function ScrollReveal() {
  const path = usePathname();

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const done = (element: HTMLElement) => {
      element.classList.add('is-revealed');
      // Drop the helper classes once the fade ends so hover effects work as before.
      window.setTimeout(() => {
        element.classList.remove('reveal', 'is-revealed');
        element.style.removeProperty('transition-delay');
      }, 900);
    };

    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        done(entry.target as HTMLElement);
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    const scan = () => {
      document.querySelectorAll<HTMLElement>(TARGETS).forEach(element => {
        if (element.dataset.reveal) return;
        element.dataset.reveal = '1';
        // Already on screen: leave it visible, no animation.
        if (element.getBoundingClientRect().top < window.innerHeight * 0.92) return;
        // Cards side by side come in one after another, but never slowly.
        const index = Array.prototype.indexOf.call(element.parentElement?.children ?? [], element);
        if (index > 0) element.style.transitionDelay = `${Math.min(index, 4) * 70}ms`;
        element.classList.add('reveal');
        observer.observe(element);
      });
    };

    scan();
    // Cards that appear later (filters, data loading) are picked up too.
    let queued = 0;
    const mutations = new MutationObserver(() => {
      if (queued) return;
      queued = window.requestAnimationFrame(() => { queued = 0; scan(); });
    });
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutations.disconnect();
      if (queued) window.cancelAnimationFrame(queued);
    };
  }, [path]);

  return null;
}
