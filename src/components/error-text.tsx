export function ErrorText({ text }: { text: string }) {
  return (
    <div className="p-3 mb-4 text-sm text-red-500 bg-red-100 rounded-md">
      {text}
    </div>
  );
}
