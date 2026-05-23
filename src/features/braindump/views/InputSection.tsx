import { TextInput } from '../../../components/ui/TextInput';
import { VoiceRecordButton } from '../../../components/voice/VoiceRecordButton';

interface InputSectionProps {
  textValue: string;
  onTextChange: (value: string) => void;
  onTextSubmit: () => void;
  isRecording: boolean;
  onVoiceClick: () => void;
  disabled?: boolean;
}

export const InputSection = ({
  textValue,
  onTextChange,
  onTextSubmit,
  isRecording,
  onVoiceClick,
  disabled = false,
}: InputSectionProps) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+14px)] pt-6 bg-gradient-to-t from-[color:rgba(6,21,43,0.95)] via-[color:rgba(6,21,43,0.75)] to-transparent">
      <div className="glass-panel mx-auto flex max-w-md items-center gap-3 rounded-[18px] p-2.5">
        <div className="flex-1">
          <TextInput
            value={textValue}
            onChange={onTextChange}
            onSubmit={onTextSubmit}
            disabled={disabled || isRecording}
          />
        </div>
        <VoiceRecordButton
          isRecording={isRecording}
          onClick={onVoiceClick}
          disabled={disabled}
        />
      </div>
    </div>
  );
};