import React from 'react';
import {ABOUT_CONTENT} from '../data/content';

export function Philosophy() {
    const {philosophy} = ABOUT_CONTENT;
    return (
        <section id="philosophy" className="mx-auto w-full max-w-4xl">
            <div className="grid md:grid-cols-2 gap-12 items-start">
                <div>
                    <h2 className="text-xl font-heading font-medium text-primary mb-4">{philosophy.left.title}</h2>
                    {philosophy.left.paragraphs.map((p: React.ReactNode, i: number) => (
                        <p key={i} className="text-muted text-sm leading-relaxed mb-4 last:mb-0">
                            {p}
                        </p>
                    ))}
                </div>
                <div>
                    <h2 className="text-xl font-heading font-medium text-primary mb-4">{philosophy.right.title}</h2>
                    {philosophy.right.paragraphs.map((p: React.ReactNode, i: number) => (
                        <p key={i} className="text-muted text-sm leading-relaxed mb-4 last:mb-0">
                            {p}
                        </p>
                    ))}
                </div>
            </div>
        </section>
    );
}
