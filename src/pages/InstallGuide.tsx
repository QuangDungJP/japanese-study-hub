import { Monitor, Smartphone, Apple, Share, MoreVertical, PlusSquare, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useEffect } from "react";

const InstallGuide = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-24 max-w-4xl">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Trở về trang chủ
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Hướng dẫn cài đặt ứng dụng</h1>
          <p className="text-lg text-muted-foreground">
            Làm theo các bước dưới đây để đưa ứng dụng ra màn hình chính của bạn, giúp truy cập nhanh chóng và trải nghiệm mượt mà hơn.
          </p>
        </div>

        <Tabs defaultValue="ios" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 h-14">
            <TabsTrigger value="ios" className="flex items-center gap-2 h-full">
              <Apple className="w-5 h-5" />
              <span className="hidden sm:inline">iOS / Safari</span>
              <span className="sm:hidden">iOS</span>
            </TabsTrigger>
            <TabsTrigger value="android" className="flex items-center gap-2 h-full">
              <Smartphone className="w-5 h-5" />
              <span className="hidden sm:inline">Android / Chrome</span>
              <span className="sm:hidden">Android</span>
            </TabsTrigger>
            <TabsTrigger value="pc" className="flex items-center gap-2 h-full">
              <Monitor className="w-5 h-5" />
              <span className="hidden sm:inline">Máy tính (PC/Mac)</span>
              <span className="sm:hidden">Máy tính</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ios">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Apple className="w-6 h-6" />
                  Cài đặt trên iPhone & iPad
                </CardTitle>
                <CardDescription>
                  Áp dụng khi bạn sử dụng trình duyệt Safari trên thiết bị iOS.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">1</div>
                  <div>
                    <p className="font-medium text-foreground mb-1">Mở menu chia sẻ</p>
                    <p className="text-muted-foreground text-sm flex items-center gap-2">
                      Nhấn vào biểu tượng <Share className="w-5 h-5 text-blue-500 inline-block mx-1" /> (Chia sẻ) ở thanh công cụ dưới cùng của trình duyệt Safari.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">2</div>
                  <div>
                    <p className="font-medium text-foreground mb-1">Thêm vào màn hình chính</p>
                    <p className="text-muted-foreground text-sm flex items-center gap-2">
                      Cuộn xuống trong danh sách các tuỳ chọn và chọn <PlusSquare className="w-5 h-5 text-gray-700 dark:text-gray-300 inline-block mx-1" /> <strong>Thêm vào MH chính</strong> (Add to Home Screen).
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">3</div>
                  <div>
                    <p className="font-medium text-foreground mb-1">Xác nhận thêm</p>
                    <p className="text-muted-foreground text-sm">
                      Nhấn vào chữ <strong>"Thêm"</strong> (Add) ở góc trên cùng bên phải. Biểu tượng ứng dụng sẽ xuất hiện trên màn hình chính của bạn.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="android">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-6 h-6" />
                  Cài đặt trên thiết bị Android
                </CardTitle>
                <CardDescription>
                  Áp dụng khi bạn sử dụng Chrome hoặc các trình duyệt khác trên Android.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">1</div>
                  <div>
                    <p className="font-medium text-foreground mb-1">Mở menu tuỳ chọn</p>
                    <p className="text-muted-foreground text-sm flex items-center gap-2">
                      Nhấn vào biểu tượng <MoreVertical className="w-5 h-5 text-gray-700 dark:text-gray-300 inline-block mx-1" /> (3 chấm dọc) ở góc trên cùng bên phải của trình duyệt Chrome.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">2</div>
                  <div>
                    <p className="font-medium text-foreground mb-1">Chọn cài đặt</p>
                    <p className="text-muted-foreground text-sm">
                      Trong menu hiện ra, chọn dòng <strong>"Cài đặt ứng dụng"</strong> (Install app) hoặc <strong>"Thêm vào màn hình chính"</strong> (Add to Home screen).
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">3</div>
                  <div>
                    <p className="font-medium text-foreground mb-1">Xác nhận</p>
                    <p className="text-muted-foreground text-sm">
                      Nhấn nút <strong>"Cài đặt"</strong> hoặc <strong>"Thêm"</strong> trong bảng thông báo hiện lên. Ứng dụng sẽ được tải xuống và tự động thêm vào màn hình chính của bạn.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pc">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="w-6 h-6" />
                  Cài đặt trên Máy tính (PC / Mac)
                </CardTitle>
                <CardDescription>
                  Áp dụng cho trình duyệt Chrome, Edge, Cốc Cốc trên máy tính.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">1</div>
                  <div>
                    <p className="font-medium text-foreground mb-1">Tìm biểu tượng cài đặt trên thanh địa chỉ</p>
                    <p className="text-muted-foreground text-sm">
                      Quan sát bên trong thanh địa chỉ web (nơi nhập URL), ở góc bên phải (gần biểu tượng dấu sao) sẽ có một <strong>biểu tượng hình màn hình có dấu mũi tên tải xuống</strong>.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">2</div>
                  <div>
                    <p className="font-medium text-foreground mb-1">Cài đặt ứng dụng</p>
                    <p className="text-muted-foreground text-sm">
                      Nhấn vào biểu tượng đó, sau đó chọn <strong>"Cài đặt"</strong> (Install).
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">3</div>
                  <div>
                    <p className="font-medium text-foreground mb-1">Trải nghiệm ngay</p>
                    <p className="text-muted-foreground text-sm">
                      Hoặc cách khác, bạn có thể nhấn vào nút <strong>Menu (3 chấm)</strong> ở góc phải trình duyệt, chọn <strong>"Cài đặt ứng dụng"</strong> hoặc <strong>"Truyền, lưu và chia sẻ" {'>'} "Cài đặt ứng dụng"</strong>. Ứng dụng sẽ mở ra như một phần mềm độc lập trên máy tính của bạn.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default InstallGuide;
