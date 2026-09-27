/**
 * PromptCraft Studio — Deep Semantic Directorial Intelligence Compiler
 * Client-Side Generative Prompt Compiler Platform
 * BSL 1.1 License
 */

import {
  AspectRatio,
  CameraMovement,
  CinematographyMatrix,
  DirectorStyle,
  EngineTarget,
  FocalLength,
  LightingScheme,
  ColorPalette,
  ParsedSceneIntelligence,
  PromptPreset,
  ShotBeat,
  StudioMode,
} from '../types';

export const DIRECTOR_PROFILES: Record<
  DirectorStyle,
  { name: string; tag: string; optics: string; lighting: string; atmosphere: string; philosophy: string }
> = {
  none: {
    name: 'Standard Directorial',
    tag: 'Neutral Balanced',
    optics: 'neutral optical prime lens, lifelike perspective',
    lighting: 'natural motivated illumination',
    atmosphere: 'clean atmospheric spatial balance',
    philosophy: 'Naturalistic photographic representation',
  },
  'roger-deakins': {
    name: 'Roger Deakins',
    tag: 'Motivated Realism',
    optics: 'Arri Alexa Mini LF, Zeiss Master Prime 40mm, T1.3, human eye height, zero artificial distortion',
    lighting: 'masterful motivated single-source key lighting, sculptural deep silhouettes, warm tungsten contrast',
    atmosphere: 'clean volumetric air, authentic atmospheric haze, genuine spatial honesty without forced bloom',
    philosophy: 'Pure motivated light, compositional restraint, zero artificial flare',
  },
  'denis-villeneuve': {
    name: 'Denis Villeneuve',
    tag: 'Monolithic Brutalism',
    optics: 'Arri Alexa 65, Ultra Prime 27mm, colossal architectural depth, low-angle grandeur',
    lighting: 'monolithic chiaroscuro, heavy particulate shadow diffusion, stark desaturated amber and slate grading',
    atmosphere: 'dense airborne particulate suspension, desert sand or industrial haze, low-frequency atmospheric tension',
    philosophy: 'Colossal physical scale, monolithic architecture, brooding atmospheric weight',
  },
  'christopher-nolan': {
    name: 'Christopher Nolan',
    tag: 'IMAX Practicality',
    optics: 'IMAX 70mm 15-perf film camera, Hasselblad custom cinema optics, tack-sharp mechanical clarity',
    lighting: 'natural high-dynamic-range daylight, zero CGI sheen, physical light bounce off practical materials',
    atmosphere: 'real physical kinetic momentum, practical wind and atmospheric turbulence, zero digital artifacting',
    philosophy: 'Tactile mechanical realism, practical physical effects, high-gauge 70mm film stock',
  },
  'ridley-scott': {
    name: 'Ridley Scott',
    tag: 'Industrial Volumetrics',
    optics: 'Panavision C-Series 2x Anamorphic lenses, dramatic horizontal flare streaks, shallow depth of field',
    lighting: 'intense backlighting slicing through smoke, practical neon reflections, high-contrast industrial illumination',
    atmosphere: 'heavy atmospheric smoke layers, condensation steam vents, rain-slicked specular reflections',
    philosophy: 'Lived-in industrial grit, layered atmospheric density, backlit volumetric geometry',
  },
  'david-fincher': {
    name: 'David Fincher',
    tag: 'Surgical Precision',
    optics: 'RED V-Raptor 8K VV, Leica Summilux-C prime lenses, surgical robotic camera tracking, tack-sharp focal plane',
    lighting: 'low-key clinical illumination, desaturated yellow-green sickly color timing, calculated shadow density',
    atmosphere: 'sterile atmospheric air, razor-sharp edge contrast, obsessive micro-detail on tactile surfaces',
    philosophy: 'Calculated robotic precision, low-key desaturated tones, clinical control',
  },
  'wong-kar-wai': {
    name: 'Wong Kar-wai',
    tag: 'Melancholic Step-Print',
    optics: '35mm anamorphic glass, step-printed slow-shutter motion blur, extreme shallow depth through wet glass',
    lighting: 'saturated emerald green and crimson red practical neon, moody low-frequency shadow pooling',
    atmosphere: 'rain-streaked window reflections, smoke coils drifting in cramped spaces, nostalgic romantic longing',
    philosophy: 'Step-printed motion blur, saturated neon color contrast, nostalgic intimacy',
  },
};

