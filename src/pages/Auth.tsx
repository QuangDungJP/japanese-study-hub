import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const fields = [
    { label: "Họ tên", show: !isLogin },
    { label: "E-mail", type: "email", show: true },
    { label: "SĐT", show: !isLogin },
    { label: "Mật khẩu", type: "password", show: true },
    { label: "Nhập lại mật khẩu", type: "password", show: !isLogin },
  ];

  return (
    <div className="min-h-screen bg-[#FEF9E7] flex flex-col text-[#1A1A1A]">

      {/* HEADER */}
      <header className="w-full max-w-7xl mx-auto px-4 md:px-8 py-5 flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-sm md:text-base lg:text-lg italic text-gray-700 text-center md:text-left max-w-xl">
          Chào mừng bạn đến với mạng lưới đào tạo Nhật ngữ trực tuyến hàng đầu Việt Nam
        </h2>

        <button className="bg-[#FFB039] hover:bg-[#ff9f10] text-white px-6 py-2 rounded-md font-bold shadow transition">
          Đăng xuất
        </button>
      </header>

      {/* MAIN */}
      <main className="flex-1 flex items-center justify-center px-4 md:px-8 py-10">
        <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">

          {/* LEFT - FORM */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-7 space-y-6"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-center lg:text-left">
              {isLogin ? "Đăng nhập" : "Đăng ký"}
            </h1>

            <form className="space-y-4">

              {fields
                .filter((f) => f.show)
                .map((field, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4"
                  >
                    <label className="md:w-40 text-base md:text-lg font-bold shrink-0">
                      {field.label}
                    </label>

                    <Input
                      type={field.type || "text"}
                      placeholder={`Nhập ${field.label.toLowerCase()}`}
                      className="flex-1 h-12 bg-white shadow-inner border-none focus-visible:ring-2 focus-visible:ring-blue-600"
                    />
                  </div>
                ))}

              {/* ACTION */}
              <div className="md:pl-40 pt-4 space-y-4 text-center md:text-left">

                <div className="text-sm md:text-base space-y-2">
                  <p>
                    {isLogin
                      ? "Bạn chưa có tài khoản? "
                      : "Bạn đã có tài khoản? "}
                    <button
                      type="button"
                      onClick={() => setIsLogin(!isLogin)}
                      className="text-blue-700 font-bold hover:underline"
                    >
                      {isLogin ? "Đăng ký" : "Đăng nhập"}
                    </button>
                  </p>

                  {isLogin && (
                    <div className="flex flex-wrap justify-center md:justify-start gap-4">
                      <Link to="#" className="text-blue-700 font-bold hover:underline">
                        Quên mật khẩu?
                      </Link>
                      <Link to="#" className="text-blue-700 font-bold hover:underline">
                        Đăng nhập giáo viên
                      </Link>
                    </div>
                  )}
                </div>

                <Button
                  className="bg-blue-700 hover:bg-blue-800 text-white text-lg md:text-xl font-bold px-8 py-3 rounded-md shadow-lg transition active:scale-95 w-full sm:w-auto"
                  onClick={(e) => {
                    e.preventDefault();
                    setLoading(true);
                    setTimeout(() => setLoading(false), 1500);
                  }}
                >
                  {loading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    "Xác nhận"
                  )}
                </Button>
              </div>
            </form>
          </motion.div>

          {/* RIGHT - IMAGE */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-5 relative flex flex-col items-center"
          >
            {/* BACKGROUND CIRCLE */}
            <div className="absolute w-64 md:w-80 lg:w-[420px] aspect-square border-[12px] md:border-[20px] border-[#E5E1D1] rounded-full -z-10" />

            <div className="relative flex justify-center">
              <img
                src="/teachers/trieu.png"
                alt="teacher"
                className="w-3/4 md:w-2/3 lg:w-full object-contain drop-shadow-2xl hover:scale-105 transition"
              />

              {/* VERTICAL TEXT */}
              <div className="hidden md:flex absolute -right-10 top-0 h-full items-center">
                <span className="[writing-mode:vertical-rl] text-[#2D3E50] font-black text-xl lg:text-3xl uppercase whitespace-nowrap">
                  Tiếng Nhật Quang Dũng Online
                </span>
              </div>
            </div>

            {/* QUOTE */}
            <div className="mt-6 max-w-md px-4">
              <p className="text-[#1A3350] text-base md:text-lg font-bold italic text-center lg:text-right">
                “Bạn đã có những ngày tháng làm việc mệt mỏi... năm 50, 60 bạn sẽ rơi vào vòng lặp hối tiếc”
              </p>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Auth;