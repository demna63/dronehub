// src/constants/toolsData.ts

export interface VTXChannel {
  id: number;
  name: string;
  freq: number;
}

export interface VTXBandGroup {
  name: string;
  channels: VTXChannel[];
}

export const VTX_ALL_BANDS: VTXBandGroup[] = [
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
  {
    name: "Band L",
    channels: [
      { id: 1, name: "L1", freq: 5362 }, { id: 2, name: "L2", freq: 5399 }, { id: 3, name: "L3", freq: 5436 }, { id: 4, name: "L4", freq: 5473 },
      { id: 5, name: "L5", freq: 5510 }, { id: 6, name: "L6", freq: 5547 }, { id: 7, name: "L7", freq: 5584 }, { id: 8, name: "L8", freq: 5621 }
    ]
  },
  {
    name: "Band X",
    channels: [
      { id: 1, name: "X1", freq: 4990 }, { id: 2, name: "X2", freq: 5020 }, { id: 3, name: "X3", freq: 5050 }, { id: 4, name: "X4", freq: 5080 },
      { id: 5, name: "X5", freq: 5110 }, { id: 6, name: "X6", freq: 5140 }, { id: 7, name: "X7", freq: 5170 }, { id: 8, name: "X8", freq: 5200 }
    ]
  },
  {
    name: "Band 1.3G",
    channels: [
      { id: 1, name: "1.3G-1", freq: 1080 }, { id: 2, name: "1.3G-2", freq: 1120 }, { id: 3, name: "1.3G-3", freq: 1160 }, { id: 4, name: "1.3G-4", freq: 1200 },
      { id: 5, name: "1.3G-5", freq: 1240 }, { id: 6, name: "1.3G-6", freq: 1280 }, { id: 7, name: "1.3G-7", freq: 1320 }, { id: 8, name: "1.3G-8", freq: 1360 }
    ]
  },
  {
    name: "Band 3.3G-A",
    channels: [
      { id: 1, name: "3.3G-A1", freq: 3360 }, { id: 2, name: "3.3G-A2", freq: 3380 }, { id: 3, name: "3.3G-A3", freq: 3400 }, { id: 4, name: "3.3G-A4", freq: 3420 }, { id: 5, name: "3.3G-A5", freq: 3440 }, { id: 6, name: "3.3G-A6", freq: 3460 }, { id: 7, name: "3.3G-A7", freq: 3480 }, { id: 8, name: "3.3G-A8", freq: 3500 }
    ]
  },
  {
    name: "Band 3.3G-B",
    channels: [
      { id: 1, name: "3.3G-B1", freq: 3200 }, { id: 2, name: "3.3G-B2", freq: 3220 }, { id: 3, name: "3.3G-B3", freq: 3240 }, { id: 4, name: "3.3G-B4", freq: 3260 }, { id: 5, name: "3.3G-B5", freq: 3280 }, { id: 6, name: "3.3G-B6", freq: 3300 }, { id: 7, name: "3.3G-B7", freq: 3320 }, { id: 8, name: "3.3G-B8", freq: 3340 }
    ]
  },
  {
    name: "Band 3.3G-E",
    channels: [
      { id: 1, name: "3.3G-E1", freq: 3330 }, { id: 2, name: "3.3G-E2", freq: 3350 }, { id: 3, name: "3.3G-E3", freq: 3370 }, { id: 4, name: "3.3G-E4", freq: 3390 }, { id: 5, name: "3.3G-E5", freq: 3410 }, { id: 6, name: "3.3G-E6", freq: 3430 }, { id: 7, name: "3.3G-E7", freq: 3450 }, { id: 8, name: "3.3G-E8", freq: 3470 }
    ]
  },
  {
    name: "Band 3.3G-F",
    channels: [
      { id: 1, name: "3.3G-F1", freq: 3170 }, { id: 2, name: "3.3G-F2", freq: 3190 }, { id: 3, name: "3.3G-F3", freq: 3210 }, { id: 4, name: "3.3G-F4", freq: 3230 }, { id: 5, name: "3.3G-F5", freq: 3250 }, { id: 6, name: "3.3G-F6", freq: 3270 }, { id: 7, name: "3.3G-F7", freq: 3290 }, { id: 8, name: "3.3G-F8", freq: 3310 }
    ]
  },
  {
    name: "Band 3.3G-R",
    channels: [
      { id: 1, name: "3.3G-R1", freq: 3320 }, { id: 2, name: "3.3G-R2", freq: 3345 }, { id: 3, name: "3.3G-R3", freq: 3370 }, { id: 4, name: "3.3G-R4", freq: 3395 }, { id: 5, name: "3.3G-R5", freq: 3420 }, { id: 6, name: "3.3G-R6", freq: 3445 }, { id: 7, name: "3.3G-R7", freq: 3470 }, { id: 8, name: "3.3G-R8", freq: 3495 }
    ]
  },
  {
    name: "Band 3.3G-L",
    channels: [
      { id: 1, name: "3.3G-L1", freq: 3310 }, { id: 2, name: "3.3G-L2", freq: 3330 }, { id: 3, name: "3.3G-L3", freq: 3355 }, { id: 4, name: "3.3G-L4", freq: 3380 }, { id: 5, name: "3.3G-L5", freq: 3405 }, { id: 6, name: "3.3G-L6", freq: 3430 }, { id: 7, name: "3.3G-L7", freq: 3455 }, { id: 8, name: "3.3G-L8", freq: 3480 }
    ]
  },
  {
    name: "Band 3.3G-X",
    channels: [
      { id: 1, name: "3.3G-X1", freq: 3220 }, { id: 2, name: "3.3G-X2", freq: 3240 }, { id: 3, name: "3.3G-X3", freq: 3260 }, { id: 4, name: "3.3G-X4", freq: 3280 }, { id: 5, name: "3.3G-X5", freq: 3300 }, { id: 6, name: "3.3G-X6", freq: 3320 }, { id: 7, name: "3.3G-X7", freq: 3340 }, { id: 8, name: "3.3G-X8", freq: 3360 }
    ]
  },
  {
    name: "Band 3.3G-Y",
    channels: [
      { id: 1, name: "3.3G-Y1", freq: 3060 }, { id: 2, name: "3.3G-Y2", freq: 3080 }, { id: 3, name: "3.3G-Y3", freq: 3100 }, { id: 4, name: "3.3G-Y4", freq: 3120 }, { id: 5, name: "3.3G-Y5", freq: 3140 }, { id: 6, name: "3.3G-Y6", freq: 3160 }, { id: 7, name: "3.3G-Y7", freq: 3180 }, { id: 8, name: "3.3G-Y8", freq: 3200 }
    ]
  }
];

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
  'DronehubGe'
];