export const CAMERA_MOVEMENT_LABELS: Record<CameraMovement, { label: string; desc: string; vector: string }> = {
  'dolly-in': { label: 'Dolly In', desc: 'Slow forward camera push-in', vector: 'Forward Z-axis push towards subject' },
  'dolly-out': { label: 'Dolly Out', desc: 'Slow backward camera reveal', vector: 'Backward Z-axis pull revealing wider spatial context' },
  'tracking-shot': { label: 'Tracking Shot', desc: 'Lateral camera movement following subject', vector: 'Horizontal X-axis tracking parallax alongside focal subject' },
  'crane-pedestal': { label: 'Crane / Pedestal', desc: 'Vertical elevation camera travel', vector: 'Vertical Y-axis pedestal boom rising above eye level' },
  'orbit': { label: '360° Orbit', desc: 'Circular rotational camera arc', vector: 'Continuous smooth orbital arc maintaining focal subject lock' },
  'whip-pan': { label: 'Whip Pan', desc: 'Fast dynamic kinetic transition', vector: 'Rapid rotational whip pan with directional motion blur' },
  'static-tripod': { label: 'Static Tripod', desc: 'Fixed camera position, locked horizon', vector: 'Stationary tripod lock with zero camera vibration' },
};

export const FOCAL_LENGTH_LABELS: Record<FocalLength, { label: string; desc: string; optical: string }> = {
  '14mm-ultra-wide': { label: '14mm Ultra-Wide', desc: 'Expansive environmental perspective', optical: '14mm ultra-wide rectilinear prime lens, exaggerated depth perspective, sharp edge geometry' },
  '24mm-cinematic-wide': { label: '24mm Cinematic Wide', desc: 'Immersive cinematic establishing', optical: '24mm cinematic wide lens, natural field of view, gentle optical compression' },
  '50mm-standard': { label: '50mm Standard', desc: 'Human eye natural perspective', optical: '50mm standard prime f/1.4, lifelike human optical perspective, smooth falloff' },
  '85mm-portrait': { label: '85mm Portrait', desc: 'Compressed background, tight isolation', optical: '85mm portrait telephoto f/1.8, strong background separation, creamy circular bokeh' },
  'anamorphic-bokeh': { label: 'Anamorphic 2x Bokeh', desc: 'Horizontal blue streaks, oval bokeh', optical: '2x anamorphic cinema glass, characteristic oval bokeh discs, subtle horizontal flare streaks' },
};

export const LIGHTING_SCHEME_LABELS: Record<LightingScheme, { label: string; desc: string; physics: string }> = {
  'volumetric-rays': { label: 'Volumetric Rays', desc: 'Visible atmospheric light beams & dust motes', physics: 'crepuscular volumetric god-rays slicing through suspended atmospheric particulates and haze' },
  'chiaroscuro': { label: 'Chiaroscuro', desc: 'High-contrast Rembrandt shadows and intense highlights', physics: 'dramatic chiaroscuro low-key illumination, deep pitch shadows with sculptural rim highlights' },
  'practical-neon': { label: 'Practical Neon', desc: 'Vibrant edge light from urban neon sources', physics: 'diffused multi-point practical neon emission, wet reflections on ambient specular surfaces' },
  'golden-hour': { label: 'Golden Hour', desc: 'Warm 3200K low-angle sunlight', physics: 'warm golden hour low-angle sunlight, long expressive shadows, gentle amber backlighting rim' },
  'overcast-diffused': { label: 'Overcast Diffused', desc: 'Soft shadowless moody daylight', physics: 'softly diffused 6500K overcast sky illumination, seamless shadow gradients, muted specular roll-off' },
};

export const COLOR_PALETTE_LABELS: Record<ColorPalette, { label: string; desc: string; filmStock: string }> = {
  'teal-orange-bleach': { label: 'Teal & Orange Bleach Bypass', desc: 'High contrast action cinema grade', filmStock: 'silver retention bleach bypass color timing, cyan shadow saturation paired with warm amber highlights' },
  'kodachrome-64': { label: 'Kodachrome 64', desc: 'Rich nostalgic film grain & saturated primaries', filmStock: 'classic Kodachrome 64 reversal film stock, organic grain structure, saturated red and ochre tones' },
  'monochromatic-noir': { label: 'Monochromatic Noir', desc: 'Silver halide B&W with dense black levels', filmStock: 'monochromatic silver halide panchromatic emulsion, velvety deep blacks, tactile micro-contrast' },
  'muted-cyberpunk': { label: 'Muted Cyberpunk', desc: 'Desaturated midtones with electric accents', filmStock: 'desaturated industrial color palette punctuated by electric cyan and hot magenta accent light' },
};

export const VIDEO_PROMPT_SYSTEM_TEMPLATE = `You are an expert cinematic director and prompt engineer for state-of-the-art generative video models (Runway Gen-3, Sora, Kling).
Your task is to take a simple user concept, technical camera specifications, and timed sequence beats, then synthesize them into a dense, visually descriptive, temporal prompt.`;

export const IMAGE_PROMPT_SYSTEM_TEMPLATE = `You are an expert visual director and prompt engineer for state-of-the-art generative image models (Midjourney v6, Flux.1).
Your task is to take a concept, technical camera specifications, lighting scheme, and aesthetic color grading, then synthesize them into an evocative, optically precise prompt.`;

/**
 * Formats SmolLM2-135M ChatML input with MoE Sparse Expert routing decisions
 */
