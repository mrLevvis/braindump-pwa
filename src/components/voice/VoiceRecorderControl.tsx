import React from 'react';
import VoiceRecordButton from './VoiceRecordButton';
import { useVoiceRecording } from '../../hooks/useVoiceRecording';

interface VoiceRecorderControlProps {
  onRecordingComplete?: (blob: Blob) => void;
  onError?: (err: Error) => void;
  disabled?: boolean;
}

export const VoiceRecorderControl: React.FC<VoiceRecorderControlProps> = ({
  onRecordingComplete,
  onError,
}) => {
  const { status, toggleRecording, error } = useVoiceRecording(onRecordingComplete, onError);

    return (
      <div>
        <VoiceRecordButton status={status} onClick={toggleRecording} />
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error.message}</div>}
    </div>
  );
};
