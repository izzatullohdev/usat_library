export default function Loading() {
  return (
    <div className="flex items-center justify-center h-screen bg-[#21466D]">
      <div className="relative w-20 h-20">
        {/* Orqa aylana */}
        <div className="absolute inset-0 rounded-full border-4 border-[#FFC82A] opacity-30"></div>
        {/* Aylanayotgan qismi */}
        <div className="absolute inset-0 rounded-full border-4 border-t-[#FFC82A] border-r-[#FFC82A] border-b-transparent border-l-transparent animate-spin"></div>
      </div>
    </div>
  );
}
