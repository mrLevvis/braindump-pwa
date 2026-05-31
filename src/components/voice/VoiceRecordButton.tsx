import type { VoiceRecordButtonProps } from '../../features/braindump/types';
//import './VoiceRecordButton.css';

export default function VoiceRecordButton({ status, onClick }: VoiceRecordButtonProps) {
  // Button ist gesperrt, solange auf Mikrofon-Freigabe oder auf die KI gewartet wird.
  const isDisabled = status === 'requesting' || status === 'processing';

  let label = '[REC]';
  let buttonClass = 'voice-record-btn';

  if (status === 'requesting') {
    label = '...';
    buttonClass += ' voice-record-btn--requesting';
  } else if (status === 'recording') {
    label = '[STOP]';
    buttonClass += ' voice-record-btn--recording';
  } else if (status === 'processing') {
    label = 'KI analysiert...';
    buttonClass += ' voice-record-btn--processing';
  }

  return (
    <button type="button" onClick={onClick} disabled={isDisabled} className={buttonClass}>
      {label}
    </button>
  );
}