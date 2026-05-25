export default function TextSubmitButton(
  {
    onClick,
    disabled = false,
  }:
  {
    onClick: () => void;
    disabled?: boolean;
  })
{
  return (
    <button type="button" onClick={onClick} disabled={disabled}>
      [Senden]
    </button>
  );
}