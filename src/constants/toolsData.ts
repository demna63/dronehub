// src/constants/toolsData.ts

// --- INTERFACES ---
export interface VTXChannel {
  id: number;
  name: string;
  freq: number;
}

export interface VTXBandGroup {
  name: string;
  channels: VTXChannel[];
}

export interface Preset {
  id: string;
  title: string;
  description: string;
  command: string;
  tags: string[];
}

// --- 1. PRESETS DATA ---
export const PRESETS_DATA: Preset[] = [
  {
    id: '1',
    title: 'Cinematic Rates',
    description: 'Slow and smooth rates for cinematic flying.',
    command: 'set rate_profile = 1\nset roll_rc_rate = 100\nset pitch_rc_rate = 100\nset yaw_rc_rate = 100\nsave',
    tags: ['Rate', 'Cinematic']
  },
  {
    id: '2',
    title: 'Freestyle PIDs (5 inch)',
    description: 'Aggressive PIDs for 5" freestyle builds.',
    command: 'set pid_profile = 1\nset p_pitch = 45\nset i_pitch = 80\nset d_pitch = 35\nsave',
    tags: ['PID', 'Freestyle']
  }
];

// --- 2. VTX BANDS & FREQUENCIES ---
export const VTX_ALL_BANDS: VTXBandGroup[] = [
  // 5.8GHz Standard
  {
    name: "Band A",
    channels: [
      { id: 1, name: "A1", freq: 5865 }, { id: 2, name: "A2", freq: 5845 }, { id: 3, name: "A3", freq: 5825 }, { id: 4, name: "A4", freq: 5805 },
      { id: 5, name: "A5", freq: 5785 }, { id: 6, name: "A6", freq: 5765 }, { id: 7, name: "A7", freq: 5745 }, { id: 8, name: "A8", freq: 5725 }
    ]
  },
  {
    name: "Band B",
    channels: [
      { id: 1, name: "B1", freq: 5733 }, { id: 2, name: "B2", freq: 5752 }, { id: 3, name: "B3", freq: 5771 }, { id: 4, name: "B4", freq: 5790 },
      { id: 5, name: "B5", freq: 5809 }, { id: 6, name: "B6", freq: 5828 }, { id: 7, name: "B7", freq: 5847 }, { id: 8, name: "B8", freq: 5866 }
    ]
  },
  {
    name: "Band E",
    channels: [
      { id: 1, name: "E1", freq: 5705 }, { id: 2, name: "E2", freq: 5685 }, { id: 3, name: "E3", freq: 5665 }, { id: 4, name: "E4", freq: 5645 },
      { id: 5, name: "E5", freq: 5885 }, { id: 6, name: "E6", freq: 5905 }, { id: 7, name: "E7", freq: 5925 }, { id: 8, name: "E8", freq: 5945 }
    ]
  },
  {
    name: "Band F",
    channels: [
      { id: 1, name: "F1", freq: 5740 }, { id: 2, name: "F2", freq: 5760 }, { id: 3, name: "F3", freq: 5780 }, { id: 4, name: "F4", freq: 5800 },
      { id: 5, name: "F5", freq: 5820 }, { id: 6, name: "F6", freq: 5840 }, { id: 7, name: "F7", freq: 5860 }, { id: 8, name: "F8", freq: 5880 }
    ]
  },
  {
    name: "Band R",
    channels: [
      { id: 1, name: "R1", freq: 5658 }, { id: 2, name: "R2", freq: 5695 }, { id: 3, name: "R3", freq: 5732 }, { id: 4, name: "R4", freq: 5769 },
      { id: 5, name: "R5", freq: 5806 }, { id: 6, name: "R6", freq: 5843 }, { id: 7, name: "R7", freq: 5880 }, { id: 8, name: "R8", freq: 5917 }
    ]
  },
  
  // Extended Bands (L, X, etc)
  {
    name: "Band L",
    channels: [
      { id: 1, name: "L1", freq: 5362 }, { id: 2, name: "L2", freq: 5399 }, { id: 3, name: "L3", freq: 5436 }, { id: 4, name: "L4", freq: 5473 },
      { id: 5, name: "L5", freq: 5510 }, { id: 6, name: "L6", freq: 5547 }, { id: 7, name: "L7", freq: 5584 }, { id: 8, name: "L8", freq: 5621 }
    ]
  },
  {
    name: "Band X", // 4.9G - 5.1G
    channels: [
      { id: 1, name: "X1", freq: 4990 }, { id: 2, name: "X2", freq: 5020 }, { id: 3, name: "X3", freq: 5050 }, { id: 4, name: "X4", freq: 5080 },
      { id: 5, name: "X5", freq: 5110 }, { id: 6, name: "X6", freq: 5140 }, { id: 7, name: "X7", freq: 5170 }, { id: 8, name: "X8", freq: 5200 }
    ]
  },

  // 1.3G
  {
    name: "Band 1.3G",
    channels: [
      { id: 1, name: "1", freq: 1080 }, { id: 2, name: "2", freq: 1120 }, { id: 3, name: "3", freq: 1160 }, { id: 4, name: "4", freq: 1200 },
      { id: 5, name: "5", freq: 1240 }, { id: 6, name: "6", freq: 1280 }, { id: 7, name: "7", freq: 1320 }, { id: 8, name: "8", freq: 1360 }
    ]
  },

  // 3.3G
  {
    name: "Band 3.3G-A",
    channels: [
      { id: 1, name: "A1", freq: 3320 }, { id: 2, name: "A2", freq: 3345 }, { id: 3, name: "A3", freq: 3370 }, { id: 4, name: "A4", freq: 3395 },
      { id: 5, name: "A5", freq: 3420 }, { id: 6, name: "A6", freq: 3445 }, { id: 7, name: "A7", freq: 3470 }, { id: 8, name: "A8", freq: 3495 }
    ]
  },
  {
    name: "Band 3.3G-B",
    channels: [
      { id: 1, name: "B1", freq: 3310 }, { id: 2, name: "B2", freq: 3330 }, { id: 3, name: "B3", freq: 3355 }, { id: 4, name: "B4", freq: 3380 },
      { id: 5, name: "B5", freq: 3405 }, { id: 6, name: "B6", freq: 3430 }, { id: 7, name: "B7", freq: 3455 }, { id: 8, name: "B8", freq: 3480 }
    ]
  }
];

