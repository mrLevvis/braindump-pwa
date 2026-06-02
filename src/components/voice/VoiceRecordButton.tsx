import { LoaderCircle, Mic } from 'lucide-react';
import { Button } from '../ui/button';
import type { VoiceRecordButtonProps } from '../../features/braindump/types';

const VOICE_BUTTON_BASE_CLASS_NAME = ['shrink-0'].join(' ');
const VOICE_BUTTON_RECORDING_CLASS_NAME = ['border-destructive/40', 'bg-destructive/10', 'text-destructive', 'hover:bg-destructive/15'].join(' ');
const VOICE_BUTTON_PENDING_CLASS_NAME = ['text-muted-foreground'].join(' ');
const VOICE_ICON_CLASS_NAME = ['size-4'].join(' ');
const VOICE_ICON_RECORDING_CLASS_NAME = ['animate-pulse'].join(' ');
const VOICE_ICON_SPINNER_CLASS_NAME = ['size-4', 'animate-spin'].join(' ');

const VOICE_BUTTON_CONFIG: Record<VoiceRecordButtonProps['status'], Readonly<{ label: string; variant: 'default' | 'outline' | 'secondary' | 'destructive'; className: string; icon: 'mic' | 'spinner'; disabled: boolean }>> = {
  idle: {
    label: 'Voice input',
    variant: 'outline',
    className: '',
    icon: 'mic',
    disabled: false,
  },
  requesting: {
    label: 'Requesting microphone',
    variant: 'secondary',
    className: VOICE_BUTTON_PENDING_CLASS_NAME,
    icon: 'spinner',
    disabled: true,
  },
  recording: {
    label: 'Stop recording',
    variant: 'destructive',
    className: VOICE_BUTTON_RECORDING_CLASS_NAME,
    icon: 'mic',
    disabled: false,
  },
  processing: {
    label: 'Processing recording',
    variant: 'secondary',
    className: VOICE_BUTTON_PENDING_CLASS_NAME,
    icon: 'spinner',
    disabled: true,
  },
};

export function VoiceRecordButton({ status, onClick }: Readonly<VoiceRecordButtonProps>) {
  const buttonConfig = VOICE_BUTTON_CONFIG[status];

  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={buttonConfig.disabled}
      variant={buttonConfig.variant}
      size="icon"
      aria-label={buttonConfig.label}
      aria-pressed={status === 'recording'}
      className={[VOICE_BUTTON_BASE_CLASS_NAME, buttonConfig.className].filter(Boolean).join(' ')}
    >
      {buttonConfig.icon === 'spinner' ? (
        <LoaderCircle className={VOICE_ICON_SPINNER_CLASS_NAME} />
      ) : (
        <Mic className={[VOICE_ICON_CLASS_NAME, status === 'recording' ? VOICE_ICON_RECORDING_CLASS_NAME : ''].filter(Boolean).join(' ')} />
      )}
    </Button>
  );
}

export default VoiceRecordButton;