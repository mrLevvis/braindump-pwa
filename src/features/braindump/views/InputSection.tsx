import TextInput from '../../../components/ui/TextInput';
import VoiceRecordButton from '../../../components/voice/VoiceRecordButton';
import TextSubmitButton from '../../../components/ui/TextSubmitButton';

export default function InputSection({
  textValue,
  onTextChange,
  onTextSubmit,
  isRecording,
  onVoiceClick,
  disabled = false,
}:
{
  textValue: string;
  onTextChange: (value: string) => void;
  onTextSubmit: () => void;
  isRecording: boolean;
  onVoiceClick: () => void;
  disabled?: boolean;
})

{
  const isTextInputDisabled = disabled || isRecording;

  return (
    <div>
      <TextInput
        value={textValue}
        onChange={onTextChange}
        onSubmit={onTextSubmit}
        disabled={isTextInputDisabled}
      />
      
      <VoiceRecordButton
        isRecording={isRecording}
        onClick={onVoiceClick}
        disabled={disabled}
      />

      <TextSubmitButton
        onClick={onTextSubmit}
        disabled={isTextInputDisabled || textValue.trim() === ''}
      />
    </div>
  );
}
