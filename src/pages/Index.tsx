import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import JLPTSection from "@/components/JLPTSection";
import KanaSection from "@/components/KanaSection";
import ResourcesSection from "@/components/ResourcesSection";
import Footer from "@/components/Footer";

const Index = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <HeroSection />
    <div id="jlpt"><JLPTSection /></div>
    <div id="kana"><KanaSection /></div>
    <div id="resources"><ResourcesSection /></div>
    <Footer />
  </div>
);

export default Index;
