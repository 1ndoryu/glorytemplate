/*
 * Declaración de tipos para soundtouchjs — C271
 * La librería no incluye tipos nativos. Se declaran los usados.
 */

declare module 'soundtouchjs' {
    export class SoundTouch {
        pitch: number;
        tempo: number;
        rate: number;
        clear(): void;
    }

    export class WebAudioBufferSource {
        constructor(buffer: AudioBuffer);
        extract(target: Float32Array, numFrames: number): number;
    }

    export class SimpleFilter {
        constructor(source: WebAudioBufferSource, soundTouch: SoundTouch, nChannels?: number);
        extract(target: Float32Array, numFrames: number): number;
    }

    export class Stretch {
        constructor(createBuffers?: boolean);
    }

    export class RateTransposer {
        constructor(createBuffers?: boolean);
    }

    export class PitchShifter {
        constructor(
            context: AudioContext,
            buffer: AudioBuffer,
            bufferSize: number,
            onProcess?: (event: Float32Array) => void
        );
        pitchSemitones: number;
        tempo: number;
        rate: number;
        percentagePlayed: number;
        connect(destination: AudioNode): void;
        disconnect(): void;
    }

    export class AbstractFifoSamplePipe {
        /* Base abstracta — no usada directamente */
    }

    export function getWebAudioNode(
        context: AudioContext,
        filter: SimpleFilter,
        sourcePosition?: (pos: number) => void
    ): ScriptProcessorNode;
}
