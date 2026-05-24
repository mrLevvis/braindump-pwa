import { TextInput } from '../../../components/ui/TextInput';
import { VoiceRecordButton } from '../../../components/voice/VoiceRecordButton';

/* -------------------------------------------------------------------------- */
/*                                   Props                                    */
/* -------------------------------------------------------------------------- */

interface InputSectionProps {
  textValue: string;
  onTextChange: (value: string) => void;
  onTextSubmit: () => void;
  isRecording: boolean;
  onVoiceClick: () => void;
  disabled?: boolean;
}

/* -------------------------------------------------------------------------- */
/*                              Styling Tokens                                */
/* -------------------------------------------------------------------------- */

const CONTAINER_CLASS = [
  'fixed',
  'bottom-0',
  'left-0',
  'right-0',
  'bg-gradient-to-t',
  'from-[color:rgba(8,6,19,0.95)]',
  'via-[color:rgba(8,6,19,0.72)]',
  'to-transparent',
  'px-4',
  'pb-[calc(env(safe-area-inset-bottom,0px)+14px)]',
  'pt-6',
].join(' ');

const PANEL_CLASS = [
  'glass-panel-soft',
  'mx-auto',
  'flex',
  'max-w-md',
  'items-center',
  'gap-3',
  'rounded-[24px]',
  'p-2.5',
].join(' ');

/* -------------------------------------------------------------------------- */
/*                              UI Component                                  */
/* -------------------------------------------------------------------------- */

export const InputSection = ({
  textValue,
  onTextChange,
  onTextSubmit,
  isRecording,
  onVoiceClick,
  disabled = false,
}: Readonly<InputSectionProps>) => {
  const isTextInputDisabled = disabled || isRecording;

  return (
    <div className={CONTAINER_CLASS}>
      <div className={PANEL_CLASS}>
        <div className="flex-1">
          <TextInput
            value={textValue}
            onChange={onTextChange}
            onSubmit={onTextSubmit}
            disabled={isTextInputDisabled}
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