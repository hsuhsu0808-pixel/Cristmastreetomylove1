import React, { useRef } from 'react';
import { ParticleShape, GestureType } from '../types';

interface UIOverlayProps {
  currentShape: ParticleShape;
  setShape: (s: ParticleShape) => void;
  color1: string;
  setColor1: (c: string) => void;
  color2: string;
  setColor2: (c: string) => void;
  gesture: GestureType;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onReset: () => void;
  onUploadPhotos: (urls: string[]) => void;
}

const UIOverlay: React.FC<UIOverlayProps> = ({
  currentShape,
  setShape,
  color1,
  setColor1,
  color2,
  setColor2,
  gesture,
  isFullscreen,
  onToggleFullscreen,
  onReset,
  onUploadPhotos
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Fix: Explicitly cast file to any to resolve 'unknown' type error in URL.createObjectURL which requires a Blob or MediaSource
      const urls = Array.from(files).map((file: any) => URL.createObjectURL(file));
      onUploadPhotos(urls);
    }
  };

  return (
    <div className="absolute top-6 right-6 z-10 w-72 space-y-4">
      {/* Control Panel */}
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-2xl shadow-2xl">
        <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-blue-300 to-purple-400 bg-clip-text text-transparent">
          CYBER TREE v2.5
        </h2>

        <div className="space-y-4">
          {/* Shape Selector */}
          <div>
            <label className="text-xs uppercase tracking-widest text-white/60 mb-1 block">Morph Structure</label>
            <select 
              value={currentShape} 
              onChange={(e) => setShape(e.target.value as ParticleShape)}
              className="w-full bg-white/5 border border-white/20 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm transition-all"
            >
              <option value={ParticleShape.CONE}>Classic Tree</option>
              <option value={ParticleShape.HEART}>Eternal Heart</option>
              <option value={ParticleShape.STAR}>North Star</option>
              <option value={ParticleShape.SNOWFLAKE}>Ice Crystal</option>
              <option value={ParticleShape.FIREWORKS}>Nova Burst</option>
            </select>
          </div>

          {/* Color Pickers */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-xs uppercase tracking-widest text-white/60 mb-1 block">Primary</label>
              <input 
                type="color" 
                value={color1} 
                onChange={(e) => setColor1(e.target.value)}
                className="w-full h-10 bg-transparent border-none cursor-pointer p-0"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs uppercase tracking-widest text-white/60 mb-1 block">Secondary</label>
              <input 
                type="color" 
                value={color2} 
                onChange={(e) => setColor2(e.target.value)}
                className="w-full h-10 bg-transparent border-none cursor-pointer p-0"
              />
            </div>
          </div>

          {/* Photo Upload */}
          <div>
            <label className="text-xs uppercase tracking-widest text-white/60 mb-1 block">Photo Ornaments</label>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-blue-500/20 hover:bg-blue-500/40 border border-blue-500/30 rounded-lg py-2 text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <span>🖼️</span> UPLOAD YOUR PHOTOS
            </button>
            <input 
              ref={fileInputRef}
              type="file" 
              multiple 
              accept="image/*" 
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button 
              onClick={onToggleFullscreen}
              className="bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg py-2 text-xs font-semibold transition-all"
            >
              {isFullscreen ? 'WINDOW' : 'FULLSCREEN'}
            </button>
            <button 
              onClick={onReset}
              className="bg-red-500/20 hover:bg-red-500/40 border border-red-500/20 rounded-lg py-2 text-xs font-semibold transition-all"
            >
              RESET
            </button>
          </div>
        </div>
      </div>

      {/* Gesture Indicator */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-xl flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-tighter text-white/40">Hand Engine</p>
          <p className="text-sm font-mono font-bold text-blue-300">
            {gesture === 'NONE' ? 'WAITING FOR HAND...' : `GESTURE: ${gesture}`}
          </p>
        </div>
        <div className={`w-3 h-3 rounded-full ${gesture !== 'NONE' ? 'bg-green-400 animate-pulse' : 'bg-red-400 opacity-50'}`} />
      </div>

      {/* Tutorial */}
      <div className="text-[10px] text-white/40 leading-relaxed bg-black/20 p-3 rounded-lg">
        <p className="font-bold mb-1 opacity-70">INTERACTION GUIDE:</p>
        <ul className="list-disc pl-3 space-y-1">
          <li>✊ <b>FIST:</b> Shrink Tree</li>
          <li>🖐️ <b>OPEN:</b> Bloom Particles</li>
          <li>🤌 <b>PINCH:</b> Zoom In Photo</li>
          <li>🔄 <b>ROTATION:</b> Spin Orbit</li>
        </ul>
      </div>
    </div>
  );
};

export default UIOverlay;