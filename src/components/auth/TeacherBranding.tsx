import { motion } from 'framer-motion';

const TeacherBranding = () => (
  <motion.div
    initial={{ opacity: 0, x: 40 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.5 }}
    className="lg:col-span-5 relative flex flex-col items-center"
  >
    <div className="absolute w-64 md:w-80 lg:w-[420px] aspect-square border-[12px] md:border-[20px] border-[#E5E1D1] rounded-full -z-10" />
    <div className="relative flex justify-center">
      <img
        src="/teachers/trieu.png"
        alt="teacher"
        className="w-3/4 md:w-2/3 lg:w-full object-contain drop-shadow-2xl hover:scale-105 transition"
      />
      <div className="hidden md:flex absolute -right-10 top-0 h-full items-center">
        <span className="[writing-mode:vertical-rl] text-[#2D3E50] font-black text-xl lg:text-3xl uppercase whitespace-nowrap">
          Tiếng Nhật Quang Dũng Online
        </span>
      </div>
    </div>
    <div className="mt-6 max-w-md px-4">
      <p className="text-[#1A3350] text-base md:text-lg font-bold italic text-center lg:text-right">
        "Bạn đã có những ngày tháng làm việc mệt mỏi... năm 50, 60 bạn sẽ rơi vào vòng lặp hối tiếc"
      </p>
    </div>
  </motion.div>
);

export default TeacherBranding;
