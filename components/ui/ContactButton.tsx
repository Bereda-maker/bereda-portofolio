export default function ContactButton({ className = '' }: { className?: string }) {
  return (
    <a href="#contact" className={`cbtn ${className}`}>
      Let&apos;s talk <span aria-hidden="true">↗</span>
    </a>
  );
}
