interface VoiceRecordButtonProps {
  isRecording?: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export const VoiceRecordButton = ({ isRecording = false, onClick, disabled }: VoiceRecordButtonProps) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      data-recording={isRecording ? 'true' : 'false'}
      className="liquid-record-btn relative flex h-14 w-14 items-center justify-center rounded-full transition-transform duration-150 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[color:rgba(123,227,255,0.45)] focus:ring-offset-2 focus:ring-offset-[color:#0c2246] disabled:cursor-not-allowed disabled:opacity-50"
      aria-label={isRecording ? 'Aufnahme stoppen' : 'Aufnahme starten'}
      aria-pressed={isRecording}
    >
      {/* Einfaches SVG-Mikrofon-Icon */}
      <svg
        className="h-6 w-6 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
        />
      </svg>
    </button>
  );
};