import React from "react";

const SUPPORT_EMAIL = "support@devscratchpad.tech";

/** Privacy note and support contact shown at the end of the studio reference content. */
export function StudioSupportSection() {
  return (
    <section aria-label="Privacy and support" className="space-y-2 text-[15px] leading-7 text-zinc-600">
      <p>
        <span className="font-medium text-zinc-900">Private by default.</span> The studio runs in your
        browser, and nothing you type or import is sent to DevScratchpad.
      </p>
      <p>
        Questions, or a preset you&apos;d like added? Email{" "}
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="font-medium text-orange-600 underline decoration-orange-600/30 underline-offset-4 hover:text-orange-700 hover:decoration-orange-700"
        >
          {SUPPORT_EMAIL}
        </a>
        .
      </p>
    </section>
  );
}
