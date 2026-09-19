import type { PackagingType } from '../../types';

interface PackagingVisualProps {
  type: PackagingType | string;
  variant?: 'thumbnail' | 'card' | 'hero' | 'inspection';
  label?: string;
  className?: string;
  showEvidenceMarker?: boolean;
}

export const PackagingVisual: React.FC<PackagingVisualProps> = ({
  type,
  variant = 'card',
  label,
  className = '',
  showEvidenceMarker = false,
}) => {
  const getDimensions = () => {
    switch (variant) {
      case 'thumbnail':
        return { width: 64, height: 64 };
      case 'hero':
        return { width: 340, height: 380 };
      case 'inspection':
        return { width: 440, height: 500 };
      case 'card':
      default:
        return { width: 180, height: 180 };
    }
  };

  const { width, height } = getDimensions();

  // Render SVG based on packaging type with clean 3D shading, realistic packaging shapes and textures
  const renderGraphic = () => {
    switch (type) {
      case 'Stand-Up Pouch':
        return (
          <svg viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 12px 20px rgba(0,0,0,0.12))' }}>
            <defs>
              <linearGradient id="pouchKraft" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#CBB593" />
                <stop offset="35%" stopColor="#DFC8A8" />
                <stop offset="70%" stopColor="#BFA57E" />
                <stop offset="100%" stopColor="#9C815A" />
              </linearGradient>
              <linearGradient id="pouchGloss" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
                <stop offset="20%" stopColor="rgba(255,255,255,0)" />
                <stop offset="80%" stopColor="rgba(0,0,0,0)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0.2)" />
              </linearGradient>
              <pattern id="kraftTexture" width="6" height="6" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="0.6" fill="#886E49" opacity="0.15" />
                <circle cx="5" cy="5" r="0.4" fill="#6A5333" opacity="0.2" />
              </pattern>
            </defs>
            {/* Pouch body */}
            <path d="M40 28 L160 28 L174 200 C174 218 140 226 100 226 C60 226 26 218 26 200 L40 28 Z" fill="url(#pouchKraft)" />
            <path d="M40 28 L160 28 L174 200 C174 218 140 226 100 226 C60 226 26 218 26 200 L40 28 Z" fill="url(#kraftTexture)" />
            <path d="M40 28 L160 28 L174 200 C174 218 140 226 100 226 C60 226 26 218 26 200 L40 28 Z" fill="url(#pouchGloss)" />
            {/* Top heat seal crimp with notches */}
            <rect x="38" y="16" width="124" height="14" rx="2" fill="#9C815A" />
            <line x1="42" y1="20" x2="158" y2="20" stroke="#7A6240" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="42" y1="24" x2="158" y2="24" stroke="#7A6240" strokeWidth="1" strokeDasharray="2 2" />
            {/* Tear notch */}
            <path d="M37 23 L42 20 L37 17 Z" fill="#6A5333" />
            <path d="M163 23 L158 20 L163 17 Z" fill="#6A5333" />
            {/* Zip-lock indent guide */}
            <line x1="44" y1="36" x2="156" y2="36" stroke="rgba(0,0,0,0.12)" strokeWidth="1.5" />
            
            {/* Front Artwork Label Graphics */}
            <rect x="52" y="52" width="96" height="135" rx="6" fill="#FFFFFF" opacity="0.94" />
            <rect x="58" y="60" width="84" height="6" rx="2" fill="#10B981" />
            <rect x="58" y="70" width="60" height="8" rx="2" fill="#0F172A" />
            <rect x="58" y="82" width="40" height="4" rx="1" fill="#64748B" />
            
            {/* Product illustration / window */}
            <circle cx="100" cy="115" r="22" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="3 3" />
            <text x="100" y="119" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#B45309" fontFamily="sans-serif">CHIA SEEDS</text>
            
            {/* Declarations & Barcode */}
            <rect x="58" y="148" width="45" height="18" rx="2" fill="#F1F5F9" />
            <text x="60" y="158" fontSize="6.5" fontWeight="bold" fill="#0F172A" fontFamily="monospace">Net: 250 g</text>
            <text x="60" y="164" fontSize="5.5" fill="#64748B" fontFamily="monospace">FSSAI 10020011002</text>
            
            {/* Mini Barcode */}
            <g transform="translate(112, 148)">
              <rect x="0" y="0" width="2" height="16" fill="#0F172A" />
              <rect x="4" y="0" width="1.5" height="16" fill="#0F172A" />
              <rect x="7" y="0" width="3" height="16" fill="#0F172A" />
              <rect x="12" y="0" width="1" height="16" fill="#0F172A" />
              <rect x="15" y="0" width="2.5" height="16" fill="#0F172A" />
              <rect x="20" y="0" width="1.5" height="16" fill="#0F172A" />
              <rect x="24" y="0" width="2" height="16" fill="#0F172A" />
            </g>

            {/* Evidence Marker Overlay if enabled */}
            {showEvidenceMarker && (
              <g>
                <rect x="56" y="145" width="48" height="22" rx="3" fill="rgba(239, 68, 68, 0.15)" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="3 2" />
                <circle cx="104" cy="145" r="4" fill="#EF4444" />
                <text x="104" y="147.5" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#FFF">!</text>
              </g>
            )}
          </svg>
        );

      case 'Glass Bottle':
        return (
          <svg viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 12px 20px rgba(0,0,0,0.12))' }}>
            <defs>
              <linearGradient id="amberGlass" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#78350F" />
                <stop offset="30%" stopColor="#B45309" />
                <stop offset="70%" stopColor="#92400E" />
                <stop offset="100%" stopColor="#451A03" />
              </linearGradient>
              <linearGradient id="capMetal" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#D4D4D8" />
                <stop offset="50%" stopColor="#FAFAFA" />
                <stop offset="100%" stopColor="#71717A" />
              </linearGradient>
            </defs>
            {/* Cap */}
            <rect x="84" y="14" width="32" height="18" rx="2" fill="url(#capMetal)" />
            <line x1="84" y1="20" x2="116" y2="20" stroke="#52525B" strokeWidth="1" />
            <line x1="84" y1="26" x2="116" y2="26" stroke="#52525B" strokeWidth="1" />
            {/* Neck */}
            <rect x="88" y="32" width="24" height="24" fill="url(#amberGlass)" />
            {/* Shoulders & Bottle Body */}
            <path d="M88 56 C70 65 52 82 52 108 L52 212 C52 220 58 226 66 226 L134 226 C142 226 148 220 148 212 L148 108 C148 82 130 65 112 56 Z" fill="url(#amberGlass)" />
            {/* Highlights */}
            <path d="M58 108 L58 212" stroke="rgba(255,255,255,0.4)" strokeWidth="3" strokeLinecap="round" />
            {/* Wrap-around label */}
            <rect x="54" y="105" width="92" height="95" rx="3" fill="#FDFBF7" />
            <rect x="62" y="115" width="76" height="5" rx="1" fill="#065F46" />
            <rect x="62" y="124" width="60" height="7" rx="1" fill="#0F172A" />
            <rect x="62" y="134" width="76" height="2" fill="#E2E8F0" />
            <rect x="62" y="140" width="50" height="4" rx="1" fill="#64748B" />
            <text x="62" y="165" fontSize="7" fontWeight="bold" fill="#0F172A" fontFamily="monospace">Net Vol: 500 ml</text>
            <text x="62" y="174" fontSize="5.5" fill="#475569" fontFamily="monospace">FSSAI 10019022008761</text>
            <rect x="118" y="158" width="18" height="18" rx="2" fill="#ECFDF5" stroke="#10B981" />
            <circle cx="127" cy="167" r="4" fill="#10B981" />
          </svg>
        );

      case 'Rigid Carton':
        return (
          <svg viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 12px 20px rgba(0,0,0,0.12))' }}>
            <defs>
              <linearGradient id="boxFront" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#F1F5F9" />
              </linearGradient>
              <linearGradient id="boxSide" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#CBD5E1" />
                <stop offset="100%" stopColor="#94A3B8" />
              </linearGradient>
              <linearGradient id="boxTop" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#E2E8F0" />
              </linearGradient>
            </defs>
            {/* Top facet */}
            <polygon points="65,45 130,25 165,42 100,62" fill="url(#boxTop)" stroke="#CBD5E1" strokeWidth="1" />
            {/* Side facet */}
            <polygon points="100,62 165,42 165,195 100,215" fill="url(#boxSide)" stroke="#94A3B8" strokeWidth="1" />
            {/* Front facet */}
            <polygon points="35,62 100,62 100,215 35,215" fill="url(#boxFront)" stroke="#CBD5E1" strokeWidth="1" />
            
            {/* Front Artwork layout */}
            <rect x="42" y="75" width="50" height="4" rx="1" fill="#4F46E5" />
            <rect x="42" y="83" width="45" height="7" rx="1" fill="#0F172A" />
            <rect x="42" y="94" width="30" height="3" rx="1" fill="#94A3B8" />
            
            {/* Serum Bottle icon on carton */}
            <rect x="52" y="115" width="22" height="45" rx="4" fill="#EEF2FF" stroke="#6366F1" strokeWidth="1" />
            <rect x="58" y="106" width="10" height="9" rx="1" fill="#4338CA" />
            
            <text x="42" y="185" fontSize="6.5" fontWeight="bold" fill="#0F172A" fontFamily="monospace">30 ml / 1.01 fl.oz</text>
            <text x="42" y="195" fontSize="5" fill="#64748B" fontFamily="monospace">DERMATOLOGIST TESTED</text>
          </svg>
        );

      case 'Jar / Tub':
      default:
        return (
          <svg viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 12px 20px rgba(0,0,0,0.12))' }}>
            <defs>
              <linearGradient id="jarBody" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1E293B" />
                <stop offset="30%" stopColor="#334155" />
                <stop offset="70%" stopColor="#1E293B" />
                <stop offset="100%" stopColor="#0F172A" />
              </linearGradient>
              <linearGradient id="jarLid" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#475569" />
                <stop offset="50%" stopColor="#64748B" />
                <stop offset="100%" stopColor="#334155" />
              </linearGradient>
            </defs>
            {/* Ribbed Lid */}
            <ellipse cx="100" cy="40" rx="60" ry="12" fill="url(#jarLid)" />
            <rect x="40" y="40" width="120" height="20" fill="url(#jarLid)" />
            <ellipse cx="100" cy="60" rx="60" ry="12" fill="#334155" />
            {/* Rib lines */}
            <line x1="50" y1="42" x2="50" y2="58" stroke="#1E293B" strokeWidth="1" />
            <line x1="65" y1="44" x2="65" y2="60" stroke="#1E293B" strokeWidth="1" />
            <line x1="80" y1="45" x2="80" y2="61" stroke="#1E293B" strokeWidth="1" />
            <line x1="95" y1="45" x2="95" y2="61" stroke="#1E293B" strokeWidth="1" />
            <line x1="110" y1="45" x2="110" y2="61" stroke="#1E293B" strokeWidth="1" />
            <line x1="125" y1="44" x2="125" y2="60" stroke="#1E293B" strokeWidth="1" />
            <line x1="140" y1="42" x2="140" y2="58" stroke="#1E293B" strokeWidth="1" />
            
            {/* Canister Body */}
            <rect x="42" y="60" width="116" height="145" fill="url(#jarBody)" />
            <ellipse cx="100" cy="205" rx="58" ry="14" fill="#0F172A" />
            
            {/* Body Label */}
            <rect x="44" y="80" width="112" height="105" fill="#0284C7" />
            <rect x="52" y="90" width="96" height="8" rx="2" fill="#FFFFFF" />
            <rect x="52" y="102" width="70" height="12" rx="2" fill="#FCD34D" />
            <text x="54" y="111" fontSize="8" fontWeight="bold" fill="#78350F" fontFamily="sans-serif">WHEY ISOLATE</text>
            <rect x="52" y="120" width="80" height="4" fill="rgba(255,255,255,0.7)" />
            <rect x="52" y="128" width="50" height="4" fill="rgba(255,255,255,0.7)" />
            <rect x="52" y="155" width="40" height="16" rx="2" fill="#FFFFFF" />
            <text x="56" y="166" fontSize="7" fontWeight="bold" fill="#0F172A" fontFamily="monospace">1.0 kg</text>
          </svg>
        );
    }
  };

  return (
    <div 
      className={`packaging-visual-container ${className}`}
      style={{ 
        width: typeof width === 'number' ? `${width}px` : width, 
        height: typeof height === 'number' ? `${height}px` : height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}
    >
      {renderGraphic()}
      {label && (
        <span style={{ 
          position: 'absolute', 
          bottom: 8, 
          fontSize: '0.75rem', 
          fontWeight: 600, 
          background: 'rgba(0,0,0,0.65)', 
          color: '#FFF', 
          padding: '2px 8px', 
          borderRadius: '4px' 
        }}>
          {label}
        </span>
      )}
    </div>
  );
};