export function buildMoESmolLMPrompt(
  idea: string,
  cinematics: CinematographyMatrix,
  beats: ShotBeat[],
  engine: EngineTarget,
  mode: StudioMode = 'video'
): string {
  const isVideo = mode === 'video';
  const systemPrompt = isVideo
    ? `You are an expert cinematic director and generative video prompt compiler targeting ${engine}. Synthesize a hyper-detailed, physical, temporal prompt.`
    : `You are an expert visual director and generative image prompt compiler targeting ${engine}. Synthesize an evocative, optically precise photographic prompt.`;

  const camera = CAMERA_MOVEMENT_LABELS[cinematics.cameraMovement]?.vector || cinematics.cameraMovement;
  const lens = FOCAL_LENGTH_LABELS[cinematics.focalLength]?.optical || cinematics.focalLength;
  const lighting = LIGHTING_SCHEME_LABELS[cinematics.lightingScheme]?.physics || cinematics.lightingScheme;
  const color = COLOR_PALETTE_LABELS[cinematics.colorPalette]?.filmStock || cinematics.colorPalette;

  let expertBlock = `\n[Sparse MoE Expert Routing Decisions]:\n`;
  if (!isVideo) {
    expertBlock += `- Expert 1: Photographic Optics [ACTIVE (95%)]: ${lens}, rawMode=${cinematics.rawMode}, stylize=${cinematics.stylize}\n`;
    expertBlock += `- Expert 2: Spatio-Temporal Kinematics [IDLE (0%)]: Weights sit inactive\n`;
  } else {
    expertBlock += `- Expert 1: Photographic Optics [IDLE (0%)]: Weights sit inactive\n`;
    expertBlock += `- Expert 2: Spatio-Temporal Kinematics [ACTIVE (98%)]: ${camera}, motionStrength=${cinematics.motionStrength}/10, fps=${cinematics.fps}\n`;
  }
  expertBlock += `- Expert 3: Lighting & Atmospheric Physics [ACTIVE]: ${lighting}\n`;
  expertBlock += `- Expert 4: Color Timing & Film Stock [ACTIVE]: ${color}\n`;

  let userContent = `Scene Concept: ${idea}\nEngine Target: ${engine}\nAspect Ratio: ${cinematics.aspectRatio}\n${expertBlock}`;

  if (isVideo && beats.length > 0) {
    userContent += `\nTemporal Sequence Shot Beats:\n`;
    beats.forEach((b, i) => {
      userContent += `Beat ${i + 1} [${b.timestamp}]: [Vector: ${b.cameraMotion}] ${b.focalSubject} -> ${b.action}. Ambience: ${b.environmentReaction}\n`;
    });
  }

  userContent += `\nSynthesize the above inputs into the final, complete cinematic prompt for ${engine}. Output ONLY the compiled prompt.`;

  return `<|im_start|>system\n${systemPrompt}<|im_end|>\n<|im_start|>user\n${userContent}<|im_end|>\n<|im_start|>assistant\n`;
}

/**
 * Formats Qwen2.5 ChatML input for Web Worker inference
 */
export function buildQwenChatMLPrompt(
  idea: string,
  cinematics: CinematographyMatrix,
  beats: ShotBeat[],
  engine: EngineTarget
): string {
  return buildMoESmolLMPrompt(idea, cinematics, beats, engine);
}



/**
 * Deep Semantic NLP & Scene Entity Analyzer
 * Deconstructs raw user prose into structured cinematographic physics.
 */
