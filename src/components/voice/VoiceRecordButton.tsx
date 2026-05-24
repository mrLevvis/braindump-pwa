/* -------------------------------------------------------------------------- */
/*                                   Props                                    */
/* -------------------------------------------------------------------------- */

interface VoiceRecordButtonProps {
  isRecording?: boolean;
  onClick: () => void;
  disabled?: boolean;
}

/* -------------------------------------------------------------------------- */
/*                              Styling Tokens                                */
/* -------------------------------------------------------------------------- */

const BUTTON_CLASS = [
  'liquid-record-btn',
  'relative',
  'flex',
  'h-[56px]',
  'w-[56px]',
  'items-center',
  'justify-center',
  'rounded-full',
  'transition-transform',
  'duration-180',
  'hover:scale-[1.02]',
  'focus:outline-none',
  'focus:shadow-[0_0_0_3px_rgba(124,58,237,0.5)]',
  'disabled:cursor-not-allowed',
  'disabled:opacity-50',
].join(' ');

const ICON_CLASS = 'h-6 w-6 text-white';
const MICROPHONE_ICON_PATH = 'M12 19l9 2-9-18-9 18 9-2zm0 0v-8';

/* -------------------------------------------------------------------------- */
/*                              UI Component                                  */
/* -------------------------------------------------------------------------- */

export const VoiceRecordButton = ({
  isRecording = false,
  onClick,
  disabled = false,
}: Readonly<VoiceRecordButtonProps>) => {
  const ariaLabel = isRecording ? 'Aufnahme stoppen' : 'Aufnahme starten';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-recording={isRecording ? 'true' : 'false'}
      className={BUTTON_CLASS}
      aria-label={ariaLabel}
      aria-pressed={isRecording}
    >
      <svg
        className={ICON_CLASS}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d={MICROPHONE_ICON_PATH}
        />
      </svg>
    </button>
  );
};