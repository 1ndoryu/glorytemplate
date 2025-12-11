import {Mic} from 'lucide-react';
import type {Scenario} from '../data/scenarios';

interface DemoChatProps {
    scenario: Scenario;
}

export function DemoChat({scenario}: DemoChatProps) {
    return (
        <div id="demo-chat" className="bg-white rounded-[2rem] border-[6px] border-stone-800 shadow-2xl overflow-hidden max-w-sm mx-auto h-[500px] relative flex flex-col">
            {/* Phone Notch & Status Bar */}
            <div className="bg-stone-800 h-6 w-full absolute top-0 left-0 z-20 flex justify-center">
                <div className="bg-stone-900 h-4 w-24 rounded-b-lg"></div>
            </div>
            <div className="bg-stone-100 border-b border-stone-200 h-14 mt-6 flex items-center px-4 gap-3 shrink-0">
                <div className="w-8 h-8 rounded-full bg-[#25d366] flex items-center justify-center text-white font-bold text-xs">{scenario.initials}</div>
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-stone-800">{scenario.name}</span>
                    <span className="text-[10px] text-stone-500">Cuenta de empresa</span>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 bg-[#e5ddd5] p-4 space-y-4 overflow-y-auto relative">
                <div className="absolute inset-0 opacity-[0.06]" style={{backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>

                {scenario.messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-500`} style={{animationDelay: `${idx * 1000}ms`, animationFillMode: 'both'}}>
                        <div className={`max-w-[80%] rounded-lg p-2.5 text-xs shadow-sm relative ${msg.isUser ? 'bg-[#dcf8c6] text-stone-900 rounded-tr-none' : 'bg-white text-stone-900 rounded-tl-none'}`}>
                            {msg.text}
                            <div className="text-[9px] text-stone-400 text-right mt-1 opacity-70">10:{30 + idx}</div>
                        </div>
                    </div>
                ))}

                {/* Typing Indicator simulado al final */}
                <div className="flex justify-start animate-in fade-in duration-300" style={{animationDelay: `${scenario.messages.length * 1000 + 500}ms`, animationFillMode: 'both'}}>
                    <div className="bg-white rounded-full px-2 py-1 shadow-sm">
                        <div className="flex gap-1">
                            <div className="w-1 h-1 bg-stone-400 rounded-full animate-bounce"></div>
                            <div className="w-1 h-1 bg-stone-400 rounded-full animate-bounce delay-100"></div>
                            <div className="w-1 h-1 bg-stone-400 rounded-full animate-bounce delay-200"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Input Area (Fake) */}
            <div className="bg-stone-50 p-2 flex gap-2 items-center shrink-0">
                <div className="flex-1 bg-white h-8 rounded-full border border-stone-200"></div>
                <div className="w-8 h-8 bg-[#25d366] rounded-full flex items-center justify-center">
                    <Mic className="w-4 h-4 text-white" />
                </div>
            </div>
        </div>
    );
}