export function analyzeScenePrompt(
  idea: string,
  cinematics: CinematographyMatrix,
  engine: EngineTarget,
  directorStyle: DirectorStyle = 'none'
): ParsedSceneIntelligence {
  const cleanIdea = idea.trim() || 'A cybernetic courier repairing a drone on a rain-slicked rooftop';
  const lower = cleanIdea.toLowerCase();
  const entities: string[] = [];

  // 1. Primary Subject & Material Extraction
  let primarySubject = 'Focal subject';
  let subjectDetails = 'tactile micro-textures with authentic material surface physics';

  if (/courier|samurai|wanderer|detective|soldier|astronaut|pilot|warrior|girl|man|woman|cyborg|figure|watchmaker|artisan|scientist|mechanic|craftsman|hunter|knight|monk|priest|alchemist|assassin|scholar/.test(lower)) {
    const match = lower.match(/(?:a|an|the|of\s+an?)?\s*([a-z\s-]{3,30}(?:courier|samurai|wanderer|detective|soldier|astronaut|pilot|warrior|girl|man|woman|cyborg|figure|watchmaker|artisan|scientist|mechanic|craftsman|hunter|knight|monk|priest|alchemist|assassin|scholar))/i);
    primarySubject = match ? match[1].replace(/^(?:of\s+an?|a|an|the)\s+/i, '').trim() : 'Central figure';
    entities.push(primarySubject);
  } else if (/drone|vehicle|mech|ship|starship|car|train|robot|blade|sword|clockwork|astrolabe|machinery|engine/.test(lower)) {
    const match = lower.match(/(?:a|an|the|of\s+an?)?\s*([a-z\s-]{3,30}(?:drone|vehicle|mech|ship|starship|car|train|robot|blade|sword|clockwork|astrolabe|machinery|engine))/i);
    primarySubject = match ? match[1].replace(/^(?:of\s+an?|a|an|the)\s+/i, '').trim() : 'Mechanical apparatus';
    entities.push(primarySubject);
  } else if (/orchid|tree|flower|ruins|temple|monolith|cavern|cave|portal|city|terrarium|workshop/.test(lower)) {
    const match = lower.match(/(?:a|an|the|of\s+an?)?\s*([a-z\s-]{3,30}(?:orchid|tree|flower|ruins|temple|monolith|cavern|cave|portal|city|terrarium|workshop))/i);
    primarySubject = match ? match[1].replace(/^(?:of\s+an?|a|an|the)\s+/i, '').trim() : 'Architectural structure';
    entities.push(primarySubject);
  }

  // Material physics enrichment
  if (/cybernetic|robot|metal|armor|drone|titanium|brass|chrome/.test(lower)) {
    subjectDetails = 'brushed anodized metal with micro-scratches, anisotropic specular highlights, and exposed machined joints';
    entities.push('Anisotropic Metal & Machining');
  } else if (/leather|cloth|cloak|fabric|jacket|robe|coat/.test(lower)) {
    subjectDetails = 'tactile organic fabric weave, visible stitch lines, natural drape and tension folds, water absorption gradient';
    entities.push('Tactile Fabric Weave');
  } else if (/skin|face|eyes|hands|fingers|portrait/.test(lower)) {
    subjectDetails = 'un-airbrushed authentic skin pores, delicate subsurface scattering, natural micro-creases, fine dermal texture';
    entities.push('Subsurface Scattering & Pores');
  } else if (/stone|concrete|sandstone|ruins|rock|marble/.test(lower)) {
    subjectDetails = 'weathered mineral porosity, tactile edge chipping, crystalline fracture veins, natural sediment stratification';
    entities.push('Mineral Porosity');
  }

  // 2. Action & Kinematics
  let actionKinematics = 'maintains deliberate kinetic momentum within the frame';
  if (/repairing|welding|soldering|fixing/.test(lower)) {
    actionKinematics = 'meticulously micro-welds exposed components, dynamic sparks bouncing off metallic edges with realistic fluid collisions';
    entities.push('Kinetic Sparks & Welding');
  } else if (/running|sprinting|chasing|escaping/.test(lower)) {
    actionKinematics = 'sprints frantically with forward physical momentum, footwear violently kicking up surface droplets';
    entities.push('Dynamic Sprint Kinematics');
  } else if (/standing|staring|watching|observing|meditating/.test(lower)) {
    actionKinematics = 'stands resolute in a grounded sculptural posture, subtle micro-movements reacting to ambient gusts';
    entities.push('Sculptural Stance');
  } else if (/flying|hovering|gliding|floating/.test(lower)) {
    actionKinematics = 'hovers with gyroscopic micro-adjustments, thruster heat shimmer distorting background geometry';
    entities.push('Gyroscopic Thruster Flight');
  }

  // 3. Environment & Setting
  let environmentSetting = 'a cinematically grounded environment with pronounced spatial depth';
  if (/rooftop|shibuya|tokyo|cyberpunk|city|neon|alley|street/.test(lower)) {
    environmentSetting = 'a rain-slicked metropolitan sector, wet asphalt mirroring neon reflections, looming architectural silhouettes in the background';
    entities.push('Rain-Slicked Urban Density');
  } else if (/desert|dune|ruins|sandstone|wasteland/.test(lower)) {
    environmentSetting = 'an expansive desert landscape, monolithic weathered stone ruins, rolling terrain stretching toward a hazy horizon';
    entities.push('Desert Monoliths');
  } else if (/jungle|forest|terrarium|plants|botanical|overgrown/.test(lower)) {
    environmentSetting = 'a dense botanical ecosystem with suspended micro-droplets, moss-covered surfaces, and layered foliage depth';
    entities.push('Dense Flora Ecosystem');
  } else if (/space|station|corridor|hangar|submersible|ocean/.test(lower)) {
    environmentSetting = 'an industrial interior corridor, heavy bulkhead pressure doors, ambient warning telemetry, metallic grated flooring';
    entities.push('Industrial Bulkhead Interior');
  }

  // 4. Atmospheric Physics
  let atmosphericPhysics = 'balanced atmospheric particulate suspension';
  if (/rain|wet|storm|puddle|droplet/.test(lower)) {
    atmosphericPhysics = 'torrential rain streaks slicing through light cones, dynamic surface tension puddles with ripple interference, suspended water vapor';
    entities.push('Rain Physics & Ripple Dynamics');
  } else if (/fog|mist|haze|smoke|steam/.test(lower)) {
    atmosphericPhysics = 'crepuscular volumetric mist, billowing steam vents catching backlighting, dense low-hanging atmospheric vapor';
    entities.push('Volumetric Steam & Mist');
  } else if (/sand|dust|sparks|embers|fire/.test(lower)) {
    atmosphericPhysics = 'suspended dust motes and micro-embers dancing in the thermal updraft, atmospheric particulate diffusion';
    entities.push('Thermal Embers & Dust Motes');
  }

  // 5. Optics Profile & Lighting Scheme
  const cameraLabel = CAMERA_MOVEMENT_LABELS[cinematics.cameraMovement] || CAMERA_MOVEMENT_LABELS['dolly-in'];
  const lensLabel = FOCAL_LENGTH_LABELS[cinematics.focalLength] || FOCAL_LENGTH_LABELS['24mm-cinematic-wide'];
  const lightLabel = LIGHTING_SCHEME_LABELS[cinematics.lightingScheme] || LIGHTING_SCHEME_LABELS['volumetric-rays'];
  const colorLabel = COLOR_PALETTE_LABELS[cinematics.colorPalette] || COLOR_PALETTE_LABELS['teal-orange-bleach'];
  const effectiveDirectorKey = (directorStyle && directorStyle !== 'none') ? directorStyle : (cinematics.directorStyle || 'none');
  const director = DIRECTOR_PROFILES[effectiveDirectorKey] || DIRECTOR_PROFILES['none'];

  const opticsProfile = `${lensLabel.optical}, ${director.optics}`;
  const lightingScheme = `${lightLabel.physics}, ${director.lighting}`;
  const colorGrading = `${colorLabel.filmStock}`;
  const directorAesthetic = director.name !== 'Standard Directorial' ? `${director.name} (${director.tag})` : 'Natural Balanced Cinema';

  // 6. Directorial Negative Constraints per Target Engine
  let suggestedNegativePrompt = '';
  if (engine === 'kling') {
    suggestedNegativePrompt = '(deformed anatomy, jittery frame blending, abrupt camera jumps, unnatural morphing, plastic skin, motion blur artifacts, cartoonish render: 1.4)';
  } else if (engine === 'runway-gen3') {
    suggestedNegativePrompt = 'text, watermark, jitter, stutter, morphing hands, overexposed blowout, low framerate stutter, deformed faces';
  } else if (engine === 'sora') {
    suggestedNegativePrompt = 'inconsistent spatial geometry, teleporting objects, flickering light artifacts, uncanny valley facial distortion';
  } else if (engine === 'midjourney-v6') {
    suggestedNegativePrompt = '--no cartoon, illustration, render, 3d, doll, plastic skin, oversaturated, blurry, bad anatomy, text, watermark';
  } else if (engine === 'flux-1') {
    suggestedNegativePrompt = 'blurry, low resolution, airbrushed plastic skin, oversaturated 3d render sheen, fake CGI bloom, deformed fingers';
  }

  // 7. Cinematography & Resonance Scores
  let score = 78;
  if (cleanIdea.length > 50) score += 6;
  if (cleanIdea.length > 100) score += 6;
  if (directorStyle !== 'none') score += 5;
  if (cinematics.rawMode) score += 3;
  if (entities.length >= 3) score += 2;
  const cinematographyScore = Math.min(99, score);

  let resonance = 88;
  if (engine === 'midjourney-v6' && cinematics.rawMode) resonance += 8;
  if (engine === 'kling' && cinematics.motionStrength >= 5) resonance += 9;
  if (engine === 'runway-gen3') resonance += 7;
  if (engine === 'flux-1') resonance += 8;
  const modelResonanceScore = Math.min(100, resonance);

  // 8. Actionable Optimization Tips
  const optimizationTips: string[] = [];
  if (cleanIdea.length < 40) {
    optimizationTips.push('Add specific material textures (e.g. "weathered leather", "brushed titanium") to heighten photorealism.');
  }
  if (!/rain|fog|smoke|dust|mist|sun|light/.test(lower)) {
    optimizationTips.push('Specify atmospheric particles (e.g. rain droplets, crepuscular rays) for richer depth.');
  }
  if (directorStyle === 'none') {
    optimizationTips.push('Inject a Director Profile (e.g. Roger Deakins or Denis Villeneuve) to anchor cinematic visual grammar.');
  }
  if (engine === 'midjourney-v6' && /photorealistic|8k|hyperrealistic/.test(lower)) {
    optimizationTips.push('Removed amateur buzzwords ("8k", "photorealistic") — Midjourney v6.1 yields superior results with optical lens tokens.');
  }

  return {
    primarySubject,
    subjectDetails,
    actionKinematics,
    environmentSetting,
    atmosphericPhysics,
    lightingScheme,
    opticsProfile,
    colorGrading,
    directorAesthetic,
    cinematographyScore,
    modelResonanceScore,
    suggestedNegativePrompt,
    detectedEntities: entities,
    optimizationTips,
  };
}

