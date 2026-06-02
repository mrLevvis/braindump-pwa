import { Send } from 'lucide-react';
import { Button } from './button';

const SEND_ICON_CLASS_NAME = ['size-4'].join(' ');

export function TextSubmitButton({
  onClick,
  disabled = false,
}: Readonly<{
  onClick: () => void;
  disabled?: boolean;
}>) {
  return (
    <Button type="button" onClick={onClick} disabled={disabled} size="icon" aria-label="Send note">
      <Send className={SEND_ICON_CLASS_NAME} />
    </Button>
  );
}

export default TextSubmitButton;