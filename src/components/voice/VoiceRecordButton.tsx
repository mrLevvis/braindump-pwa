import type { RecorderStatus } from '../../features/braindump/types';

export interface VoiceRecordButtonProps {
  status: RecorderStatus;
  onClick: () => void;
}

export default function VoiceRecordButton({ status, onClick }: VoiceRecordButtonProps) {
  const isDisabled = status === 'requesting';
  let label = '[REC]';
  let style: React.CSSProperties = {};
  if (status === 'requesting') {
    label = '...';
    style = { background: '#eee', color: '#888', cursor: 'wait' };
  } else if (status === 'recording') {
    label = '[STOP]';
    style = { background: 'red', color: 'white' };
  }
  return (
    <button type="button" onClick={onClick} disabled={isDisabled} style={style}>
      {label}
    </button>
  );
}


/**
 * export function VoiceRecordButton({ status, onClick }: VoiceRecordButtonProps) {
  // TODO: status === 'requesting' → disabled + Spinner/Pending-Optik
  // TODO: status === 'recording'  → aktive/rote Optik
  // TODO: status === 'idle'       → Default-Optik
  const isDisabled = status === 'requesting';

  return (
    <button onClick={onClick} disabled={isDisabled}>
      {/* TODO: Icon/Label je status}
    </button>
  );
}
*/

