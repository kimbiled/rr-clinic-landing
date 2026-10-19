import { asset, heroData } from '../../data/hero';

/**
 * Contacts (#contacts) — target of nav "Контакты" and "Связаться" (QA R3-5). Not in the Figma yet:
 * a minimal block built from the clinic data until the footer/contacts design arrives.
 */
export function Contacts() {
  const { clinic } = heroData;

  return (
    <footer id="contacts" aria-labelledby="contacts-title" className="bg-gold-950 text-taupe-50">
      <div className="mx-auto flex max-w-[1440px] items-end justify-between gap-12 px-[100px] py-20">
        <div>
          <p className="font-text text-[18px] tracking-[0.1em] text-taupe-400 uppercase">Контакты</p>
          <h2 id="contacts-title" className="mt-4 font-display text-[40px] leading-[1.1] font-normal tracking-[-0.045em]">
            {clinic.name}
          </h2>
          <p className="mt-3 font-text text-[20px] text-neutral-200">{clinic.location}</p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={clinic.phoneHref}
            className="rounded-pill border border-outline px-6 py-4 font-text text-[20px] font-medium transition-colors hover:border-taupe-50 focus-visible:border-taupe-50"
          >
            {clinic.phone}
          </a>
          <a
            href={clinic.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-pill bg-neutral-100 px-6 py-4 font-text text-[20px] font-medium text-neutral-900 transition-transform hover:-translate-y-0.5 motion-reduce:transition-none"
          >
            <img src={asset('assets/icons/whatsapp.svg')} width={18} height={18} alt="" className="size-[18px]" />
            Написать в WhatsApp
          </a>
        </div>
      </div>
    </footer>
  );
}
