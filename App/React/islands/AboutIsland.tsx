import {PageLayout} from '../components/layout';
import {ProfileHero} from '../features/about/components/ProfileHero';
import {Philosophy} from '../features/about/components/Philosophy';
import {CaseStudy} from '../features/about/components/CaseStudy';
import {TechStack} from '../features/about/components/TechStack';
import {SimpleProcess} from '../features/about/components/SimpleProcess';
import {ActionCta} from '../features/about/components/ActionCta';

export function AboutIsland(): JSX.Element {
    return (
        <PageLayout headerCtaText="Agendar 1:1" copyrightType="consultoria" mainClassName="flex-1 flex flex-col gap-16 md:gap-24 px-6 py-12 md:py-20">
            {/* 1. HERO PROFILE (Tarjeta tipo ID) */}
            <ProfileHero />

            {/* 2. MI FILOSOFÍA (Texto en 2 columnas) */}
            <Philosophy />

            {/* 3. CASE STUDY (Estilo Dark Card) */}
            <CaseStudy />

            {/* 4. TECH STACK (Grid minimalista) */}
            <TechStack />

            {/* 5. CÓMO TRABAJO (TIMELINE HORIZONTAL SIMPLIFICADO) */}
            <SimpleProcess />

            {/* 6. CTA FINAL (Foto de acción) */}
            <ActionCta />
        </PageLayout>
    );
}
