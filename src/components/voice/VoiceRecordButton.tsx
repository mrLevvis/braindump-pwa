export default function VoiceRecordButton(
  {
    isRecording = false,
    onClick,
    disabled = false,
  }:
  {
    isRecording?: boolean;
    onClick: () => void;
    disabled?: boolean;
  })
{
  return (
    <button type="button" onClick={onClick} disabled={disabled}>
      {isRecording ? '[REC]' : '[Sprechen]'}
    </button>
  );
}