import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun, Monitor, Loader2, Sparkles, RefreshCcw, Camera } from "lucide-react";
import { useTheme } from "./theme-provider";
import { SakuraPetals } from "./sakura-petals";
import { useAnalyzeSetup } from "@workspace/api-client-react";
import { AnalysisResult } from "@workspace/api-client-react/src/generated/api.schemas";
import { Progress } from "@/components/ui/progress";

type ViewState = "hero" | "upload" | "analyzing" | "results";

const CATEGORY_NAMES: Record<string, string> = {
  aesthetics: "Эстетика",
  lighting: "Освещение",
  cleanliness: "Чистота",
  ergonomics: "Эргономика",
  cable_management: "Кабель-менеджмент",
  atmosphere: "Атмосфера",
  minimalism: "Минимализм",
};

export function HomePage() {
  const [viewState, setViewState] = useState<ViewState>("hero");
  const { theme, setTheme } = useTheme();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const analyzeSetup = useAnalyzeSetup();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
      setViewState("upload");
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const startAnalysis = () => {
    if (!imageFile || !imagePreview) return;
    
    setViewState("analyzing");
    
    const base64String = imagePreview.split(',')[1];
    
    analyzeSetup.mutate(
      { data: { imageBase64: base64String, mimeType: imageFile.type } },
      {
        onSuccess: (data) => {
          setAnalysisResult(data);
          setViewState("results");
        },
        onError: (err) => {
          console.error(err);
          setViewState("upload");
        }
      }
    );
  };

  const reset = () => {
    setViewState("hero");
    setImageFile(null);
    setImagePreview(null);
    setAnalysisResult(null);
  };

  return (
    <div className="relative min-h-[100dvh] w-full overflow-x-hidden flex flex-col font-sans">
      <div className="fixed inset-0 pointer-events-none z-[-1] bg-gradient-to-br from-background via-background to-purple-900/20 dark:to-purple-900/30">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-50" />
        <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-50" />
      </div>
      
      <SakuraPetals />

      <header className="relative z-50 p-6 flex justify-end w-full max-w-7xl mx-auto">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded-full glass-panel hover:bg-white/20 dark:hover:bg-black/40 transition-colors"
        >
          {theme === "dark" ? <Sun className="w-5 h-5 text-primary" /> : <Moon className="w-5 h-5 text-primary" />}
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 w-full max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {viewState === "hero" && (
            <HeroState key="hero" onUploadClick={() => fileInputRef.current?.click()} onDrop={handleDrop} onDragOver={handleDragOver} />
          )}
          {viewState === "upload" && (
            <UploadState 
              key="upload" 
              imagePreview={imagePreview} 
              onStart={startAnalysis}
              onCancel={() => setViewState("hero")}
              isPending={analyzeSetup.isPending}
            />
          )}
          {viewState === "analyzing" && (
            <AnalyzingState key="analyzing" />
          )}
          {viewState === "results" && analysisResult && (
            <ResultsState 
              key="results" 
              result={analysisResult} 
              onReset={reset} 
            />
          )}
        </AnimatePresence>
      </main>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
        accept="image/png, image/jpeg, image/webp" 
        className="hidden" 
      />
    </div>
  );
}

function HeroState({ onUploadClick, onDrop, onDragOver }: { onUploadClick: () => void, onDrop: (e: React.DragEvent) => void, onDragOver: (e: React.DragEvent) => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center max-w-3xl flex flex-col items-center"
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-8 neon-glow backdrop-blur-md border border-primary/20">
        <Monitor className="w-10 h-10 text-primary" />
      </div>
      
      <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground to-primary">
        Оцени свой компьютерный сетап с помощью ИИ
      </h1>
      
      <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl font-light">
        Загрузи фото рабочего места и получи профессиональную оценку за несколько секунд
      </p>

      <button 
        onClick={onUploadClick}
        className="glass-panel neon-glow px-10 py-5 rounded-full text-xl font-medium text-foreground hover:scale-105 transition-all flex items-center gap-3 active:scale-95 group"
      >
        <Camera className="w-6 h-6 text-primary group-hover:animate-pulse" />
        Загрузить фото
      </button>
      
      <p className="mt-8 text-sm text-muted-foreground">
        или перетащите фото сюда
      </p>
    </motion.div>
  );
}

