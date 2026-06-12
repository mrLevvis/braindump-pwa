import type { IngestResult } from '../types';
import { supabase } from './ApiClient';

const FUNCTION_NAME = 'process-brain-dump';

export async function processText(text: string): Promise<IngestResult> {
    const { data, error } = await supabase.functions.invoke<IngestResult>(FUNCTION_NAME, {
        body: { text },
    });
    if (error) throw new Error(error.message);
    return data!;
}

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
    const audioFile = new File([audioBlob], 'audio.webm', { type: 'audio/webm' });
    const formData = new FormData();
    formData.append('file', audioFile);

    const { data, error } = await supabase.functions.invoke<{ text: string }>(FUNCTION_NAME, {
        body: formData,
    });
    if (error) throw new Error(error.message);
    return data!.text;
}
