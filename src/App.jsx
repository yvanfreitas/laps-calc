import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Calculator, Milestone, Hash, Info, Trophy, Map, Ruler, Zap, Flag, CheckCircle, MoveHorizontal, Globe } from 'lucide-react';
import { translations } from './translations';

const LanguageSwitcher = ({ currentLang, onLanguageChange }) => {
    const languages = [
        { code: 'pt', label: 'PT-BR' },
        { code: 'en', label: 'EN' },
        { code: 'es', label: 'ES' }
    ];

    return (
        <div className="absolute top-4 right-4 z-50 flex gap-2">
            {languages.map((lang) => (
                <button
                    key={lang.code}
                    onClick={() => onLanguageChange(lang.code)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${currentLang === lang.code
                            ? 'bg-red-600 text-white shadow-md'
                            : 'bg-white text-slate-500 hover:bg-slate-100 shadow-sm'
                        }`}
                >
                    {lang.label}
                </button>
            ))}
        </div>
    );
};

const App = () => {
    const [totalDistance, setTotalDistance] = useState(5000);
    const [trackLength, setTrackLength] = useState(400);
    const [lane, setLane] = useState(1);
    const [laneWidth, setLaneWidth] = useState(1.22);
    const [startPoint, setStartPoint] = useState(0.25); // Posição normalizada 0-1

    const location = useLocation();
    const navigate = useNavigate();
    const svgRef = useRef(null);

    // Determine language from path
    const currentLang = useMemo(() => {
        const path = location.pathname.substring(1).split('/')[0];
        if (path === 'en') return 'en';
        if (path === 'es') return 'es';
        return 'pt';
    }, [location]);

    const t = translations[currentLang];

    const handleLanguageChange = (langCode) => {
        if (langCode === 'pt') {
            navigate('/');
        } else {
            navigate(`/${langCode}`);
        }
    };

    // Parâmetros do SVG
    const svgWidth = 500;
    const svgHeight = 280;
    const centerX = svgWidth / 2;
    const centerY = svgHeight / 2;
    const gapBetweenLanes = 8;
    const baseInnerWidth = 240;
    const baseInnerHeight = 110;

    // Cálculo da distância da raia selecionada
    const calculatedLaneDistance = useMemo(() => {
        if (lane === 1) return trackLength;
        const additionalDistance = 2 * Math.PI * laneWidth * (lane - 1);
        return trackLength + additionalDistance;
    }, [trackLength, lane, laneWidth]);

    const totalLaps = (totalDistance / calculatedLaneDistance).toFixed(2);
    const fullLaps = Math.floor(totalDistance / calculatedLaneDistance);
    const remainingMeters = (totalDistance % calculatedLaneDistance).toFixed(1);

    // Cálculo do ponto de chegada
    const finishPoint = useMemo(() => {
        const fraction = (totalDistance % calculatedLaneDistance) / calculatedLaneDistance;
        return (startPoint + fraction) % 1;
    }, [startPoint, totalDistance, calculatedLaneDistance]);

    // Função para converter progresso (0-1) em coordenadas (x, y)
    const getCoordinates = (progress, currentLane) => {
        const offset = (currentLane - 1) * gapBetweenLanes;
        const w = baseInnerWidth + 2 * offset;
        const h = baseInnerHeight + 2 * offset;
        const radius = h / 2;
        const straight = w - h;
        const straightHalf = straight / 2;

        // Lógica de segmentos:
        // 0 -> 0.25: Reta superior
        // 0.25 -> 0.5: Curva esquerda
        // 0.5 -> 0.75: Reta inferior
        // 0.75 -> 1: Curva direita
        if (progress <= 0.25) {
            const t = progress / 0.25;
            return { x: centerX + straightHalf - t * straight, y: centerY - radius };
        } else if (progress <= 0.5) {
            const angle = Math.PI * 1.5 - ((progress - 0.25) / 0.25) * Math.PI;
            return { x: centerX - straightHalf + Math.cos(angle) * radius, y: centerY + Math.sin(angle) * radius };
        } else if (progress <= 0.75) {
            const t = (progress - 0.5) / 0.25;
            return { x: centerX - straightHalf + t * straight, y: centerY + radius };
        } else {
            const angle = Math.PI * 0.5 - ((progress - 0.75) / 0.25) * Math.PI;
            return { x: centerX + straightHalf + Math.cos(angle) * radius, y: centerY + Math.sin(angle) * radius };
        }
    };

    const handleSvgClick = (e) => {
        if (!svgRef.current) return;
        const svg = svgRef.current;
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const cursor = pt.matrixTransform(svg.getScreenCTM().inverse());
        const angle = Math.atan2(cursor.y - centerY, cursor.x - centerX);
        let normAngle = (angle + Math.PI) / (2 * Math.PI);
        setStartPoint((normAngle + 0.25) % 1);
    };

    const startCoords = getCoordinates(startPoint, lane);
    const finishCoords = getCoordinates(finishPoint, lane);

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800 relative">
            <LanguageSwitcher currentLang={currentLang} onLanguageChange={handleLanguageChange} />

            <div className="max-w-4xl mx-auto space-y-6 pt-8">

                <header className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center p-3 bg-red-600 text-white rounded-2xl shadow-lg mb-4">
                        <Trophy size={32} />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t.title}</h1>
                    <p className="text-slate-500 font-medium italic">{t.subtitle}</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    <section className="lg:col-span-1 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6 h-fit">
                        <h2 className="text-lg font-semibold flex items-center gap-2 border-b border-slate-50 pb-2">
                            <Milestone size={20} className="text-red-600" />
                            {t.config}
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1 text-xs uppercase tracking-wider font-bold">{t.totalDistance}</label>
                                <input
                                    type="number"
                                    value={totalDistance}
                                    onChange={(e) => setTotalDistance(Number(e.target.value))}
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-500 outline-none transition-all font-mono text-xl font-bold"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1 text-xs uppercase tracking-wider font-bold">{t.lane1}</label>
                                <input
                                    type="number"
                                    value={trackLength}
                                    onChange={(e) => setTrackLength(Number(e.target.value))}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all font-mono"
                                />
                            </div>

                            <div className="pt-2">
                                <div className="flex justify-between items-end mb-2">
                                    <label className="text-sm font-bold text-slate-700 uppercase tracking-tighter">{t.currentLane}: {lane}</label>
                                    <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-mono">
                                        +{((calculatedLaneDistance - trackLength)).toFixed(1)}m/v
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="8"
                                    step="1"
                                    value={lane}
                                    onChange={(e) => setLane(Number(e.target.value))}
                                    className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-600"
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3 items-center">
                            <Info size={20} className="text-blue-600 shrink-0" />
                            <p className="text-xs text-blue-800 font-medium leading-tight">
                                {t.tip}
                            </p>
                        </div>
                    </section>

                    <div className="lg:col-span-2 space-y-6 flex flex-col">

                        {/* Resultados */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 order-1">
                            <section className="bg-red-600 text-white p-6 rounded-3xl shadow-xl flex flex-col justify-between overflow-hidden relative">
                                <div className="absolute -right-4 -top-4 opacity-10 rotate-12 text-white pointer-events-none">
                                    <Calculator size={120} />
                                </div>
                                <div className="relative z-10">
                                    <div className="text-red-100 uppercase tracking-widest text-xs font-black mb-1 opacity-80">{t.totalLaps}</div>
                                    <div className="text-6xl font-black tracking-tighter mb-2 tabular-nums">{totalLaps}</div>
                                </div>
                                <div className="relative z-10 flex items-center gap-2 text-sm bg-black/20 p-3 rounded-2xl backdrop-blur-sm">
                                    <Hash size={18} className="text-red-200" />
                                    <span className="font-medium text-red-50 font-mono">
                                        {fullLaps}v + {remainingMeters}m
                                    </span>
                                </div>
                            </section>

                            <section className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl border-t-4 border-yellow-400 flex flex-col justify-between">
                                <div>
                                    <div className="text-slate-400 uppercase tracking-widest text-xs font-black mb-1">{t.lanePerimeter} {lane}</div>
                                    <div className="text-4xl font-bold mb-1 tabular-nums tracking-tight">{calculatedLaneDistance.toFixed(2)}m</div>
                                </div>
                                <div className="mt-4 space-y-2">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                        <span>{t.extraDistance}</span>
                                        <span className="text-yellow-400">+{((calculatedLaneDistance - trackLength)).toFixed(2)}m</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-yellow-400 transition-all duration-1000 ease-out" style={{ width: `${(trackLength / calculatedLaneDistance) * 100}%` }} />
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Diagrama e Controle de Largada */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 overflow-hidden order-2 space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Map size={14} /> {t.trackLocation}
                                </h2>
                                <div className="flex gap-4 text-[9px] font-bold uppercase tracking-tight">
                                    <div className="flex items-center gap-1.5">
                                        <Flag size={12} className="text-yellow-500 fill-yellow-500" /> {t.start}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <CheckCircle size={12} className="text-black fill-black/20" /> {t.finish}
                                    </div>
                                </div>
                            </div>

                            {/* SVG Map */}
                            <div className="relative w-full aspect-[21/11] bg-slate-100 rounded-2xl border border-slate-200 shadow-inner flex items-center justify-center p-2 overflow-hidden cursor-crosshair group">
                                <svg ref={svgRef} viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full drop-shadow-sm select-none" preserveAspectRatio="xMidYMid meet" onClick={handleSvgClick}>
                                    <rect x={centerX - (baseInnerWidth / 2 + 8 * gapBetweenLanes)} y={centerY - (baseInnerHeight / 2 + 8 * gapBetweenLanes)} width={baseInnerWidth + 16 * gapBetweenLanes} height={baseInnerHeight + 16 * gapBetweenLanes} rx={(baseInnerHeight + 16 * gapBetweenLanes) / 2} fill="#c25141" />
                                    <rect x={centerX - baseInnerWidth / 2} y={centerY - baseInnerHeight / 2} width={baseInnerWidth} height={baseInnerHeight} rx={baseInnerHeight / 2} fill="#10b981" />
                                    {[...Array(8)].map((_, i) => {
                                        const laneNum = i + 1;
                                        const offset = i * gapBetweenLanes;
                                        const w = baseInnerWidth + (2 * offset);
                                        const h = baseInnerHeight + (2 * offset);
                                        const x = centerX - w / 2;
                                        const y = centerY - h / 2;
                                        const isSelected = lane === laneNum;
                                        return (
                                            <rect key={i} x={x} y={y} width={w} height={h} rx={h / 2} fill="none" stroke={isSelected ? "#facc15" : "rgba(255,255,255,0.25)"} strokeWidth={isSelected ? "4" : "1"} className="transition-all duration-300 pointer-events-none" />
                                        );
                                    })}

                                    {/* Marcadores */}
                                    <g transform={`translate(${startCoords.x - 10}, ${startCoords.y - 20})`} className="drop-shadow-md">
                                        <path d="M4 21v-17l11 4-11 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="#facc15" />
                                    </g>

                                    <g transform={`translate(${finishCoords.x - 10}, ${finishCoords.y - 20})`} className="drop-shadow-md">
                                        <circle cx="10" cy="10" r="8" fill="black" stroke="white" strokeWidth="1.5" />
                                        <path d="M7 10l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                    </g>
                                </svg>

                                {/* Overlay instrução */}
                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-[10px] px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    {t.clickInstruction}
                                </div>
                            </div>

                            {/* Slider de Controle (Novo!) */}
                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <MoveHorizontal size={14} /> {t.adjustStart}
                                    </label>
                                    <span className="text-[10px] font-mono bg-white px-2 py-0.5 border border-slate-200 rounded text-slate-600">
                                        {(startPoint * 100).toFixed(0)}{t.coursePct}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.005"
                                    value={startPoint}
                                    onChange={(e) => setStartPoint(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                                <div className="flex justify-between text-[8px] text-slate-400 font-bold uppercase">
                                    <span>{t.topStraight}</span>
                                    <span>{t.leftCurve}</span>
                                    <span>{t.bottomStraight}</span>
                                    <span>{t.rightCurve}</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Informação Técnica */}
                <section className="bg-white border border-slate-200 p-8 rounded-[2rem] shadow-sm space-y-8">
                    <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                        <div className="bg-blue-600 p-3 rounded-2xl text-white">
                            <Info size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 tracking-tight text-lg uppercase">{t.geometryTitle}</h2>
                            <p className="text-sm text-slate-500">{t.geometrySubtitle}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4">
                            <h3 className="flex items-center gap-2 font-bold text-slate-800 uppercase text-xs tracking-wider">
                                <Map size={18} className="text-blue-600" />
                                {t.perimeterDiffTitle}
                            </h3>
                            <p className="text-sm text-slate-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: t.perimeterDiffText }} />
                            <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] font-bold text-slate-500">
                                <div className="bg-slate-50 p-2 rounded border border-slate-100">{t.lane} 1: 400.00m</div>
                                <div className="bg-slate-50 p-2 rounded border border-slate-100">{t.lane} 4: 423.01m</div>
                                <div className="bg-slate-50 p-2 rounded border border-slate-100">{t.lane} 8: 453.66m</div>
                                <div className="bg-slate-50 p-2 rounded border border-slate-100">{t.width}: 1.22m</div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="flex items-center gap-2 font-bold text-slate-800 uppercase text-xs tracking-wider">
                                <Ruler size={18} className="text-blue-600" />
                                {t.finishPointTitle}
                            </h3>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                {t.finishPointText}
                            </p>
                            <div className="bg-blue-600 text-white p-4 rounded-2xl font-mono text-center shadow-inner relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/20 to-transparent">
                                </div>
                                <div className="relative text-sm font-bold">{t.finishFormula}</div>
                            </div>
                        </div>
                    </div>
                </section>

                <footer className="text-center text-slate-400 text-[10px] py-4 font-bold uppercase tracking-[0.3em]">
                    {t.footer}
                </footer>
            </div>
        </div>
    );
};

export default App;