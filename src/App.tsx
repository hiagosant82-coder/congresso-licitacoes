import { useState, useEffect } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { 
  Menu, 
  X, 
  Play, 
  CheckCircle2, 
  Users, 
  Gavel, 
  Plus,
  Minus,
  Briefcase,
  GraduationCap,
  ShieldCheck,
  TrendingUp,
  FastForward,
  Rewind
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import logo from './assets/logo.png';
import hero1 from './assets/hero-1.jpg';
import hero2 from './assets/hero-2.jpg';
import hero3 from './assets/hero-3.jpg';
import hero4 from './assets/hero-4.jpg';
import heroV1 from './assets/hero-v1.jpg';
import heroV2 from './assets/hero-v2.jpg';
import heroV3 from './assets/hero-v3.jpg';
import heroV4 from './assets/hero-v4.jpg';
import heroV5 from './assets/hero-v5.jpg';
import speaker1 from './assets/speaker1.png';
import speaker2 from './assets/speaker2.png';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 bg-[#0A0706]/90 backdrop-blur-md z-50 py-4 border-b border-amber-500/10">
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Envolve Logo" className="h-10 w-auto filter brightness-110" />
        </div>
        
        <div className="hidden md:flex items-center gap-10">
          <a href="#" className="text-stone-400 font-bold text-sm hover:text-amber-400 transition-all uppercase tracking-widest">Home</a>
          <a href="#palestrantes" className="text-stone-400 font-bold text-sm hover:text-amber-400 transition-all uppercase tracking-widest">Palestrantes</a>
          <a href="#programacao" className="text-stone-400 font-bold text-sm hover:text-amber-400 transition-all uppercase tracking-widest">Programação</a>
          <a href="#contato" className="text-stone-400 font-bold text-sm hover:text-amber-400 transition-all uppercase tracking-widest">Contato</a>
          <button className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-[#0E0B08] px-8 py-2.5 rounded-full font-bold text-sm shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:shadow-[0_0_25px_rgba(245,158,11,0.5)] transition-all uppercase tracking-widest duration-300">
            Inscrever-se
          </button>
        </div>

        <button className="md:hidden text-stone-200 hover:text-amber-400 transition-colors" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="md:hidden bg-[#0A0706] border-t border-amber-500/10 px-6 overflow-hidden">
            <div className="flex flex-col gap-4 py-6">
              <a href="#" className="font-bold text-stone-400 hover:text-amber-400 transition-colors uppercase tracking-widest" onClick={() => setIsOpen(false)}>Home</a>
              <a href="#palestrantes" className="font-bold text-stone-400 hover:text-amber-400 transition-colors uppercase tracking-widest" onClick={() => setIsOpen(false)}>Palestrantes</a>
              <a href="#programacao" className="font-bold text-stone-400 hover:text-amber-400 transition-colors uppercase tracking-widest" onClick={() => setIsOpen(false)}>Programação</a>
              <a href="#contato" className="font-bold text-stone-400 hover:text-amber-400 transition-colors uppercase tracking-widest" onClick={() => setIsOpen(false)}>Contato</a>
              <button className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-[#0E0B08] py-3 rounded-xl font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(245,158,11,0.2)]" onClick={() => setIsOpen(false)}>Inscrever-se</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-amber-500/10 hover:border-amber-500/30 rounded-xl mb-3 overflow-hidden bg-[#16120F]/40 backdrop-blur-sm transition-all duration-300">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-5 px-6 flex items-center gap-4 text-left group"
      >
        <div className="bg-amber-500/10 p-1.5 rounded-md text-amber-400 group-hover:bg-amber-500 group-hover:text-[#0E0B08] transition-all">
          {isOpen ? <Minus size={14} /> : <Plus size={14} />}
        </div>
        <span className="font-bold text-stone-200 group-hover:text-amber-200 text-sm md:text-base transition-all">{question}</span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="pb-5 px-6 text-stone-400 text-sm leading-relaxed">
            {answer}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const scheduleData: Record<number, { time: string, title: string, desc: string, img: string }[]> = {
  1: [
    { time: '08:00 - 08:30', title: 'Credenciamento, recepção e abertura', desc: 'Início oficial do evento', img: 'https://images.unsplash.com/photo-1540575861501-7ad060e39fe5?q=80&w=600' },
    { time: '08:30 - 10:00', title: 'Planejamento Operacional de Compras Públicas com IA', desc: '👨‍🏫 Prof. Ícaro Bitar', img: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=600' },
    { time: '10:00 - 10:20', title: 'Coffee Break & Networking', desc: 'Pausa para café', img: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=600' },
    { time: '10:20 - 11:50', title: 'Continuação da Palestra', desc: '👨‍🏫 Prof. Ícaro Bitar', img: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=600' },
    { time: '12:00 - 13:30', title: 'Intervalo para almoço', desc: 'Almoço livre', img: 'https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=600' },
    { time: '13:30 - 15:00', title: 'Contratação Direta: Dispensa e Inexigibilidade', desc: '👨‍🏫 Prof. Jamil Manasfi', img: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=600' },
    { time: '15:00 - 15:20', title: 'Coffee Break & Networking', desc: 'Pausa para café', img: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=600' },
    { time: '15:20 - 16:50', title: 'Continuação da Palestra', desc: '👨‍🏫 Prof. Jamil Manasfi', img: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=600' }
  ],
  2: [
    { time: '08:00 - 09:30', title: 'Seleção do Fornecedor: Pregão, Concorrência e Dispensa Eletrônica', desc: '👨‍🏫 Prof. Leandro Matsumota', img: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=600' },
    { time: '09:30 - 09:50', title: 'Coffee Break & Networking', desc: 'Pausa para café', img: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=600' },
    { time: '09:50 - 11:20', title: 'Continuação da Palestra', desc: '👨‍🏫 Prof. Leandro Matsumota', img: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=600' },
    { time: '12:00 - 13:30', title: 'Intervalo para almoço', desc: 'Almoço livre', img: 'https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=600' },
    { time: '13:30 - 15:00', title: 'Responsabilização dos Servidores perante os Órgãos de Controle (TCE-MT e TCU)', desc: '👩‍🏫 Prof. Camila Jacobsen', img: 'https://images.unsplash.com/photo-1505664173615-04f1bef7b504?q=80&w=600' },
    { time: '15:00 - 15:20', title: 'Coffee Break & Networking', desc: 'Pausa para café', img: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=600' },
    { time: '15:20 - 16:50', title: 'Credenciamento', desc: '👨‍🏫 Prof. Willen Rarytton', img: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?q=80&w=600' }
  ],
  3: [
    { time: '08:00 - 09:30', title: 'Gestão, Fiscalização e Execução de Contratos com uso de IA', desc: '👨‍🏫 Prof. Jader Esteves', img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600' },
    { time: '09:30 - 09:50', title: 'Coffee Break & Networking', desc: 'Pausa para café', img: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=600' },
    { time: '09:50 - 11:00', title: 'Continuação da Palestra', desc: '👨‍🏫 Prof. Jader Esteves', img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600' },
    { time: '11:00 - 11:30', title: 'Encerramento oficial', desc: '3º Congresso de Licitações do Vale do Araguaia', img: 'https://images.unsplash.com/photo-1540575861501-7ad060e39fe5?q=80&w=600' }
  ]
};

export default function App() {
  const [activeTab, setActiveTab] = useState(1);
  const [currentHBanner, setCurrentHBanner] = useState(0);
  const [currentVBanner, setCurrentVBanner] = useState(0);
  const hBanners = [hero1, hero2, hero3, hero4];
  const vBanners = [heroV1, heroV2, heroV3, heroV4, heroV5];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHBanner((prev) => (prev + 1) % hBanners.length);
      setCurrentVBanner((prev) => (prev + 1) % vBanners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [hBanners.length, vBanners.length]);

  return (
    <HelmetProvider>
      <div className="min-h-screen bg-[#0A0706] font-sans text-stone-200 selection:bg-amber-500/20 selection:text-amber-100">
        <Helmet>
          <title>3º Congresso de Licitações do Vale do Araguaia</title>
        </Helmet>

        <Navbar />

        {/* Hero Section */}
        <section className="pt-28 pb-8 px-4">
          {/* Desktop/Tablet Horizontal Carousel */}
          <div className="hidden md:block max-w-7xl mx-auto rounded-4xl overflow-hidden shadow-[0_0_50px_rgba(212,175,55,0.15)] border border-amber-500/10 bg-[#0e0e0e] relative">
             <img src={hBanners[0]} className="w-full h-auto invisible animate-pulse" alt="placeholder" />
             {hBanners.map((banner, index) => (
                <motion.img 
                  key={index}
                  src={banner}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: currentHBanner === index ? 1 : 0 }}
                  transition={{ duration: 1 }}
                  className="absolute inset-0 w-full h-full object-cover" 
                  alt={`Hero Banner ${index + 1}`} 
                />
             ))}
          </div>

          {/* Mobile Vertical Carousel */}
          <div className="block md:hidden max-w-md mx-auto rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(212,175,55,0.2)] border border-amber-500/15 bg-[#0e0e0e] relative">
             <img src={vBanners[0]} className="w-full h-auto invisible animate-pulse" alt="placeholder" />
             {vBanners.map((banner, index) => (
                <motion.img 
                  key={index}
                  src={banner}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: currentVBanner === index ? 1 : 0 }}
                  transition={{ duration: 1 }}
                  className="absolute inset-0 w-full h-full object-cover" 
                  alt={`Hero Vertical Banner ${index + 1}`} 
                />
             ))}
          </div>
        </section>

        {/* Info Section */}
        <section className="py-16 md:py-24 px-4 overflow-hidden bg-transparent">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <div className="relative w-full max-w-md aspect-square shrink-0">
               <div className="absolute inset-0 border border-dashed border-amber-500/10 rounded-full"></div>
               <div className="absolute inset-14 border border-dashed border-amber-500/5 rounded-full"></div>
               <div className="absolute inset-28 border border-dashed border-amber-500/3 rounded-full"></div>
               
               <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-[#16120F] rounded-full p-1 shadow-[0_8px_20px_rgba(0,0,0,0.6)] border border-amber-500/30 overflow-hidden">
                  <img src="https://i.pravatar.cc/100?u=1" className="w-full h-full rounded-full object-cover grayscale opacity-80" alt="Team" />
               </div>
               <div className="absolute bottom-12 left-0 -translate-x-1/2 w-14 h-14 bg-[#16120F] rounded-full p-1 shadow-[0_8px_20px_rgba(0,0,0,0.6)] border border-amber-500/30 overflow-hidden">
                  <img src="https://i.pravatar.cc/100?u=2" className="w-full h-full rounded-full object-cover grayscale opacity-80" alt="Team" />
               </div>
               <div className="absolute top-1/4 right-0 translate-x-1/2 w-20 h-20 bg-[#16120F] rounded-full p-1.5 shadow-[0_8px_20px_rgba(0,0,0,0.6)] border border-amber-500/30 overflow-hidden">
                  <img src="https://i.pravatar.cc/100?u=3" className="w-full h-full rounded-full object-cover grayscale opacity-80" alt="Team" />
               </div>
               <div className="absolute bottom-0 right-1/4 translate-x-1/2 translate-y-1/2 w-16 h-16 bg-[#16120F] rounded-full p-1 shadow-[0_8px_20px_rgba(0,0,0,0.6)] border border-amber-500/30 overflow-hidden">
                  <img src="https://i.pravatar.cc/100?u=4" className="w-full h-full rounded-full object-cover grayscale opacity-80" alt="Team" />
               </div>
               
               <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-32 h-32 bg-[#281E17] rounded-full border-4 border-amber-500 shadow-[0_0_35px_rgba(212,175,55,0.3)] flex items-center justify-center p-1 overflow-hidden">
                    <img src="https://i.pravatar.cc/100?u=5" className="w-full h-full rounded-full object-cover opacity-90" alt="Main" />
                 </div>
               </div>
            </div>

            <div className="space-y-10 flex-1">
              <h2 className="text-4xl md:text-5xl font-black text-stone-100 leading-[1.1] tracking-tighter">
                Domine as <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">Licitações Públicas</span> com a nova Lei de Licitações.
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8">
                {[
                  { title: 'Networking', desc: 'Troque experiências com profissionais da área.' },
                  { title: 'Networking', desc: 'Troque experiências com profissionais da área.' },
                  { title: 'Mentoring', desc: 'Receba orientações de grandes especialistas.' },
                  { title: 'Mentoring', desc: 'Receba orientações de grandes especialistas.' }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-[#0E0B08] shrink-0 mt-1 shadow-[0_2px_8px_rgba(245,158,11,0.3)]">
                      <CheckCircle2 size={12} strokeWidth={3} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-black text-amber-200/90 text-sm uppercase tracking-tight">{item.title}</h4>
                      <p className="text-[11px] text-stone-400 leading-tight">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <p className="text-stone-500 text-[10px] italic leading-relaxed max-w-xl">
                * As vagas são limitadas devido à capacidade do auditório. Recomendamos garantir seu lugar com antecedência para não perder as sessões de networking exclusivas.
              </p>
            </div>
          </div>
        </section>

        {/* Speakers Section */}
        <section id="palestrantes" className="py-16 md:py-24 bg-gradient-to-b from-[#0A0706] to-[#120F0D] px-6">
          <div className="max-w-7xl mx-auto text-center mb-12 md:mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-black text-stone-100 uppercase tracking-tighter">
              Nossos <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">Palestrantes</span>
            </h2>
            <p className="text-stone-400 text-sm max-w-2xl mx-auto font-medium">Reunimos os maiores nomes do Brasil para compartilhar conhecimento e experiências reais e atualizadas.</p>
          </div>
          
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Sérgio Soares', role: 'Presidente do TCE-MT', image: speaker1 },
              { name: 'Adriana Lima', role: 'Doutora em Direito', image: speaker2 },
              { name: 'Teodorico Menezes', role: 'Presidente da OAB', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600' },
            ].map((s, i) => (
              <div key={i} className="group relative aspect-[3/4] rounded-[2.5rem] overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.7)] border border-amber-500/10 hover:border-amber-500/30 transition-all duration-500">
                <img src={s.image} alt={s.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 filter brightness-95 contrast-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-transparent"></div>
                <div className="absolute bottom-10 left-10 text-white space-y-1">
                  <h3 className="text-2xl font-black text-amber-50">{s.name}</h3>
                  <p className="text-amber-400 font-bold uppercase tracking-[0.2em] text-[10px]">{s.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Schedule Section */}
        <section id="programacao" className="py-16 md:py-24 px-6 bg-gradient-to-b from-[#120F0D] to-[#0A0706]">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-6 md:gap-10 mb-12 md:mb-16">
            <div className="space-y-4 max-w-2xl">
              <h2 className="text-3xl md:text-5xl font-black text-stone-100 tracking-tighter">
                Programação do <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">Evento</span>
              </h2>
              <p className="text-stone-400 text-sm font-medium">Preparamos uma jornada intensa de aprendizado dividida em três dias temáticos com palestras e oficinas práticas de preenchimento.</p>
            </div>
            
            <div className="flex flex-wrap gap-2 md:gap-0 bg-[#181310] border border-amber-500/10 p-1.5 rounded-3xl md:rounded-full">
              {[
                { id: 1, date: '26 de Agosto' },
                { id: 2, date: '27 de Agosto' },
                { id: 3, date: '28 de Agosto' }
              ].map((tab) => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all",
                    activeTab === tab.id ? "bg-gradient-to-r from-amber-500 to-amber-600 text-[#0E0B08] shadow-[0_4px_15px_rgba(245,158,11,0.25)]" : "text-stone-400 hover:text-amber-200"
                  )}
                >
                  {tab.date}
                </button>
              ))}
            </div>
          </div>

          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            {scheduleData[activeTab].map((item, i) => (
              <div key={i} className="bg-gradient-to-br from-[#1E1815] to-[#120E0C] border border-amber-500/10 hover:border-amber-500/30 rounded-[2.5rem] p-4 shadow-2xl hover:shadow-[0_15px_30px_rgba(0,0,0,0.6)] hover:-translate-y-1 transition-all duration-500 group">
                <div className="relative aspect-video rounded-3xl overflow-hidden mb-6 border border-amber-500/5">
                  <img src={item.img} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 filter brightness-90 contrast-105" />
                </div>
                <div className="px-4 pb-4 space-y-3">
                  <h4 className="text-xl font-black text-amber-50 leading-tight">{item.title}</h4>
                  <p className="text-xs text-stone-300 leading-relaxed font-medium">{item.desc}</p>
                  <div className="pt-4 border-t border-amber-500/10">
                    <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500 tracking-tighter">{item.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Video Section */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-[#0A0706] to-[#14100E] px-6">
          <div className="max-w-5xl mx-auto text-center space-y-8 md:space-y-12">
            <h2 className="text-2xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-amber-400">Um convite especial para você ✍️✨</h2>
            
            <div className="relative aspect-video rounded-3xl md:rounded-[3rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] bg-black/60 border border-amber-500/15 group">
              <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1200" className="absolute inset-0 w-full h-full object-cover opacity-60 filter grayscale" alt="Video" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 md:w-24 md:h-24 bg-gradient-to-r from-amber-500 to-amber-600 text-[#0E0B08] rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.5)] group-hover:scale-110 hover:from-amber-400 hover:to-amber-500 transition-all duration-300 cursor-pointer">
                  <Play fill="currentColor" size={32} className="ml-1 md:w-9 md:h-9" />
                </div>
              </div>
              {/* Fake Player UI */}
              <div className="absolute bottom-8 left-8 right-8 flex items-center gap-6 text-white/90">
                 <div className="flex gap-4">
                   <Rewind size={20} className="hover:text-amber-400 cursor-pointer transition-colors" />
                   <Play size={20} className="hover:text-amber-400 cursor-pointer transition-colors" />
                   <FastForward size={20} className="hover:text-amber-400 cursor-pointer transition-colors" />
                 </div>
                 <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                    <div className="w-1/3 h-full bg-gradient-to-r from-amber-400 to-amber-500"></div>
                 </div>
                 <span className="text-xs font-bold text-stone-300">01:24 / 04:32</span>
              </div>
              {/* Corner Icon */}
              <div className="absolute top-8 right-8 w-10 h-10 border border-white/20 rounded-full flex items-center justify-center opacity-40">
                <div className="w-5 h-5 border-2 border-white rotate-45"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Target Audience Section */}
        <section className="py-16 md:py-24 px-6 bg-gradient-to-b from-[#14100E] to-[#0A0706]">
          <div className="max-w-7xl mx-auto text-center mb-12 md:mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-black text-stone-100 uppercase tracking-tighter">
              Para quem é o <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">Congresso de Licitações</span>?
            </h2>
            <p className="text-stone-400 text-sm font-medium">O evento foi planejado para atender todos os perfis envolvidos no ciclo da compra pública.</p>
          </div>
          
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'Prefeitos e vereadores', desc: 'Gestores que buscam eficiência e transparência nas contas públicas.', icon: <Briefcase /> },
              { title: 'Servidores públicos', desc: 'Profissionais que lidam diariamente com processos licitatórios.', icon: <Users /> },
              { title: 'Gestores e secretários', desc: 'Lideranças que precisam dominar a nova lei de licitações.', icon: <ShieldCheck /> },
              { title: 'Procuradores e advogados', desc: 'Juristas que necessitam de atualização constante no tema.', icon: <Gavel /> },
              { title: 'Empresários e licitantes', desc: 'Quem deseja vender para o governo com segurança jurídica.', icon: <TrendingUp /> },
              { title: 'Estudantes e interessados', desc: 'Acadêmicos que buscam conhecimento prático no setor público.', icon: <GraduationCap /> }
            ].map((item, i) => (
              <div key={i} className="bg-gradient-to-br from-[#1C1613] to-[#110D0B] border border-amber-500/10 hover:border-amber-500/30 rounded-[2.5rem] p-10 text-stone-200 space-y-4 shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(245,158,11,0.06)] transition-all duration-500">
                <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center">
                   {item.icon}
                </div>
                <h4 className="text-xl font-black text-amber-100/90">{item.title}</h4>
                <p className="text-stone-400 text-xs leading-relaxed font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing & Form Section */}
        <section className="py-16 md:py-24 px-4 md:px-6 bg-gradient-to-b from-[#0A0706] to-[#120E0B]">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row rounded-3xl lg:rounded-[4rem] bg-gradient-to-br from-[#120F0D] via-[#1A1512] to-[#0D0B09] border border-amber-500/15 shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden">
            {/* Price Card */}
            <div className="lg:w-[450px] bg-gradient-to-b from-[#1C1613] to-[#110D0B] p-8 md:p-16 text-stone-200 space-y-8 md:space-y-12 relative border-r border-amber-500/10">
               <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none overflow-hidden">
                  <div className="absolute -top-20 -right-20 w-80 h-80 border-[40px] border-amber-500/10 rounded-full"></div>
               </div>
               
               <div className="space-y-4">
                 <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-400">Primeiro lote</h3>
                 <p className="text-stone-450 text-[10px] font-black uppercase tracking-widest">Inscrições abertas por tempo limitado</p>
                 <div className="pt-8 flex items-baseline gap-2">
                   <span className="text-xl font-bold text-amber-500/50">R$</span>
                   <span className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-stone-50 via-amber-100 to-amber-200 tracking-tighter">1.997</span>
                   <span className="text-2xl font-bold text-amber-500/50">,90</span>
                 </div>
               </div>
               
               <ul className="space-y-4 pt-10">
                 {['Acesso total aos 3 dias', 'Certificado de 40h', 'Coffee Break', 'Material Didático', 'Acesso VIP', 'Networking Lounge'].map(t => (
                   <li key={t} className="flex items-center gap-3 text-sm font-bold text-stone-300">
                     <CheckCircle2 size={18} className="text-amber-500" />
                     {t}
                   </li>
                 ))}
               </ul>

               <div className="pt-10 border-t border-amber-500/10">
                 <div className="w-16 h-16 border-4 border-amber-500 rounded-full flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-amber-500/20 rotate-45"></div>
                 </div>
               </div>
            </div>

            {/* Form */}
            <div className="flex-1 p-6 md:p-20 space-y-8 md:space-y-12">
               <div className="space-y-2">
                 <h2 className="text-3xl md:text-4xl font-black text-stone-100 tracking-tighter">Formulário de Inscrição</h2>
                 <p className="text-stone-400 text-sm font-medium">Preencha seus dados para garantir sua participação no congresso de licitações.</p>
               </div>
               
               <form className="grid grid-cols-1 md:grid-cols-2 gap-8" onSubmit={(e) => e.preventDefault()}>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-amber-200/50 uppercase tracking-widest ml-1">Nome Completo*</label>
                   <input type="text" placeholder="Seu nome" className="w-full bg-[#0A0706] border border-stone-850 focus:border-amber-500/60 rounded-xl px-6 py-4 focus:ring-1 focus:ring-amber-500/40 outline-none font-bold text-stone-200 text-sm placeholder-stone-700 transition-all duration-300" />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-amber-200/50 uppercase tracking-widest ml-1">CPF*</label>
                   <input type="text" placeholder="000.000.000-00" className="w-full bg-[#0A0706] border border-stone-850 focus:border-amber-500/60 rounded-xl px-6 py-4 focus:ring-1 focus:ring-amber-500/40 outline-none font-bold text-stone-200 text-sm placeholder-stone-700 transition-all duration-300" />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-amber-200/50 uppercase tracking-widest ml-1">E-mail*</label>
                   <input type="email" placeholder="seu@email.com" className="w-full bg-[#0A0706] border border-stone-850 focus:border-amber-500/60 rounded-xl px-6 py-4 focus:ring-1 focus:ring-amber-500/40 outline-none font-bold text-stone-200 text-sm placeholder-stone-700 transition-all duration-300" />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-amber-200/50 uppercase tracking-widest ml-1">WhatsApp*</label>
                   <input type="tel" placeholder="(00) 00000-0000" className="w-full bg-[#0A0706] border border-stone-850 focus:border-amber-500/60 rounded-xl px-6 py-4 focus:ring-1 focus:ring-amber-500/40 outline-none font-bold text-stone-200 text-sm placeholder-stone-700 transition-all duration-300" />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-amber-200/50 uppercase tracking-widest ml-1">Cargo / Órgão*</label>
                   <input type="text" placeholder="Ex: Secretário" className="w-full bg-[#0A0706] border border-stone-850 focus:border-amber-500/60 rounded-xl px-6 py-4 focus:ring-1 focus:ring-amber-500/40 outline-none font-bold text-stone-200 text-sm placeholder-stone-700 transition-all duration-300" />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-amber-200/50 uppercase tracking-widest ml-1">Onde trabalha?*</label>
                   <input type="text" placeholder="Ex: Prefeitura de Barra do Garças" className="w-full bg-[#0A0706] border border-stone-850 focus:border-amber-500/60 rounded-xl px-6 py-4 focus:ring-1 focus:ring-amber-500/40 outline-none font-bold text-stone-200 text-sm placeholder-stone-700 transition-all duration-300" />
                 </div>

                 <button className="md:col-span-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-[#0E0B08] py-6 rounded-2xl font-black text-xl shadow-[0_4px_25px_rgba(245,158,11,0.3)] hover:shadow-[0_4px_35px_rgba(245,158,11,0.5)] transition-all duration-300 uppercase tracking-widest">
                   CONTINUAR
                 </button>
               </form>
               
               <div className="bg-[#0D0A08] border border-amber-500/10 p-6 rounded-2xl space-y-3">
                 <p className="text-[10px] font-black text-amber-500/40 uppercase tracking-widest">Informação importante</p>
                 <ul className="text-[11px] text-stone-400 font-bold space-y-1">
                   <li>• As vagas no primeiro lote são limitadas e podem esgotar a qualquer momento.</li>
                   <li>• A confirmação da inscrição será enviada para o seu e-mail após a validação do pagamento.</li>
                 </ul>
               </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 md:py-24 px-6 bg-gradient-to-b from-[#120E0B] to-[#0A0706]">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12 md:gap-20">
            <div className="lg:w-1/3 space-y-6">
               <h2 className="text-3xl md:text-5xl font-black text-stone-100 tracking-tighter">
                 Dúvidas <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">Frequentes</span>
               </h2>
               <p className="text-stone-400 text-sm font-medium leading-relaxed">Confira as respostas para as perguntas mais comuns sobre o Congresso de Licitações.</p>
            </div>
            
            <div className="flex-1">
              <FAQItem 
                question="Como recebo meu certificado?" 
                answer="O certificado digital de 40h será enviado para o e-mail cadastrado em até 48h após o término do evento." 
              />
              <FAQItem 
                question="Terá suporte para hotéis?" 
                answer="Sim! Temos parcerias com hotéis locais que oferecem tarifas diferenciadas para os congressistas." 
              />
              <FAQItem 
                question="Quais as formas de pagamento?" 
                answer="Aceitamos Pix, Cartão de Crédito em até 12x e Empenho para órgãos públicos." 
              />
              <FAQItem 
                question="Qual a política de cancelamento?" 
                answer="Cancelamentos feitos com até 15 dias de antecedência terão reembolso total conforme nossa política de eventos." 
              />
            </div>
          </div>
        </section>

        {/* Final CTA Banner */}
        <section className="py-12 px-4 md:px-6">
          <div className="max-w-7xl mx-auto bg-gradient-to-br from-[#2E221B] via-[#1E1612] to-[#120E0C] border border-amber-500/20 rounded-3xl md:rounded-[4rem] p-8 md:p-24 text-center space-y-8 md:space-y-10 relative overflow-hidden shadow-[0_25px_50px_rgba(0,0,0,0.8)]">
             <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none"></div>
             <h2 className="text-2xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-yellow-400 leading-tight max-w-4xl mx-auto uppercase tracking-tighter">
               Domine as Licitações Públicas com a nova Lei de Licitações.
             </h2>
             <button className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-[#0E0B08] px-8 py-4 md:px-12 md:py-6 rounded-full font-black text-base md:text-xl shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:shadow-[0_0_40px_rgba(245,158,11,0.6)] hover:scale-105 transition-all duration-300 uppercase tracking-tighter">
               Quero garantir minha vaga agora
             </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 md:py-20 px-6 border-t border-stone-850/40 bg-[#070504]">
           <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 md:gap-12">
             <div className="flex flex-col items-center md:items-start gap-4">
               <img src={logo} alt="Envolve Logo" className="h-10 w-auto filter brightness-110" />
               <p className="text-stone-500 text-[10px] font-bold uppercase tracking-[0.2em] text-center md:text-left">© 2024 Envolve Consultoria e Assessoria</p>
             </div>
             
             <div className="flex flex-wrap justify-center gap-4 md:gap-10 text-[10px] font-black text-stone-500 uppercase tracking-[0.3em]">
               <a href="#" className="hover:text-amber-400 transition-colors duration-300">Home</a>
               <a href="#palestrantes" className="hover:text-amber-400 transition-colors duration-300">Palestrantes</a>
               <a href="#programacao" className="hover:text-amber-400 transition-colors duration-300">Programação</a>
               <a href="#contato" className="hover:text-amber-400 transition-colors duration-300">Contato</a>
             </div>
             
             <button className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-[#0E0B08] px-8 py-3 rounded-full font-black text-xs shadow-[0_0_15px_rgba(245,158,11,0.25)] transition-all uppercase tracking-widest">
               INSCREVER-SE
             </button>
           </div>
        </footer>
      </div>
    </HelmetProvider>
  );
}