/**
 * Intelligent Engine Target Synthesizers
 */

export function compilePromptAlgorithmic(
  idea: string,
  cinematics: CinematographyMatrix,
  beats: ShotBeat[],
  engine: EngineTarget
): string {
  const directorStyle = cinematics.directorStyle || 'none';
  const intel = analyzeScenePrompt(idea, cinematics, engine, directorStyle);

  switch (engine) {
    case 'kling':
      return compileKling(idea, cinematics, beats, intel);
    case 'runway-gen3':
      return compileRunwayGen3(idea, cinematics, beats, intel);
    case 'sora':
      return compileSora(idea, cinematics, beats, intel);
    case 'midjourney-v6':
      return compileMidjourneyV6(idea, cinematics, intel);
    case 'flux-1':
      return compileFlux1(idea, cinematics, intel);
    default:
      return idea;
  }
}

/**
 * Kling 2.0 Directorial Synthesizer
 * Produces structured directorial brackets with kinetic trajectories and fluid physics.
 */
function compileKling(
  idea: string,
  cinematics: CinematographyMatrix,
  beats: ShotBeat[],
  intel: ParsedSceneIntelligence
): string {
  const cameraLabel = CAMERA_MOVEMENT_LABELS[cinematics.cameraMovement] || CAMERA_MOVEMENT_LABELS['dolly-in'];
  const lines: string[] = [];

  lines.push(`[Cinematic 4K UHD Directorial Master | Aspect Ratio: ${cinematics.aspectRatio}]`);
  lines.push(`[Camera Trajectory & Velocity: ${cameraLabel.label} — ${cameraLabel.vector}, smooth fluid deceleration, 30fps steady-lock]`);
  lines.push(`[Shot Scale & Composition: Captured on ${intel.opticsProfile}, natural spatial falloff]`);
  lines.push(`[Primary Subject & Action: ${intel.primarySubject}, exhibiting ${intel.subjectDetails}. ${intel.actionKinematics}]`);
  lines.push(`[Environmental Architecture: ${intel.environmentSetting}]`);
  lines.push(`[Atmospheric Simulation & Physics: ${intel.atmosphericPhysics}]`);
  lines.push(`[Lighting Architecture & Color Timing: ${intel.lightingScheme}. Color Grade: ${intel.colorGrading}]`);

  if (beats.length > 0) {
    lines.push('');
    lines.push('[Temporal Chronological Progression]:');
    beats.forEach((b, i) => {
      lines.push(`  • Beat ${i + 1} [${b.timestamp}]: [Vector: ${b.cameraMotion || cameraLabel.label}] -> Focus on ${b.focalSubject || intel.primarySubject}, as ${b.action || intel.actionKinematics}. Ambience: ${b.environmentReaction || intel.atmosphericPhysics}`);
    });
  }

  lines.push('');
  lines.push(`[Directorial Parameters: --motion ${cinematics.motionStrength} --fps ${cinematics.fps} --prompt-weight 0.88 --dynamic-frame true --aspect ${cinematics.aspectRatio}]`);
  lines.push(`[Negative Constraints: ${intel.suggestedNegativePrompt}]`);

  return lines.join('\n');
}