// --- 3. VTX TEMPLATES (Full List) ---
export const VTX_TEMPLATES = [
  "D1 VTX 2.5W 64Ch",
  "StingBee Stellar VTX 2.5W 64Ch",
  "Flytex Fuzia 2.5W 64ch",
  "Motorsoft VTX 2.5W 56ch",
  "Rush Tank Solo 1.6W",
  "Rush Max Solo 2.5W",
  "Rush Max Solo 2.5W (+ X-band)",
  "Rush Max Solo XBAND 4.9G 2.5W",
  "Rush 3.3G 2W VTX (band A)",
  "Rush 3.3G 2W VTX (band B)",
  "Rush 3.3G 4W VTX",
  "Rush 1.3G 1.6W VTX 9Ch (new version)",
  "Rush 1.2/1.3GHz 4W",
  "Rush 1.2/1.3GHz 4W V2",
  "Rush 4.9G/5.8G 2.5W Dual-Band VTX 56Ch",
  "Rush 1.3G/3.3G Dual-Band VTX 32Ch",
  "Foxeer Reaper Extreme 1.8W 72Ch",
  "Foxeer Reaper Extreme 2.5W v1 40Ch",
  "Foxeer Reaper Extreme 2.5W v2 72Ch",
  "Foxeer Reaper Extreme 2.5W v3 80Ch (X-band)",
  "Foxeer Reaper Extreme 3W 72Ch",
  "Foxeer Reaper Extreme 3W v2 80Ch",
  "Foxeer Reaper Infinity 5W 40Ch",
  "Foxeer Reaper Infinity 5W v2 80Ch",
  "Foxeer Reaper Infinity 10W 80Ch",
  "Foxeer Reaper 3.3G 4W 40CH",
  "IFlight BLITZ Whoop 1.6W",
  "IFlight BLITZ Whoop 2.5W",
  "IFlight BLITZ Whoop 4.9G 2.5W",
  "IFlight BLITZ 3.3G 2W",
  "IFlight BLITZ 1.2G 1.6W",
  "GEPRC RAD Mini 5.8G 1W 48CH",
  "GEPRC RAD 5.8G 1.6W 40CH",
  "GEPRC RAD 5.8G 2.5W 40CH",
  "GEPRC MATEN 5.8G 1.6W 72CH",
  "GEPRC MATEN 5.8G 2.5W 72CH",
  "GEPRC MATEN 5.8G PRO 2.5W 72CH",
  "GEPRC MATEN 4.9G PRO 2.5W 8CH",
  "GEPRC MATEN 5.8G PRO 3W 80CH",
  "GEPRC MATEN 5.8G PRO 5W 80CH",
  "GEPRC MATEN 5.8G PRO 10W 96CH",
  "GEPRC MATEN 3.3G PRO 3W",
  "GEPRC MATEN 1.2G 2W",
  "GEPRC MATEN 1.2G PRO 5W",
  "AKK Race Ranger 1.6w 48ch",
  "AKK Race Ranger 1.6w 48ch (L,X updated version)",
  "AKK FX2 Dominator 2w 48ch",
  "AKK FX2 Dominator 2w 48ch (L,X updated version)",
  "AKK Ultra Long Range 3w 48ch",
  "AKK Ultra Long Range 3w 56ch AC version",
  "AKK Ultra Long Range 3w 96ch AC version V2",
  "AKK TX5000AC 5W 96ch",
  "AKK TX8000AC 8w 56ch AC version",
  "AKK Alpha 4 4W 80ch",
  "AKK Alpha 5 5W 80ch",
  "AKK Alpha 8 8W 80ch",
  "AKK Alpha 10 10W 80ch",
  "TBS Sixty9",
  "TBS Unify Pro32 HV",
  "TBS Unify Pro32 DP 3W",
  "HGLRC Zeus VTX PRO 1.6W 40ch",
  "HGLRC Zeus VTX 2.5W 40ch",
  "HGLRC 5.5W high power VTX 80ch",
  "JHEMCU RuiBet 1.6W 40Ch",
  "JHEMCU 2.5W 40Ch",
  "Axisflying SMURFS 1.6W 40ch",
  "Axisflying TERK Max 5.8G 3W 56CH",
  "Axisflying TERK Max 5.8G 5W 56CH",
  "SKYZONE TX2500 2.5W 56ch",
  "SKYZONE TX2501 CNC 2.5W 56ch",
  "SKYZONE TX2501 CNC (2025) 2.5W 64ch",
  "SKYZONE TX2501 2.5W 56ch",
  "SKYZONE VT1225",
  "DIATONE MAMBA ULTRA 2.5W 40ch",
  "DIATONE MAMBA ULTRA 1W 40ch",
  "PandaRC VT-5804-BAT 2.5W 48CH",
  "PandaRC VT-5804-BAT PRO 2.8W 64CH",
  "SpeedyBee ULTRA 1.6W 48ch",
  "SpeedyBee TX800 (US) 40ch",
  "FTWHOBBY 1.6W Hiker 40ch",
  "FTWHOBBY 2.5W Hiker 40ch",
  "FTWHOBBY 1.6W 1.2G Hiker 9ch",
  "Pilotix R2500",
  "Pilotix R2500 V1",
  "Pilotix R2500 SE",
  "Pilotix R3000 3W 5.8G",
  "Pilotix R3000 3W 4.9-6.2G",
  "FT 4W VTX",
  "FT 2.7G 4W VTX",
  "Peak PK1600",
  "Peak PK2500",
  "Peak PK3000",
  "Peak THOR T35",
  "Peak THOR T67",
  "BEASTFPV 4.9-5.8GHz 64CH 5W",
  "BEASTFPV 4.9-5.8GHz 64CH 2.5W",
  "BEASTFPV 3.3 GHz 32CH 5W",
  "LST 3W",
  "LST 3W 4.9-6.1",
  "ULTRA 2500 2.5W 56ch",
  "Ultra 3000 3W 64ch",
  "FlashHobby Solar VTX 5.8G 48Ch 2.5W",
  "Mobula 7",
  "SoloGood PAx 2",
  "FX895T",
  "E-POWERRC",
  "SLONWAKE S1230G_V11",
  "Skystars JUPITER 3W",
  "HumbirdTec 1G3TE 2W 9ch",
  "BetaFPV A25 2.5W 64ch",
  "FlytoFPV F8",
  "Atlatl HV Pro 3W",
  "BelinRC VTX 3W",
  "DMKR 3.3 VTX 4W",
  "ReadyToSky 3.3 GHz 16CH 2.5W",
  "BAYCKRC STARFISH VTX2.5W",
  "Custom / Generic"
];

