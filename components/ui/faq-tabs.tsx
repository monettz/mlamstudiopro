"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export type FaqTopic = "Licence" | "Compatibility" | "Payment" | "Downloads" | "Releases";
const TOPICS: FaqTopic[] = ["Licence", "Compatibility", "Payment", "Downloads", "Releases"];

type Item = { topic: FaqTopic; q: string; a: ReactNode };

// "Before you buy" questions grouped by topic. Tabs pick the topic; each
// question opens like an accordion. Arrow keys move between tabs.
export default function FaqTabs({ items }: { items: Item[] }) {
  const topics = TOPICS.filter((topic) => items.some((item) => item.topic === topic));
  const [active, setActive] = useState<FaqTopic>(topics[0]);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = (index + step + topics.length) % topics.length;
    setActive(topics[next]);
    tabRefs.current[next]?.focus();
  }

  return (
    <div className="faq-tabs">
      <div className="faq-tablist" role="tablist" aria-label="Question topics">
        {topics.map((topic, index) => (
          <button
            key={topic}
            ref={(element) => { tabRefs.current[index] = element; }}
            type="button"
            role="tab"
            id={`faq-tab-${topic}`}
            aria-selected={active === topic}
            aria-controls="faq-panel"
            tabIndex={active === topic ? 0 : -1}
            className={`faq-tab${active === topic ? " active" : ""}`}
            onClick={() => setActive(topic)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            {topic}
          </button>
        ))}
      </div>
      <div className="faq-list" role="tabpanel" id="faq-panel" aria-labelledby={`faq-tab-${active}`}>
        {items.filter((item) => item.topic === active).map(({ q, a }, index) => (
          <details className="faq-item" key={q} open={index === 0}>
            <summary>
              <span>{q}</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
            </summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
