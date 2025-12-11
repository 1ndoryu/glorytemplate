import {MapPin} from 'lucide-react';
import {Badge} from '../../../components/ui/Badge';
import {Button} from '../../../components/ui/Button';
import {ABOUT_CONTENT} from '../data/content';

export function ProfileHero() {
    const {hero} = ABOUT_CONTENT;

    return (
        <section id="profile-hero" className="mx-auto w-full max-w-5xl">
            <div className="bg-surface border border-primary rounded-2xl overflow-hidden shadow-sm flex flex-col md:flex-row">
                {/* Left: Photo Area */}
                <div className="w-full md:w-2/5 bg-secondary relative min-h-[300px] md:min-h-full">
                    <img src={hero.image} alt="Guillermo García" className="absolute inset-0 w-full h-full object-cover mix-blend-multiply opacity-90 grayscale hover:grayscale-0 transition-all duration-700" />
                    <div className="absolute bottom-4 left-4 right-4 bg-surface/90 backdrop-blur-sm p-3 rounded-lg border border-primary/20 shadow-lg">
                        <div className="flex items-center gap-2 text-xs font-medium text-primary">
                            <MapPin className="w-3 h-3 text-muted" />
                            {hero.location}
                        </div>
                    </div>
                </div>

                {/* Right: Intro Content */}
                <div className="w-full md:w-3/5 p-8 md:p-12 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-6">
                        <Badge className="bg-accent-primary text-white border-transparent">{hero.badges[0]}</Badge>
                        <Badge>{hero.badges[1]}</Badge>
                    </div>

                    <h1 className="text-3xl md:text-4xl font-heading font-semibold tracking-tight text-primary mb-6">{hero.title}</h1>

                    <p className="text-muted leading-relaxed mb-8 font-light text-lg">{hero.description}</p>

                    <div className="flex flex-wrap gap-3">
                        {hero.actions.map((action, i) => (
                            <Button key={i} href={action.href} variant={action.variant} icon={action.icon as React.ComponentType<{className?: string}>}>
                                {action.text}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
