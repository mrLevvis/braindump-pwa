import { TextInput, TextSubmitButton } from '../../../components/ui';
import VoiceRecordButton from '../../../components/voice/VoiceRecordButton';

export default function InputSection({
  textValue,
  onTextChange,
  onTextSubmit,
  status,
  onVoiceClick,
  disabled = false,
} : {
    textValue: string;
    onTextChange: (value: string) => void;
    onTextSubmit: () => void;
    status: import('../../../features/braindump/types').VoiceButtonStatus;
    onVoiceClick: () => void;
    disabled?: boolean;
  }) {
  const isTextInputDisabled = disabled || status === 'recording' || status === 'requesting';

  return (
    <div>
      <TextInput
        value={textValue}
        onChange={onTextChange}
        onSubmit={onTextSubmit}
        disabled={isTextInputDisabled}
      />

      <VoiceRecordButton
        status={status}
        onClick={onVoiceClick}
      />

      <TextSubmitButton
        onClick={onTextSubmit}
        disabled={isTextInputDisabled || textValue.trim() === ''}
      />
    </div>
  );
}
