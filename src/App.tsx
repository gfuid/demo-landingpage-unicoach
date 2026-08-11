import React, { useState, useCallback } from 'react';
import Loader from './components/Loader';
import EarthGlobe, { type OfficeLocation } from './components/EarthGlobe';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ServicesSection } from './components/ServicesSection';
import { GsapShowcaseSection } from './components/GsapShowcaseSection';
import { ScrollRevealSection } from './components/ScrollRevealSection';
import { DestinationsSection } from './components/DestinationsSection';
import { StatsSection } from './components/StatsSection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { EventsSection } from './components/EventsSection';
import { NewsSection } from './components/NewsSection';
import { CentreLocatorSection } from './components/CentreLocatorSection';
import { CtaBannerSection } from './components/CtaBannerSection';
import { Footer } from './components/Footer';
import { EligibilityModal } from './components/EligibilityModal';

export const App: React.FC = () => {
  const [activeOffice, setActiveOffice] = useState<OfficeLocation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalServiceTitle, setModalServiceTitle] = useState<string | undefined>(undefined);
  const [loadingFinished, setLoadingFinished] = useState(false);

  const handleActiveOffice = useCallback((office: OfficeLocation) => {
    setActiveOffice(office);
  }, []);

  const handleOpenModal = (serviceTitle?: string) => {
    setModalServiceTitle(serviceTitle);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-white font-inter text-slate-900 selection:bg-indigo-600 selection:text-white">
      {/* 1. Deep Space 3D Earth Loader (fades after 100% completion) */}
      {!loadingFinished && (
        <Loader onLoadingComplete={() => setLoadingFinished(true)} />
      )}

      {/* 2. Global Interactive 3D Earth Globe (Three.js canvas - moves right/left/center on scroll) */}
      <EarthGlobe activeOffice={activeOffice} />

      {/* 3. Header Navbar */}
      <Navbar onOpenModal={handleOpenModal} />

      {/* 4. Main Content Sections */}
      <main className="relative z-10 flex-1">
        <Hero onOpenModal={handleOpenModal} />
        <ServicesSection onOpenModal={handleOpenModal} />
        <GsapShowcaseSection onOpenModal={handleOpenModal} />
        <ScrollRevealSection onActiveOffice={handleActiveOffice} onOpenModal={handleOpenModal} />
        <DestinationsSection onOpenModal={handleOpenModal} />
        <StatsSection />
        <TestimonialsSection />
        <EventsSection onOpenModal={handleOpenModal} />
        <NewsSection onOpenModal={handleOpenModal} />
        <CentreLocatorSection onOpenModal={handleOpenModal} />
        <CtaBannerSection onOpenModal={handleOpenModal} />
      </main>

      {/* 5. Footer */}
      <Footer onOpenModal={handleOpenModal} />

      {/* 6. Lead Modal */}
      <EligibilityModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        serviceTitle={modalServiceTitle}
      />
    </div>
  );
};

export default App;
