import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import type { FC } from 'react';
import type { SiteContent } from '../../lib/supabase';
import SectionHeading from '../SectionHeading';
import fallbackPortrait from '../../../Asfi.png';

// Simple utility to check if a value is not empty
const isNotEmpty = (val: unknown): boolean => {
  if (val === null || val === undefined) return false;
  if (typeof val === 'string' && val.trim() === '') return false;
  if (Array.isArray(val) && val.length === 0) return false;
  return true;
};

interface AboutSectionProps {
  content: SiteContent | null;
}

const AboutSection: FC<AboutSectionProps> = ({ content }) => {
  if (!content) return null;

  const hasAbout =
    isNotEmpty(content.about_text) ||
    isNotEmpty(content.about_paragraph1) ||
    isNotEmpty(content.about_paragraph2) ||
    isNotEmpty(content.about_paragraph3);

  if (!hasAbout) return null;

  return (
    <section id="about" className="relative py-24 px-6 overflow-hidden">
      <div className="absolute inset-0 -z-10 surface-dotted opacity-40 pointer-events-none" />
      <div className="absolute inset-x-0 top-0 -z-10 h-px section-divider" />
      <div className="max-w-6xl mx-auto">
        <SectionHeading
          eyebrow="About"
          title="A bit about me."
          icon={User}
        />
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Text */}
          <div className="space-y-6">
            {isNotEmpty(content.about_text) && (
              <p className="text-2xl leading-tight tracking-tight text-white">
                <span dangerouslySetInnerHTML={{ __html: content.about_text ?? '' }} />
              </p>
            )}
            <div className="text-[#a1a1aa] space-y-5 leading-relaxed text-[15px]">
              {isNotEmpty(content.about_paragraph1) && (
                <p dangerouslySetInnerHTML={{ __html: content.about_paragraph1 ?? '' }} />
              )}
              {isNotEmpty(content.about_paragraph2) && (
                <p dangerouslySetInnerHTML={{ __html: content.about_paragraph2 ?? '' }} />
              )}
              {isNotEmpty(content.about_paragraph3) && (
                <p dangerouslySetInnerHTML={{ __html: content.about_paragraph3 ?? '' }} />
              )}
            </div>
          </div>
          {/* Full Photo */}
          <div className="relative">
            <div className="absolute -inset-3 bg-gradient-to-br from-[#6366f1]/20 to-transparent rounded-[2.5rem] blur-2xl" />
            <motion.img
              src={content?.portrait_url || fallbackPortrait}
              alt="Asfi Ahamed"
              className="relative w-full max-w-[520px] mx-auto md:mx-0 rounded-[2.25rem] border border-[#27272a] shadow-xl object-cover md:h-[850px] card-hover-lift card-glow-top"
              loading="lazy"
              width={520}
              height={850}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
