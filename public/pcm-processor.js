// public/pcm-processor.js
class PCMProcessor extends AudioWorkletProcessor {
    process(inputs) {
        const input = inputs[0];
        if (!input || !input[0]) return true;

        const channelData = input[0];
        const pcm16 = new Int16Array(channelData.length);

        for (let i = 0; i < channelData.length; i++) {
            // Linear scaling: Map [-1.0, 1.0] to [-32768, 32767]
            const s = Math.max(-1, Math.min(1, channelData[i]));
            pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        // Transfer the underlying buffer to the main thread (optimized)
        this.port.postMessage(pcm16.buffer, [pcm16.buffer]);
        return true;
    }
}

registerProcessor('pcm-processor', PCMProcessor);
