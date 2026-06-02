import VoiceRecordButton from './VoiceRecordButton';
import { useVoiceRecording } from '../../hooks/useVoiceRecording';

interface VoiceRecorderControlProps {
  onRecordingComplete?: (blob: Blob) => void;
  onError?: (err: Error) => void;
  disabled?: boolean;
}

const VOICE_RECORDER_ERROR_CLASS_NAME = ['mt-2', 'text-sm', 'text-destructive'].join(' ');

export const VoiceRecorderControl = ({
  onRecordingComplete,
  onError,
}: Readonly<VoiceRecorderControlProps>) => {
  const { status, toggleRecording, error } = useVoiceRecording(onRecordingComplete, onError);

  return (
    <div>
      <VoiceRecordButton status={status} onClick={toggleRecording} />
      {error && <div className={VOICE_RECORDER_ERROR_CLASS_NAME}>{error.message}</div>}
    </div>
  );
};
