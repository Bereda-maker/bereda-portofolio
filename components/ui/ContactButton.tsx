export default function ContactButton({ className = '' }: { className?: string }) {
  return (
    <a href="#contact" className={`cbtn inline-block rounded-full text-white font-medium uppercase tracking-widest px-8 py-3 sm:px-10 sm:py-3.5 md:px-12 md:py-4 text-xs sm:text-sm md:text-base ${className}`}>
      Contact Me
    </a>
  );
}