// --- 4. VTX POWER LEVEL PRESETS ---
const STD_BANDS = ["Band A", "Band B", "Band E", "Band F", "Band R"];
const EXT_BANDS = [...STD_BANDS, "Band L", "Band X"];

export const VTX_PRESETS_DATA: Record<string, { levels: { index: number, label: string, value: number }[], supported_bands?: string[] }> = {
  // 1. D1 / StingBee / Flytex / Motorsoft (2.5W 64Ch -> Extended)
  "D1 VTX 2.5W 64Ch": { levels: [{index:1,label:"25",value:14},{index:2,label:"500",value:27},{index:3,label:"1000",value:30},{index:4,label:"2500",value:34}], supported_bands: EXT_BANDS },
  "StingBee Stellar VTX 2.5W 64Ch": { levels: [{index:1,label:"25",value:14},{index:2,label:"400",value:26},{index:3,label:"1000",value:30},{index:4,label:"2500",value:34}], supported_bands: EXT_BANDS },
  "Flytex Fuzia 2.5W 64ch": { levels: [{index:1,label:"25",value:14},{index:2,label:"400",value:26},{index:3,label:"1000",value:30},{index:4,label:"2500",value:34}], supported_bands: EXT_BANDS },
  "Motorsoft VTX 2.5W 56ch": { levels: [{index:1,label:"25",value:14},{index:2,label:"400",value:26},{index:3,label:"1000",value:30},{index:4,label:"2500",value:34}], supported_bands: EXT_BANDS },

  // Rush
  "Rush Tank Solo 1.6W": { levels: [{index:1,label:"25",value:14},{index:2,label:"400",value:26},{index:3,label:"800",value:30},{index:4,label:"1600",value:33}], supported_bands: STD_BANDS },
  "Rush Max Solo 2.5W": { levels: [{index:1,label:"25",value:14},{index:2,label:"500",value:27},{index:3,label:"1000",value:30},{index:4,label:"2500",value:34}], supported_bands: STD_BANDS },
  "Rush Max Solo 2.5W (+ X-band)": { levels: [{index:1,label:"25",value:14},{index:2,label:"500",value:27},{index:3,label:"1000",value:30},{index:4,label:"2500",value:34}], supported_bands: EXT_BANDS },
  "Rush Max Solo XBAND 4.9G 2.5W": { levels: [{index:1,label:"25",value:14},{index:2,label:"500",value:27},{index:3,label:"1000",value:30},{index:4,label:"2500",value:34}], supported_bands: ["Band X", ...STD_BANDS] },
  "Rush 3.3G 2W VTX (band A)": { levels: [{index:1,label:"25",value:14},{index:2,label:"400",value:26},{index:3,label:"1000",value:30},{index:4,label:"2000",value:33}], supported_bands: ["Band 3.3G-A"] },
  "Rush 3.3G 2W VTX (band B)": { levels: [{index:1,label:"25",value:14},{index:2,label:"400",value:26},{index:3,label:"1000",value:30},{index:4,label:"2000",value:33}], supported_bands: ["Band 3.3G-B"] },
  "Rush 3.3G 4W VTX": { levels: [{index:1,label:"25",value:14},{index:2,label:"1000",value:30},{index:3,label:"2000",value:33},{index:4,label:"4000",value:36}], supported_bands: ["Band 3.3G-A", "Band 3.3G-B"] },
  "Rush 1.3G 1.6W VTX 9Ch (new version)": { levels: [{index:1,label:"25",value:14},{index:2,label:"400",value:26},{index:3,label:"800",value:30},{index:4,label:"1600",value:33}], supported_bands: ["Band 1.3G"] },
  "Rush 1.2/1.3GHz 4W": { levels: [{index:1,label:"25",value:14},{index:2,label:"1000",value:30},{index:3,label:"2000",value:33},{index:4,label:"4000",value:36}], supported_bands: ["Band 1.3G"] },
  "Rush 1.2/1.3GHz 4W V2": { levels: [{index:1,label:"25",value:14},{index:2,label:"1000",value:30},{index:3,label:"2000",value:33},{index:4,label:"4000",value:36}], supported_bands: ["Band 1.3G"] },
  "Rush 4.9G/5.8G 2.5W Dual-Band VTX 56Ch": { levels: [{index:1,label:"25",value:14},{index:2,label:"500",value:27},{index:3,label:"1000",value:30},{index:4,label:"2500",value:34}], supported_bands: EXT_BANDS },
  "Rush 1.3G/3.3G Dual-Band VTX 32Ch": { levels: [{index:1,label:"25",value:14},{index:2,label:"1000",value:30},{index:3,label:"2000",value:33},{index:4,label:"3000",value:35}], supported_bands: ["Band 1.3G", "Band 3.3G-A", "Band 3.3G-B"] },

  // Foxeer
  "Foxeer Reaper Extreme 1.8W 72Ch": { levels: [{index:1,label:"25",value:14},{index:2,label:"400",value:26},{index:3,label:"800",value:30},{index:4,label:"1600",value:33}], supported_bands: EXT_BANDS },
  "Foxeer Reaper Extreme 2.5W v1 40Ch": { levels: [{index:1,label:"25",value:14},{index:2,label:"500",value:27},{index:3,label:"1000",value:30},{index:4,label:"2500",value:34}], supported_bands: STD_BANDS },
  "Foxeer Reaper Extreme 2.5W v2 72Ch": { levels: [{index:1,label:"25",value:14},{index:2,label:"500",value:27},{index:3,label:"1000",value:30},{index:4,label:"2500",value:34}], supported_bands: EXT_BANDS },
  "Foxeer Reaper Extreme 2.5W v3 80Ch (X-band)": { levels: [{index:1,label:"25",value:14},{index:2,label:"500",value:27},{index:3,label:"1000",value:30},{index:4,label:"2500",value:34}], supported_bands: EXT_BANDS },
  "Foxeer Reaper Extreme 3W 72Ch": { levels: [{index:1,label:"25",value:14},{index:2,label:"1000",value:30},{index:3,label:"2000",value:33},{index:4,label:"3000",value:35}], supported_bands: EXT_BANDS },
  "Foxeer Reaper Extreme 3W v2 80Ch": { levels: [{index:1,label:"25",value:14},{index:2,label:"1000",value:30},{index:3,label:"2000",value:33},{index:4,label:"3000",value:35}], supported_bands: EXT_BANDS },
  "Foxeer Reaper Infinity 5W 40Ch": { levels: [{index:1,label:"25",value:14},{index:2,label:"1000",value:30},{index:3,label:"2500",value:34},{index:4,label:"5000",value:36}], supported_bands: STD_BANDS },
  "Foxeer Reaper Infinity 5W v2 80Ch": { levels: [{index:1,label:"25",value:14},{index:2,label:"1000",value:30},{index:3,label:"2500",value:34},{index:4,label:"5000",value:36}], supported_bands: EXT_BANDS },
  "Foxeer Reaper Infinity 10W 80Ch": { levels: [{index:1,label:"25",value:14},{index:2,label:"1000",value:30},{index:3,label:"5000",value:36},{index:4,label:"10000",value:38}], supported_bands: EXT_BANDS },
  "Foxeer Reaper 3.3G 4W 40CH": { levels: [{index:1,label:"25",value:14},{index:2,label:"1000",value:30},{index:3,label:"2000",value:33},{index:4,label:"4000",value:36}], supported_bands: ["Band 3.3G-A", "Band 3.3G-B"] },

  // IFlight
  "IFlight BLITZ Whoop 1.6W": { levels: [{index:1,label:"25",value:14},{index:2,label:"400",value:26},{index:3,label:"800",value:30},{index:4,label:"1600",value:33}], supported_bands: STD_BANDS },
  "IFlight BLITZ Whoop 2.5W": { levels: [{index:1,label:"25",value:14},{index:2,label:"400",value:26},{index:3,label:"1000",value:30},{index:4,label:"2500",value:34}], supported_bands: STD_BANDS },
  "IFlight BLITZ Whoop 4.9G 2.5W": { levels: [{index:1,label:"25",value:14},{index:2,label:"400",value:26},{index:3,label:"1000",value:30},{index:4,label:"2500",value:34}], supported_bands: ["Band X", ...STD_BANDS] },
  "IFlight BLITZ 3.3G 2W": { levels: [{index:1,label:"25",value:14},{index:2,label:"400",value:26},{index:3,label:"1000",value:30},{index:4,label:"2000",value:33}], supported_bands: ["Band 3.3G-A", "Band 3.3G-B"] },
  "IFlight BLITZ 1.2G 1.6W": { levels: [{index:1,label:"25",value:14},{index:2,label:"400",value:26},{index:3,label:"800",value:30},{index:4,label:"1600",value:33}], supported_bands: ["Band 1.3G"] },

  // GEPRC
  "GEPRC RAD Mini 5.8G 1W 48CH": { levels: [{index:1,label:"25",value:14},{index:2,label:"200",value:20},{index:3,label:"600",value:29},{index:4,label:"1000",value:30}], supported_bands: STD_BANDS },
  "GEPRC RAD 5.8G 1.6W 40CH": { levels: [{index:1,label:"25",value:14},{index:2,label:"400",value:26},{index:3,label:"800",value:30},{index:4,label:"1600",value:33}], supported_bands: STD_BANDS },
  "GEPRC RAD 5.8G 2.5W 40CH": { levels: [{index:1,label:"25",value:14},{index:2,label:"400",value:26},{index:3,label:"1000",value:30},{index:4,label:"2500",value:34}], supported_bands: STD_BANDS },
  "GEPRC MATEN 5.8G 1.6W 72CH": { levels: [{index:1,label:"25",value:14},{index:2,label:"400",value:26},{index:3,label:"800",value:30},{index:4,label:"1600",value:33}], supported_bands: EXT_BANDS },
  "GEPRC MATEN 5.8G 2.5W 72CH": { levels: [{index:1,label:"25",value:14},{index:2,label:"400",value:26},{index:3,label:"1000",value:30},{index:4,label:"2500",value:34}], supported_bands: EXT_BANDS },
  "GEPRC MATEN 5.8G PRO 2.5W 72CH": { levels: [{index:1,label:"25",value:14},{index:2,label:"400",value:26},{index:3,label:"1000",value:30},{index:4,label:"2500",value:34}], supported_bands: EXT_BANDS },
  "GEPRC MATEN 4.9G PRO 2.5W 8CH": { levels: [{index:1,label:"25",value:14},{index:2,label:"400",value:26},{index:3,label:"1000",value:30},{index:4,label:"2500",value:34}], supported_bands: ["Band X"] },
  "GEPRC MATEN 5.8G PRO 3W 80CH": { levels: [{index:1,label:"25",value:14},{index:2,label:"1000",value:30},{index:3,label:"2000",value:33},{index:4,label:"3000",value:35}], supported_bands: EXT_BANDS },
  "GEPRC MATEN 5.8G PRO 5W 80CH": { levels: [{index:1,label:"25",value:14},{index:2,label:"1000",value:30},{index:3,label:"2500",value:34},{index:4,label:"5000",value:36}], supported_bands: EXT_BANDS },
  "GEPRC MATEN 5.8G PRO 10W 96CH": { levels: [{index:1,label:"25",value:14},{index:2,label:"1000",value:30},{index:3,label:"5000",value:36},{index:4,label:"10000",value:38}], supported_bands: EXT_BANDS },
  "GEPRC MATEN 3.3G PRO 3W": { levels: [{index:1,label:"25",value:14},{index:2,label:"1000",value:30},{index:3,label:"2000",value:33},{index:4,label:"3000",value:35}], supported_bands: ["Band 3.3G-A", "Band 3.3G-B"] },
  "GEPRC MATEN 1.2G 2W": { levels: [{index:1,label:"25",value:14},{index:2,label:"400",value:26},{index:3,label:"1000",value:30},{index:4,label:"2000",value:33}], supported_bands: ["Band 1.3G"] },
  "GEPRC MATEN 1.2G PRO 5W": { levels: [{index:1,label:"25",value:14},{index:2,label:"1000",value:30},{index:3,label:"2500",value:34},{index:4,label:"5000",value:36}], supported_bands: ["Band 1.3G"] },

  // AKK
  "AKK Race Ranger 1.6w 48ch": { levels: [{index:1,label:"25",value:14},{index:2,label:"400",value:26},{index:3,label:"800",value:30},{index:4,label:"1600",value:33}], supported_bands: STD_BANDS },
  "AKK Race Ranger 1.6w 48ch (L,X updated version)": { levels: [{index:1,label:"25",value:14},{index:2,label:"400",value:26},{index:3,label:"800",value:30},{index:4,label:"1600",value:33}], supported_bands: EXT_BANDS },
  "AKK FX2 Dominator 2w 48ch": { levels: [{index:1,label:"25",value:14},{index:2,label:"400",value:26},{index:3,label:"1000",value:30},{index:4,label:"2000",value:33}], supported_bands: STD_BANDS },
  "AKK FX2 Dominator 2w 48ch (L,X updated version)": { levels: [{index:1,label:"25",value:14},{index:2,label:"400",value:26},{index:3,label:"1000",value:30},{index:4,label:"2000",value:33}], supported_bands: EXT_BANDS },
  "AKK Ultra Long Range 3w 48ch": { levels: [{index:1,label:"25",value:14},{index:2,label:"1000",value:30},{index:3,label:"2000",value:33},{index:4,label:"3000",value:35}], supported_bands: STD_BANDS },
  "AKK Ultra Long Range 3w 56ch AC version": { levels: [{index:1,label:"25",value:14},{index:2,label:"1000",value:30},{index:3,label:"2000",value:33},{index:4,label:"3000",value:35}], supported_bands: EXT_BANDS },
  "AKK Ultra Long Range 3w 96ch AC version V2": { levels: [{index:1,label:"25",value:14},{index:2,label:"1000",value:30},{index:3,label:"2000",value:33},{index:4,label:"3000",value:35}], supported_bands: EXT_BANDS },
  "AKK TX5000AC 5W 96ch": { levels: [{index:1,label:"25",value:14},{index:2,label:"1000",value:30},{index:3,label:"2500",value:34},{index:4,label:"5000",value:36}], supported_bands: EXT_BANDS },
  "AKK TX8000AC 8w 56ch AC version": { levels: [{index:1,label:"25",value:14},{index:2,label:"1000",value:30},{index:3,label:"4000",value:36},{index:4,label:"8000",value:38}], supported_bands: EXT_BANDS },
  "AKK Alpha 4 4W 80ch": { levels: [{index:1,label:"25",value:14},{index:2,label:"1000",value:30},{index:3,label:"2000",value:33},{index:4,label:"4000",value:36}], supported_bands: EXT_BANDS },
  "AKK Alpha 5 5W 80ch": { levels: [{index:1,label:"25",value:14},{index:2,label:"1000",value:30},{index:3,label:"2500",value:34},{index:4,label:"5000",value:36}], supported_bands: EXT_BANDS },
  "AKK Alpha 8 8W 80ch": { levels: [{index:1,label:"25",value:14},{index:2,label:"1000",value:30},{index:3,label:"4000",value:36},{index:4,label:"8000",value:38}], supported_bands: EXT_BANDS },
  "AKK Alpha 10 10W 80ch": { levels: [{index:1,label:"25",value:14},{index:2,label:"1000",value:30},{index:3,label:"5000",value:36},{index:4,label:"10000",value:38}], supported_bands: EXT_BANDS },

  // TBS
  "TBS Sixty9": { levels: [{index:1,label:"25",value:14},{index:2,label:"100",value:20},{index:3,label:"400",value:26},{index:4,label:"1000",value:30}], supported_bands: STD_BANDS },
  "TBS Unify Pro32 HV": { levels: [{index:1,label:"25",value:14},{index:2,label:"100",value:20},{index:3,label:"400",value:26},{index:4,label:"1000+",value:30}], supported_bands: STD_BANDS },
  "TBS Unify Pro32 DP 3W": { levels: [{index:1,label:"25",value:14},{index:2,label:"400",value:26},{index:3,label:"1000",value:30},{index:4,label:"3000",value:35}], supported_bands: STD_BANDS },

  // HGLRC, JHEMCU, Axisflying
  "HGLRC Zeus VTX PRO 1.6W 40ch": { levels: [{index:1,label:"25",value:14},{index:2,label:"400",value:26},{index:3,label:"800",value:30},{index:4,label:"1600",value:33}], supported_bands: STD_BANDS },
  "HGLRC Zeus VTX 2.5W 40ch": { levels: [{index:1,label:"25",value:14},{index:2,label:"400",value:26},{index:3,label:"1000",value:30},{index:4,label:"2500",value:34}], supported_bands: STD_BANDS },
  "HGLRC 5.5W high power VTX 80ch": { levels: [{index:1,label:"25",value:14},{index:2,label:"1000",value:30},{index:3,label:"2500",value:34},{index:4,label:"5500",value:36}], supported_bands: EXT_BANDS },
  "JHEMCU RuiBet 1.6W 40Ch": { levels: [{index:1,label:"25",value:14},{index:2,label:"400",value:26},{index:3,label:"800",value:30},{index:4,label:"1600",value:33}], supported_bands: STD_BANDS },
  "JHEMCU 2.5W 40Ch": { levels: [{index:1,label:"25",value:14},{index:2,label:"400",value:26},{index:3,label:"1000",value:30},{index:4,label:"2500",value:34}], supported_bands: STD_BANDS },
  "Axisflying SMURFS 1.6W 40ch": { levels: [{index:1,label:"25",value:14},{index:2,label:"400",value:26},{index:3,label:"800",value:30},{index:4,label:"1600",value:33}], supported_bands: STD_BANDS },
  "Axisflying TERK Max 5.8G 3W 56CH": { levels: [{index:1,label:"25",value:14},{index:2,label:"1000",value:30},{index:3,label:"2000",value:33},{index:4,label:"3000",value:35}], supported_bands: EXT_BANDS },
  "Axisflying TERK Max 5.8G 5W 56CH": { levels: [{index:1,label:"25",value:14},{index:2,label:"1000",value:30},{index:3,label:"2500",value:34},{index:4,label:"5000",value:36}], supported_bands: EXT_BANDS },

  // SKYZONE
  "SKYZONE TX2500 2.5W 56ch": { levels: [{index:1,label:"25",value:14},{index:2,label:"400",value:26},{index:3,label:"1000",value:30},{index:4,label:"2500",value:34}], supported_bands: EXT_BANDS },
  "SKYZONE TX2501 CNC 2.5W 56ch": { levels: [{index:1,label:"25",value:14},{index:2,label:"400",value:26},{index:3,label:"1000",value:30},{index:4,label:"2500",value:34}], supported_bands: EXT_BANDS },
  "SKYZONE TX2501 CNC (2025) 2.5W 64ch": { levels: [{index:1,label:"25",value:14},{index:2,label:"400",value:26},{index:3,label:"1000",value:30},{index:4,label:"2500",value:34}], supported_bands: EXT_BANDS },
  "SKYZONE TX2501 2.5W 56ch": { levels: [{index:1,label:"25",value:14},{index:2,label:"400",value:26},{index:3,label:"1000",value:30},{index:4,label:"2500",value:34}], supported_bands: EXT_BANDS },
  "SKYZONE VT1225": { levels: [{index:1,label:"25",value:14},{index:2,label:"400",value:26},{index:3,label:"1000",value:30},{index:4,label:"2500",value:34}], supported_bands: STD_BANDS },

  // DIATONE / PandaRC / SpeedyBee
  "DIATONE MAMBA ULTRA 2.5W 40ch": { levels: [{index:1,label:"25",value:14},{index:2,label:"400",value:26},{index:3,label:"1000",value:30},{index:4,label:"2500",value:34}], supported_bands: STD_BANDS },
  "DIATONE MAMBA ULTRA 1W 40ch": { levels: [{index:1,label:"25",value:14},{index:2,label:"200",value:20},{index:3,label:"600",value:29},{index:4,label:"1000",value:30}], supported_bands: STD_BANDS },
  "PandaRC VT-5804-BAT 2.5W 48CH": { levels: [{index:1,label:"25",value:14},{index:2,label:"400",value:26},{index:3,label:"1000",value:30},{index:4,label:"2500",value:34}], supported_bands: STD_BANDS },
  "PandaRC VT-5804-BAT PRO 2.8W 64CH": { levels: [{index:1,label:"25",value:14},{index:2,label:"400",value:26},{index:3,label:"1000",value:30},{index:4,label:"2500",value:34}], supported_bands: EXT_BANDS },
  "SpeedyBee ULTRA 1.6W 48ch": { levels: [{index:1,label:"25",value:14},{index:2,label:"400",value:26},{index:3,label:"800",value:30},{index:4,label:"1600",value:33}], supported_bands: STD_BANDS },
  "SpeedyBee TX800 (US) 40ch": { levels: [{index:1,label:"25",value:14},{index:2,label:"200",value:20},{index:3,label:"400",value:26},{index:4,label:"800",value:29}], supported_bands: STD_BANDS },

  // Others
  "Pilotix R3000 3W 5.8G": { levels: [{index:1,label:"25",value:14},{index:2,label:"1000",value:30},{index:3,label:"2000",value:33},{index:4,label:"3000",value:35}], supported_bands: STD_BANDS },
  "Pilotix R3000 3W 4.9-6.2G": { levels: [{index:1,label:"25",value:14},{index:2,label:"1000",value:30},{index:3,label:"2000",value:33},{index:4,label:"3000",value:35}], supported_bands: EXT_BANDS },
  "FT 4W VTX": { levels: [{index:1,label:"25",value:14},{index:2,label:"1000",value:30},{index:3,label:"2000",value:33},{index:4,label:"4000",value:36}], supported_bands: STD_BANDS },
  "FT 2.7G 4W VTX": { levels: [{index:1,label:"25",value:14},{index:2,label:"1000",value:30},{index:3,label:"2000",value:33},{index:4,label:"4000",value:36}], supported_bands: ["Band 3.3G-A", "Band 3.3G-B"] },
  "Peak PK2500": { levels: [{index:1,label:"25",value:14},{index:2,label:"400",value:26},{index:3,label:"1000",value:30},{index:4,label:"2500",value:34}], supported_bands: STD_BANDS },
  "BEASTFPV 3.3 GHz 32CH 5W": { levels: [{index:1,label:"25",value:14},{index:2,label:"1000",value:30},{index:3,label:"2500",value:34},{index:4,label:"5000",value:36}], supported_bands: ["Band 3.3G-A", "Band 3.3G-B"] },
  "ReadyToSky 3.3 GHz 16CH 2.5W": { levels: [{index:1,label:"25",value:14},{index:2,label:"400",value:26},{index:3,label:"1000",value:30},{index:4,label:"2500",value:34}], supported_bands: ["Band 3.3G-A", "Band 3.3G-B"] },

  // FTWHOBBY
  "FTWHOBBY 1.6W Hiker 40ch": { levels: [{index:1,label:"25",value:14},{index:2,label:"400",value:26},{index:3,label:"800",value:30},{index:4,label:"1600",value:33}], supported_bands: STD_BANDS },
  "FTWHOBBY 2.5W Hiker 40ch": { levels: [{index:1,label:"25",value:14},{index:2,label:"400",value:26},{index:3,label:"1000",value:30},{index:4,label:"2500",value:34}], supported_bands: STD_BANDS },
  "FTWHOBBY 1.6W 1.2G Hiker 9ch": { levels: [{index:1,label:"25",value:14},{index:2,label:"400",value:26},{index:3,label:"800",value:30},{index:4,label:"1600",value:33}], supported_bands: ["Band 1.3G"] },

  // Pilotix
  "Pilotix R2500": { levels: [{index:1,label:"25",value:14},{index:2,label:"400",value:26},{index:3,label:"1000",value:30},{index:4,label:"2500",value:34}], supported_bands: STD_BANDS },
  "Pilotix R2500 V1": { levels: [{index:1,label:"25",value:14},{index:2,label:"400",value:26},{index:3,label:"1000",value:30},{index:4,label:"2500",value:34}], supported_bands: STD_BANDS },
  "Pilotix R2500 SE": { levels: [{index:1,label:"25",value:14},{index:2,label:"400",value:26},{index:3,label:"1000",value:30},{index:4,label:"2500",value:34}], supported_bands: STD_BANDS },

  // Peak
  "Peak PK1600": { levels: [{index:1,label:"25",value:14},{index:2,label:"400",value:26},{index:3,label:"800",value:30},{index:4,label:"1600",value:33}], supported_bands: STD_BANDS },
  "Peak PK3000": { levels: [{index:1,label:"25",value:14},{index:2,label:"1000",value:30},{index:3,label:"2000",value:33},{index:4,label:"3000",value:35}], supported_bands: STD_BANDS },
  "Peak THOR T35": { levels: [{index:1,label:"25",value:14},{index:2,label:"1000",value:30},{index:3,label:"2000",value:33},{index:4,label:"3500",value:35}], supported_bands: EXT_BANDS },
  "Peak THOR T67": { levels: [{index:1,label:"25",value:14},{index:2,label:"1000",value:30},{index:3,label:"3000",value:35},{index:4,label:"6700",value:38}], supported_bands: EXT_BANDS },

  // BEASTFPV
  "BEASTFPV 4.9-5.8GHz 64CH 5W": { levels: [{index:1,label:"25",value:14},{index:2,label:"1000",value:30},{index:3,label:"2500",value:34},{index:4,label:"5000",value:36}], supported_bands: EXT_BANDS },
  "BEASTFPV 4.9-5.8GHz 64CH 2.5W": { levels: [{index:1,label:"25",value:14},{index:2,label:"400",value:26},{index:3,label:"1000",value:30},{index:4,label:"2500",value:34}], supported_bands: EXT_BANDS },

  // LST
  "LST 3W": { levels: [{index:1,label:"25",value:14},{index:2,label:"1000",value:30},{index:3,label:"2000",value:33},{index:4,label:"3000",value:35}], supported_bands: STD_BANDS },
  "LST 3W 4.9-6.1": { levels: [{index:1,label:"25",value:14},{index:2,label:"1000",value:30},{index:3,label:"2000",value:33},{index:4,label:"3000",value:35}], supported_bands: EXT_BANDS },

  // ULTRA
  "ULTRA 2500 2.5W 56ch": { levels: [{index:1,label:"25",value:14},{index:2,label:"400",value:26},{index:3,label:"1000",value:30},{index:4,label:"2500",value:34}], supported_bands: EXT_BANDS },
  "Ultra 3000 3W 64ch": { levels: [{index:1,label:"25",value:14},{index:2,label:"1000",value:30},{index:3,label:"2000",value:33},{index:4,label:"3000",value:35}], supported_bands: EXT_BANDS },

  // FlashHobby
  "FlashHobby Solar VTX 5.8G 48Ch 2.5W": { levels: [{index:1,label:"25",value:14},{index:2,label:"400",value:26},{index:3,label:"1000",value:30},{index:4,label:"2500",value:34}], supported_bands: STD_BANDS },

  // Misc / Integrated VTX
  "Mobula 7": { levels: [{index:1,label:"25",value:14},{index:2,label:"100",value:20},{index:3,label:"200",value:23},{index:4,label:"350",value:25}], supported_bands: STD_BANDS },
  "SoloGood PAx 2": { levels: [{index:1,label:"25",value:14},{index:2,label:"200",value:20},{index:3,label:"400",value:26},{index:4,label:"600",value:29}], supported_bands: STD_BANDS },
  "FX895T": { levels: [{index:1,label:"25",value:14},{index:2,label:"200",value:20},{index:3,label:"400",value:26},{index:4,label:"800",value:29}], supported_bands: STD_BANDS },
  "E-POWERRC": { levels: [{index:1,label:"25",value:14},{index:2,label:"200",value:20},{index:3,label:"400",value:26},{index:4,label:"600",value:29}], supported_bands: STD_BANDS },
  "SLONWAKE S1230G_V11": { levels: [{index:1,label:"25",value:14},{index:2,label:"400",value:26},{index:3,label:"800",value:30},{index:4,label:"1200",value:31}], supported_bands: ["Band 1.3G"] },
  "Skystars JUPITER 3W": { levels: [{index:1,label:"25",value:14},{index:2,label:"1000",value:30},{index:3,label:"2000",value:33},{index:4,label:"3000",value:35}], supported_bands: STD_BANDS },
  "HumbirdTec 1G3TE 2W 9ch": { levels: [{index:1,label:"25",value:14},{index:2,label:"400",value:26},{index:3,label:"1000",value:30},{index:4,label:"2000",value:33}], supported_bands: ["Band 1.3G"] },
  "BetaFPV A25 2.5W 64ch": { levels: [{index:1,label:"25",value:14},{index:2,label:"400",value:26},{index:3,label:"1000",value:30},{index:4,label:"2500",value:34}], supported_bands: EXT_BANDS },
  "FlytoFPV F8": { levels: [{index:1,label:"25",value:14},{index:2,label:"400",value:26},{index:3,label:"1000",value:30},{index:4,label:"2500",value:34}], supported_bands: STD_BANDS },
  "Atlatl HV Pro 3W": { levels: [{index:1,label:"25",value:14},{index:2,label:"1000",value:30},{index:3,label:"2000",value:33},{index:4,label:"3000",value:35}], supported_bands: STD_BANDS },
  "BelinRC VTX 3W": { levels: [{index:1,label:"25",value:14},{index:2,label:"1000",value:30},{index:3,label:"2000",value:33},{index:4,label:"3000",value:35}], supported_bands: STD_BANDS },
  "DMKR 3.3 VTX 4W": { levels: [{index:1,label:"25",value:14},{index:2,label:"1000",value:30},{index:3,label:"2000",value:33},{index:4,label:"4000",value:36}], supported_bands: ["Band 3.3G-A", "Band 3.3G-B"] },
  "BAYCKRC STARFISH VTX2.5W": { levels: [{index:1,label:"25",value:14},{index:2,label:"400",value:26},{index:3,label:"1000",value:30},{index:4,label:"2500",value:34}], supported_bands: STD_BANDS },

  // Default
  "Custom / Generic": { levels: [{index:1,label:"25",value:14},{index:2,label:"200",value:20},{index:3,label:"400",value:26},{index:4,label:"600",value:29}], supported_bands: STD_BANDS }
};