function UploadState({ imagePreview, onStart, onCancel, isPending }: { imagePreview: string | null, onStart: () => void, onCancel: () => void, isPending: boolean }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="w-full max-w-2xl flex flex-col items-center"
    >
      <div className="glass-panel w-full p-4 rounded-3xl mb-8 relative overflow-hidden">
        {imagePreview ? (
          <img src={imagePreview} alt="Setup preview" className="w-full h-[400px] object-cover rounded-2xl" />
        ) : (
          <div className="w-full h-[400px] bg-muted/50 rounded-2xl flex items-center justify-center">
            <Camera className="w-12 h-12 text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <button 
          onClick={onCancel}
          disabled={isPending}
          className="glass-panel px-8 py-4 rounded-full font-medium text-muted-foreground hover:bg-white/20 dark:hover:bg-black/40 transition-colors disabled:opacity-50"
        >
          Отмена
        </button>
        <button 
          onClick={onStart}
          disabled={isPending}
          className="glass-panel neon-glow bg-primary/10 px-10 py-4 rounded-full font-medium text-foreground hover:scale-105 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
        >
          {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 text-primary" />}
          Начать анализ
        </button>
      </div>
    </motion.div>
  );
}

function AnalyzingState() {
  const [hintIndex, setHintIndex] = useState(0);
  const hints = [
    "Анализ освещения...", 
    "Анализ эстетики...", 
    "Анализ эргономики...", 
    "Анализ кабелей...", 
    "Анализ атмосферы..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setHintIndex((prev) => (prev + 1) % hints.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center text-center"
    >
      <div className="relative w-32 h-32 mb-12">
        <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-primary animate-pulse" />
        </div>
      </div>
      
      <h2 className="text-3xl font-medium mb-4">ИИ анализирует ваш сетап...</h2>
      
      <AnimatePresence mode="wait">
        <motion.p
          key={hintIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="text-xl text-primary font-light"
        >
          {hints[hintIndex]}
        </motion.p>
      </AnimatePresence>
    </motion.div>
  );
}

function ResultsState({ result, onReset }: { result: AnalysisResult, onReset: () => void }) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="w-full max-w-5xl py-12"
    >
      <motion.div variants={item} className="flex flex-col md:flex-row items-center gap-12 mb-16">
        <div className="relative flex-shrink-0 flex items-center justify-center w-48 h-48 rounded-full glass-panel neon-glow border-primary/30">
          <svg className="w-full h-full -rotate-90 absolute inset-0" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-primary/10" />
            <motion.circle 
              cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" 
              className="text-primary"
              strokeDasharray="283"
              initial={{ strokeDashoffset: 283 }}
              animate={{ strokeDashoffset: 283 - (283 * result.overall_score) / 10 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </svg>
          <div className="flex flex-col items-center">
            <span className="text-5xl font-bold">{result.overall_score}</span>
            <span className="text-sm text-muted-foreground">из 10</span>
          </div>
        </div>
        
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Оценка завершена</h2>
          <p className="text-xl text-muted-foreground font-light leading-relaxed">
            Ваш сетап проанализирован. Смотри подробности ниже.
          </p>
        </div>
      </motion.div>

      <motion.div variants={item} className="glass-panel p-8 rounded-3xl mb-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-primary" />
        <h3 className="text-xl font-medium mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" /> 
          Вердикт
        </h3>
        <p className="text-lg leading-relaxed">{result.review}</p>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {Object.entries(result.categories).map(([key, data]) => (
          <div key={key} className="glass-panel p-6 rounded-2xl hover:-translate-y-1 transition-transform">
            <div className="flex justify-between items-center mb-4">
              <span className="font-medium text-lg">{CATEGORY_NAMES[key] || key}</span>
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-sm">
                {data.score}/10
              </span>
            </div>
            <Progress value={data.score * 10} className="h-2 mb-4 bg-primary/10" indicatorClassName="bg-primary" />
            <p className="text-sm text-muted-foreground">{data.comment}</p>
          </div>
        ))}
      </motion.div>

      <motion.div variants={item} className="mb-16">
        <h3 className="text-2xl font-medium mb-6">Рекомендации</h3>
        <div className="grid gap-4">
          {result.tips.map((tip, i) => (
            <div key={i} className="glass-panel p-5 rounded-2xl flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 font-bold">
                {i + 1}
              </div>
              <p className="text-lg pt-0.5">{tip}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div variants={item} className="flex justify-center">
        <button 
          onClick={onReset}
          className="glass-panel px-8 py-4 rounded-full font-medium text-foreground hover:bg-white/20 dark:hover:bg-black/40 transition-all flex items-center gap-3 hover:scale-105 active:scale-95"
        >
          <RefreshCcw className="w-5 h-5 text-primary" />
          Проанализировать другой сетап
        </button>
      </motion.div>
    </motion.div>
  );
}
