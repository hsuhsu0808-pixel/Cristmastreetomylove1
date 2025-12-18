
import React, { useState } from 'react';
import Visualizer from './components/Visualizer';
import UIOverlay from './components/UIOverlay';
import { ParticleShape, GestureType } from './types';

const App: React.FC = () => {
  const [shape, setShape] = useState<ParticleShape>(ParticleShape.CONE);
  const [color1, setColor1] = useState('#C0C0C0'); // Silver
  const [color2, setColor2] = useState('#6A0DAD'); // Blue-Purple
  const [gesture, setGesture] = useState<GestureType>('NONE');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Initial photos from user-provided files
  const [photos, setPhotos] = useState<string[]>([
    'input_file_0.png',
    'input_file_1.png',
    'input_file_2.png',
    'input_file_3.png',
    'input_file_4.png'
  ]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const handleReset = () => {
    setShape(ParticleShape.CONE);
    setColor1('#C0C0C0');
    setColor2('#6A0DAD');
    setPhotos([
      'input_file_0.png',
      'input_file_1.png',
      'input_file_2.png',
      'input_file_3.png',
      'input_file_4.png'
    ]);
  };

  const handleUploadPhotos = (newPhotos: string[]) => {
    setPhotos(newPhotos);
  };

  return (
    <div className="relative w-full h-full text-white font-sans">
      <Visualizer 
        shape={shape} 
        color1={color1} 
        color2={color2} 
        photoUrls={photos}
        onGestureDetected={setGesture}
      />
      
      <UIOverlay 
        currentShape={shape}
        setShape={setShape}
        color1={color1}
        setColor1={setColor1}
        color2={color2}
        setColor2={setColor2}
        gesture={gesture}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        onReset={handleReset}
        onUploadPhotos={handleUploadPhotos}
      />

      {/* Ambient background vibe */}
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-b from-transparent via-[#050510]/50 to-[#100020]/80 z-[-1]" />
    </div>
  );
};

export default App;