// --- 5. OPTIONS ---
export const VTX_AUX_CHANNELS = [
  "AUX 1", "AUX 2", "AUX 3", "AUX 4", "AUX 5", "AUX 6", 
  "AUX 7", "AUX 8", "AUX 9", "AUX 10", "AUX 11", "AUX 12"
];

export const SERIAL_PORTS = [
  "UART 1", "UART 2", "UART 3", "UART 4", "UART 5", "UART 6"
];

export const VTX_PROTOCOLS = [
  "IRC Tramp",
  "TBS SmartAudio",
  "MSP"
];

export const VTX_DEFAULT_BANDS_OPTIONS = [
  { value: 1,  label: 'Band A' },
  { value: 2,  label: 'Band B' },
  { value: 3,  label: 'Band E' },
  { value: 4,  label: 'Band F' },
  { value: 5,  label: 'Band R' },
  { value: 6,  label: 'Band L' },
  { value: 7,  label: 'Band X' },
  { value: 8,  label: 'Band 1.3G' },
  { value: 9,  label: 'Band 3.3G-A' },
  { value: 10, label: 'Band 3.3G-B' },
];

export const VTX_DEFAULT_CHANNELS_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];

// --- 6. STL CATALOG DATA ---
export interface STLItem {
  id: string;
  title: string;
  type: string;
  frame: string;
  author: string;
  image: string;
  downloadUrl: string;
  date: string;
}

export const STL_TYPES = [
  'Camera Mount', 'Legs / Landing Gear', 'Adjustable Camera Mount', 'RX Antenna Holder',
  'VTX Antenna Holder', 'GPS Holder', 'VTX Holder', 'Other'
];

export const STL_FRAMES = [
 'Apex HD', 'Mark4', 'Mark4 V2', 'XL10 v6', 'Other / Universal'
];

export const STL_AUTHORS = [
  'Craft', 'Barvinok', 'Berlin', 'dmytr0', 'FPV Mafia', 'Geprc', 'Kemp'
];

export const STL_ITEMS_DATA: STLItem[] = [
  {
    id: '1',
    title: 'Mark4 GPS Mount (BN-220)',
    type: 'GPS Holder',
    frame: 'Mark4',
    author: 'FPV Mafia',
    image: '',
    downloadUrl: '',
    date: '2025-01-20'
  }
];