/**
 * Runway Gen-3 Alpha Synthesizer
 * Uses bracketed temporal progression with camera command separation.
 */
function compileRunwayGen3(
  idea: string,
  cinematics: CinematographyMatrix,
  beats: ShotBeat[],
  intel: ParsedSceneIntelligence
): string {
  const cameraLabel = CAMERA_MOVEMENT_LABELS[cinematics.cameraMovement] || CAMERA_MOVEMENT_LABELS['dolly-in'];
  const lines: string[] = [];

  lines.push(`[Cinematic Shot | ${cinematics.aspectRatio} | ${intel.colorGrading}]`);
  lines.push(`Master Scene: ${idea}. Filmed with ${intel.opticsProfile}.`);
  lines.push(`[Camera: ${cameraLabel.label} — ${cameraLabel.vector}]`);
  lines.push('');

  if (beats.length === 0) {
    lines.push(`[00:00 - 00:05] The camera initiates a smooth ${cameraLabel.label}, tracking ${intel.primarySubject}. ${intel.subjectDetails}. ${intel.actionKinematics}. Atmospheric conditions: ${intel.atmosphericPhysics}. Lighting: ${intel.lightingScheme}.`);
  } else {
    beats.forEach((b) => {
      const motion = b.cameraMotion || cameraLabel.label;
      const subject = b.focalSubject || intel.primarySubject;
      const action = b.action || intel.actionKinematics;
      const env = b.environmentReaction || intel.atmosphericPhysics;
      lines.push(`[${b.timestamp}] [Camera: ${motion}] Center framing on ${subject}. ${action}. Surrounding environment: ${env}.`);
    });
  }

  lines.push('');
  lines.push(`Technical Specs: --motion ${cinematics.motionStrength} --fps ${cinematics.fps} --camera-smoothness high --cinematic-grade`);
  return lines.join('\n');
}

/**
 * OpenAI Sora Synthesizer
 * Spatio-temporal continuous narrative prose with 3D persistence and light bounce.
 */
