import React, { useState, useEffect, useCallback } from 'react';
import MessageList from '../components/visualizer/MessageList';
import MessageFlow from '../components/visualizer/MessageFlow';
import MessageDetails from '../components/visualizer/MessageDetails';
import MessageLog from '../components/visualizer/MessageLog';
import { ChevronDown, ChevronUp } from 'lucide-react';

const VisualizerPage: React.FC = () => {
  const [leftWidth, setLeftWidth] = useState(350);
  const [bottomHeight, setBottomHeight] = useState(300);
  const [isLogMinimized, setIsLogMinimized] = useState(false);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingBottom, setIsResizingBottom] = useState(false);

  const startResizingLeft = useCallback(() => setIsResizingLeft(true), []);
  const startResizingBottom = useCallback(() => setIsResizingBottom(true), []);
  const stopResizing = useCallback(() => {
    setIsResizingLeft(false);
    setIsResizingBottom(false);
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizingLeft) {
      const newWidth = e.clientX;
      if (newWidth > 200 && newWidth < window.innerWidth * 0.5) {
        setLeftWidth(newWidth);
      }
    }
    if (isResizingBottom) {
      const newHeight = window.innerHeight - e.clientY;
      if (newHeight > 100 && newHeight < window.innerHeight * 0.7) {
        setBottomHeight(newHeight);
      }
    }
  }, [isResizingLeft, isResizingBottom]);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-black flex flex-col font-sans selection:bg-blue-900/30 text-white">
      {/* Top Header Bar */}
      <div className="h-10 border-b border-[#111] bg-black flex items-center px-6 justify-between z-50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.8)]"></div>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-80">LNPROTOTEST MONITOR</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-[8px] font-black text-gray-700 uppercase tracking-widest">Status</span>
            <span className="text-[8px] font-black text-green-500 uppercase tracking-widest bg-green-900/5 px-2 py-0.5 rounded border border-green-900/20">LIVE</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Column: Catalog and Details */}
        <div
          className="flex flex-col border-r border-[#111] overflow-y-auto bg-black shrink-0 scrollbar-hide"
          style={{ width: `${leftWidth}px` }}
        >
          <div className="border-b border-[#111]">
            <MessageList />
          </div>
          <div className="bg-[#020202]">
            <MessageDetails />
          </div>
        </div>

        {/* Vertical Resizer Handle */}
        <div
          onMouseDown={startResizingLeft}
          className="w-1 cursor-col-resize bg-transparent hover:bg-blue-600/30 transition-colors z-40"
        />

        {/* Right Column: Flow and Log */}
        <div className="flex-1 flex flex-col overflow-hidden bg-black relative">
          {/* Top: Message Flow Graph */}
          <div className="flex-1 overflow-hidden relative">
            <MessageFlow />
          </div>

          {/* Horizontal Resizer Handle */}
          <div
            onMouseDown={startResizingBottom}
            className="h-1 cursor-row-resize bg-transparent hover:bg-blue-600/30 transition-colors z-40"
          />

          {/* Bottom: Logs (The Drawer) */}
          <div
            className={`border-t border-[#111] bg-black transition-all duration-300 flex flex-col overflow-hidden
                            ${isLogMinimized ? 'h-10' : ''}`}
            style={{ height: isLogMinimized ? '40px' : `${bottomHeight}px` }}
          >
            {/* Drawer Header/Control */}
            <div className="h-10 px-6 border-b border-[#111] bg-[#050505] flex items-center justify-between shrink-0 cursor-pointer hover:bg-[#0a0a0a]"
              onClick={() => setIsLogMinimized(!isLogMinimized)}>
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em]">Telemetry Drawer</span>
                <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <button className="text-gray-600 hover:text-white transition-colors">
                {isLogMinimized ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide">
              <MessageLog />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualizerPage;