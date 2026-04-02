import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const hiragana = [
  ["あ a","い i","う u","え e","お o"],
  ["か ka","き ki","く ku","け ke","こ ko"],
  ["さ sa","し shi","す su","せ se","そ so"],
  ["た ta","ち chi","つ tsu","て te","と to"],
  ["な na","に ni","ぬ nu","ね ne","の no"],
  ["は ha","ひ hi","ふ fu","へ he","ほ ho"],
  ["ま ma","み mi","む mu","め me","も mo"],
  ["ら ra","り ri","る ru","れ re","ろ ro"],
  ["や ya","　","ゆ yu","　","よ yo"],
  ["わ wa","　","　","　","を wo"],
];

const katakana = [
  ["ア a","イ i","ウ u","エ e","オ o"],
  ["カ ka","キ ki","ク ku","ケ ke","コ ko"],
  ["サ sa","シ shi","ス su","セ se","ソ so"],
  ["タ ta","チ chi","ツ tsu","テ te","ト to"],
  ["ナ na","ニ ni","ヌ nu","ネ ne","ノ no"],
  ["ハ ha","ヒ hi","フ fu","ヘ he","ホ ho"],
  ["マ ma","ミ mi","ム mu","メ me","モ mo"],
  ["ラ ra","リ ri","ル ru","レ re","ロ ro"],
  ["ヤ ya","　","ユ yu","　","ヨ yo"],
  ["ワ wa","　","　","　","ヲ wo"],
];

const KanaTable = ({ data }: { data: string[][] }) => (
  <div className="grid grid-cols-5 gap-2 max-w-2xl mx-auto">
    {data.flat().map((cell, i) => {
      const isEmpty = cell.trim() === "　";
      if (isEmpty) return <div key={i} />;
      const [char, romaji] = cell.split(" ");
      return (
        <div key={i} className="group bg-card border border-border rounded-lg p-3 text-center hover:border-accent hover:shadow-md transition-all cursor-pointer">
          <div className="text-2xl font-heading text-foreground group-hover:text-accent transition-colors">{char}</div>
          <div className="text-xs text-muted-foreground mt-1">{romaji}</div>
        </div>
      );
    })}
  </div>
);

const KanaSection = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold font-heading text-foreground">Bảng chữ cái</h2>
          <p className="text-muted-foreground mt-3">Nền tảng của tiếng Nhật — Hiragana & Katakana</p>
        </div>

        <Tabs defaultValue="hiragana" className="w-full">
          <TabsList className="mx-auto flex w-fit mb-8">
            <TabsTrigger value="hiragana" className="font-heading text-base px-6">ひらがな Hiragana</TabsTrigger>
            <TabsTrigger value="katakana" className="font-heading text-base px-6">カタカナ Katakana</TabsTrigger>
          </TabsList>
          <TabsContent value="hiragana">
            <KanaTable data={hiragana} />
          </TabsContent>
          <TabsContent value="katakana">
            <KanaTable data={katakana} />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default KanaSection;