function compileSora(
  idea: string,
  cinematics: CinematographyMatrix,
  beats: ShotBeat[],
  intel: ParsedSceneIntelligence
): string {
  const cameraLabel = CAMERA_MOVEMENT_LABELS[cinematics.cameraMovement] || CAMERA_MOVEMENT_LABELS['dolly-in'];
  const parts: string[] = [];

  parts.push(`A seamless, high-fidelity cinematic video sequence with ${cinematics.aspectRatio} framing.`);
  parts.push(`The master composition features ${intel.primarySubject} situated within ${intel.environmentSetting}.`);
  parts.push(`Materials display tactile fidelity, including ${intel.subjectDetails}.`);
  parts.push(`Physical dynamics are prominent: ${intel.actionKinematics}, while ${intel.atmosphericPhysics}.`);
  parts.push(`Illumination is governed by ${intel.lightingScheme}, rendered with ${intel.colorGrading}.`);
  parts.push(`The camera navigates the space with continuous 3D spatial continuity using a ${cameraLabel.vector} via ${intel.opticsProfile}.`);

  if (beats.length > 0) {
    parts.push(`The sequence evolves chronologically:`);
    beats.forEach((b) => {
      parts.push(`During [${b.timestamp}], the camera performs a ${b.cameraMotion || cameraLabel.vector}, prioritizing ${b.focalSubject || intel.primarySubject} as ${b.action || intel.actionKinematics}, with ${b.environmentReaction || 'ambient physics reacting naturally'}.`);
    });
  }

  parts.push(`Natural optical depth of field, authentic shadow persistence, zero digital morphing artifacts.`);
  return parts.join(' ');
}

/**
 * Midjourney v6.1 Photographic Synthesizer
 * Strips buzzwords, formats real camera glass, aperture, and strict Midjourney flags.
 */
