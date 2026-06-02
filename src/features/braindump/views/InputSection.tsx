import { TextInput, TextSubmitButton } from '../../../components/ui';
import VoiceRecordButton from '../../../components/voice/VoiceRecordButton';

const INPUT_SECTION_CLASS_NAME = ['fixed', 'inset-x-0', 'bottom-0', 'z-30', 'border-t', 'bg-background'].join(' ');
const INPUT_SECTION_INNER_CLASS_NAME = ['mx-auto', 'flex', 'w-full', 'max-w-3xl', 'items-end', 'gap-2', 'px-4', 'py-3'].join(' ');

export default function InputSection({
  textValue,
  onTextChange,
  onTextSubmit,
  status,
  onVoiceClick,
  disabled = false,
}: Readonly<{
  textValue: string;
  onTextChange: (value: string) => void;
  onTextSubmit: () => void;
  status: import('../../../features/braindump/types').VoiceButtonStatus;
  onVoiceClick: () => void;
  disabled?: boolean;
}>) {
  const isTextInputDisabled = disabled || status === 'recording' || status === 'requesting';

  return (
    <div className={INPUT_SECTION_CLASS_NAME}>
      <div className={INPUT_SECTION_INNER_CLASS_NAME}>
        <TextInput
          value={textValue}
          onChange={onTextChange}
          onSubmit={onTextSubmit}
          disabled={isTextInputDisabled}
        />

        <VoiceRecordButton status={status} onClick={onVoiceClick} />

        <TextSubmitButton onClick={onTextSubmit} disabled={isTextInputDisabled || textValue.trim() === ''} />
      </div>
    </div>
  );
}