function compileMidjourneyV6(
  idea: string,
  cinematics: CinematographyMatrix,
  intel: ParsedSceneIntelligence
): string {
  // Strip amateur buzzwords
  const sanitized = idea
    .replace(/\b(8k|photorealistic|hyperrealistic|ultra realistic|masterpiece|award winning|trending on artstation)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim() || idea;

  const arTag = cinematics.aspectRatio.replace(':', ':');
  const subjectMentioned = sanitized.toLowerCase().includes(intel.primarySubject.toLowerCase());
  const subjectToken = (intel.primarySubject && intel.primarySubject !== 'Focal subject' && !subjectMentioned)
    ? `featuring ${intel.primarySubject} with ${intel.subjectDetails}`
    : `focusing on ${intel.subjectDetails}`;

  const tokens: string[] = [
    `Cinematic film still of ${sanitized}`,
    subjectToken,
    intel.environmentSetting,
    `illuminated by ${intel.lightingScheme}`,
    intel.atmosphericPhysics,
    `shot on ${intel.opticsProfile}`,
    intel.colorGrading,
    cinematics.filmGrain ? 'subtle Kodak 35mm film grain, tactile micro-contrast' : 'clean optical sharpness',
    cinematics.rawMode ? '--style raw' : '',
    `--ar ${arTag}`,
    '--v 6.1',
    `--s ${cinematics.stylize || 250}`,
  ].filter(Boolean);

  return tokens.join(', ');
}

/**
 * Flux.1 Professional Descriptive Synthesizer
 * Sensory, tactile narrative paragraph tailored to the T5-XXL text encoder.
 */
function compileFlux1(
  idea: string,
  cinematics: CinematographyMatrix,
  intel: ParsedSceneIntelligence
): string {
  const subjectMentioned = idea.toLowerCase().includes(intel.primarySubject.toLowerCase());
  const subjectIntro = (intel.primarySubject && intel.primarySubject !== 'Focal subject' && !subjectMentioned)
    ? `At the focal plane, ${intel.primarySubject} is rendered with tactile physical authenticity, showing ${intel.subjectDetails}.`
    : `At the focal plane, subject surfaces exhibit ${intel.subjectDetails}.`;

  return [
    `A high-resolution candid photograph capturing ${idea}.`,
    subjectIntro,
    `The scene is set in ${intel.environmentSetting}, where ${intel.atmosphericPhysics}.`,
    `Illumination is cast by ${intel.lightingScheme}, creating naturalistic contact shadows and genuine specular highlights across all surfaces.`,
    `Captured with ${intel.opticsProfile}, exhibiting natural depth-of-field falloff, authentic color depth in ${intel.colorGrading}, and tactile micro-textures with zero synthetic CGI gloss.`,
    `Framed in an authentic ${cinematics.aspectRatio} composition.`,
  ].join(' ');
}

/**
 * Production-Grade Presets
 */
export const CURATED_PRESETS: PromptPreset[] = [
  {
    id: 'cyberpunk-courier',
    name: 'Cyberpunk Courier',
    mode: 'video',
    category: 'Sci-Fi',
    description: 'Rain-slicked Tokyo rooftop micro-welding a damaged reconnaissance drone',
    idea: 'A cybernetic courier repairing a broken drone on a rain-slicked neo-Tokyo rooftop at dusk',
    engineTarget: 'kling',
    cinematics: {
      cameraMovement: 'orbit',
      focalLength: '24mm-cinematic-wide',
      lightingScheme: 'practical-neon',
      colorPalette: 'muted-cyberpunk',
      aspectRatio: '2.39:1',
      motionStrength: 7,
      fps: 24,
      stylize: 250,
      rawMode: true,
      directorStyle: 'ridley-scott',
      microTextures: true,
      atmosphericParticles: true,
    },
    beats: [
      {
        id: 'beat-1',
        timestamp: '00:00 - 00:03',
        cameraMotion: 'Dolly in, slow push toward workstation',
        focalSubject: "Courier's weathered tactile cybernetic fingers",
        action: 'Micro-arc welding sparks fly as drone titanium chassis is sealed',
        environmentReaction: 'Rain droplets sizzle on hot soldering iron, ambient neon reflections flicker in puddles',
      },
      {
        id: 'beat-2',
        timestamp: '00:03 - 00:06',
        cameraMotion: 'Orbital arc tracking to courier profile',
        focalSubject: 'Exhausted courier in rain-drenched techwear cloak',
        action: 'Lifts carbon-fiber helmet visor, breath visible in chilly damp air',
        environmentReaction: 'Volumetric steam billows from adjacent industrial vents, city traffic blurs below',
      },
      {
        id: 'beat-3',
        timestamp: '00:06 - 00:10',
        cameraMotion: 'Pedestal crane elevation tilting down',
        focalSubject: 'Repaired drone optics flare to life in cyan',
        action: 'Drone propellers spin up, scattering rain spray radially outward',
        environmentReaction: 'City skyline illuminated by holographic neon billboards stretching into the distance',
      },
    ],
  },
  {
    id: 'monolithic-wanderer',
    name: 'Monolithic Wanderer',
    mode: 'video',
    category: 'Cinematic',
    description: 'Denis Villeneuve brutalist desert scale with colossal ancient machinery',
    idea: 'A solitary desert wanderer standing before colossal brutalist obsidian monoliths during a sandstorm',
    engineTarget: 'runway-gen3',
    cinematics: {
      cameraMovement: 'tracking-shot',
      focalLength: '24mm-cinematic-wide',
      lightingScheme: 'chiaroscuro',
      colorPalette: 'teal-orange-bleach',
      aspectRatio: '2.39:1',
      motionStrength: 6,
      fps: 24,
      stylize: 300,
      rawMode: true,
      directorStyle: 'denis-villeneuve',
      microTextures: true,
      atmosphericParticles: true,
    },
    beats: [
      {
        id: 'beat-1',
        timestamp: '00:00 - 00:04',
        cameraMotion: 'Low-angle tracking shot gliding over sand ripples',
        focalSubject: 'Wanderer in billowing desert cowl',
        action: 'Trudges forward against fierce crosswinds, leaning into the storm',
        environmentReaction: 'Fine amber sand grains whip across the frame, catching harsh directional sunlight',
      },
      {
        id: 'beat-2',
        timestamp: '00:04 - 00:08',
        cameraMotion: 'Tilt upward revealing scale',
        focalSubject: 'Colossal obsidian monolith carved with geometric patterns',
        action: 'Monolith hums with deep subsonic vibration, disturbing sand dunes',
        environmentReaction: 'Massive atmospheric dust veil parts momentarily to reveal sky',
      },
    ],
  },
  {
    id: 'deakins-portrait',
    name: 'Deakins Street Portrait',
    mode: 'image',
    category: 'Atmospheric',
    description: 'Roger Deakins motivated natural light portrait of a weathered artisan',
    idea: 'Close portrait of an elderly watchmaker inspecting antique clockwork in a dusty workshop',
    engineTarget: 'midjourney-v6',
    cinematics: {
      cameraMovement: 'static-tripod',
      focalLength: '85mm-portrait',
      lightingScheme: 'golden-hour',
      colorPalette: 'kodachrome-64',
      aspectRatio: '4:5',
      motionStrength: 1,
      fps: 24,
      stylize: 250,
      rawMode: true,
      directorStyle: 'roger-deakins',
      microTextures: true,
      filmGrain: true,
    },
    beats: [],
  },
  {
    id: 'bioluminescent-flora',
    name: 'Bioluminescent Terrarium',
    mode: 'image',
    category: 'Fantasy',
    description: 'Macro sensory photograph of glowing extraterrestrial flora inside Victorian glass',
    idea: 'Macro photograph of an exotic bioluminescent orchid flowering inside a mist-filled antique glass terrarium',
    engineTarget: 'flux-1',
    cinematics: {
      cameraMovement: 'static-tripod',
      focalLength: '50mm-standard',
      lightingScheme: 'volumetric-rays',
      colorPalette: 'muted-cyberpunk',
      aspectRatio: '1:1',
      motionStrength: 1,
      fps: 24,
      stylize: 200,
      rawMode: true,
      directorStyle: 'none',
      microTextures: true,
      atmosphericParticles: true,
    },
    beats: [],
  },
];
