import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

export type TechnicalSheetData = {
  title: string;
  jewelryType: string;
  normalizedType?: string;
  metal: string;
  metalPurity: string;
  stone: string;
  shape: string;
  ringSize: string;
  centerStoneCarat: number;
  centerStoneDiameterMm: number;
  sideStoneTotalCarat: number;
  sideStoneCount: number;
  sideStonesPerSide: number;
  sideStoneEachCarat: number;
  prongCount: number;
  bandWidthMm: number;
  settingStyle: string;
  finishLevel: string;
  necklaceLength: string;
  chainStyle: string;
  pendantStyle: string;
  braceletStyle: string;
  claspStyle: string;
  wristSize: string;
  bangleStyle: string;
  bangleInnerDiameterMm: string;
  isOpenableBangle: string;
  earringStyle: string;
  earringLengthMm: string;
  earringBackingType: string;
  notes: string[];
  specRows: { label: string; value: string }[];
};

type Props = { sheet: TechnicalSheetData };
type NormalizedType = 'ring' | 'necklace' | 'chain' | 'pendant' | 'bracelet' | 'bangle' | 'earrings' | 'other';

function normalizeType(value?: string): NormalizedType {
  const raw = (value || '').trim().toLowerCase();
  if (!raw) return 'other';
  if (raw.includes('tennis')) return 'bracelet';
  if (raw.includes('chain')) return 'chain';
  if (raw.includes('ear')) return 'earrings';
  if (raw.includes('pend')) return 'pendant';
  if (raw.includes('neck')) return 'necklace';
  if (raw.includes('brace')) return 'bracelet';
  if (raw.includes('bangle')) return 'bangle';
  if (raw.includes('ring') || raw.includes('band')) return 'ring';
  return 'other';
}

function SpecTable({ sheet }: Props) {
  return (
    <>
      <Rect x="24" y="430" width="752" height="440" rx="14" fill="#07111D" stroke="#2A4059" />
      <SvgText x="46" y="462" fontSize="22" fontWeight="700" fill="#F8F8F8">SPECIFICATIONS</SvgText>
      {sheet.specRows.slice(0, 12).map((row, index) => {
        const y = 500 + index * 28;
        return (
          <React.Fragment key={`${row.label}-${index}`}>
            <SvgText x="46" y={y} fontSize="15" fontWeight="700" fill="#E8EDF2">{row.label}</SvgText>
            <SvgText x="290" y={y} fontSize="15" fill="#C8D0D8">{row.value}</SvgText>
          </React.Fragment>
        );
      })}
    </>
  );
}

function CanvasFrame({ leftTitle, rightTitle, children }: { leftTitle: string; rightTitle: string; children: React.ReactNode }) {
  return (
    <Svg width="100%" height={470} viewBox="0 0 800 920">
      <Rect x="12" y="12" width="776" height="896" rx="18" fill="#07111D" stroke="#2A4059" strokeWidth="2" />
      <SvgText x="36" y="50" fontSize="26" fontWeight="700" fill="#F8F8F8">{leftTitle}</SvgText>
      <SvgText x="420" y="50" fontSize="26" fontWeight="700" fill="#F8F8F8">{rightTitle}</SvgText>
      <Rect x="26" y="64" width="354" height="336" rx="10" fill="#102033" stroke="#2A4059" />
      <Rect x="420" y="64" width="354" height="336" rx="10" fill="#102033" stroke="#2A4059" />
      {children}
    </Svg>
  );
}

function RingDiagram({ sheet }: Props) {
  return (
    <CanvasFrame leftTitle="RING CAD SPECIFICATION" rightTitle="SIDE + DETAIL VIEW">
      <Ellipse cx="202" cy="230" rx="110" ry="78" fill="none" stroke="#F3F4F6" strokeWidth="6" />
      <Ellipse cx="202" cy="230" rx="72" ry="48" fill="none" stroke="#9BAABC" strokeWidth="3" />
      <Circle cx="202" cy="170" r="34" fill="none" stroke="#F3F4F6" strokeWidth="4" />
      <Line x1="202" y1="120" x2="202" y2="96" stroke="#C8D0D8" strokeWidth="2" />
      <Line x1="168" y1="96" x2="236" y2="96" stroke="#C8D0D8" strokeWidth="2" />
      <SvgText x="98" y="90" fontSize="17" fill="#F8F8F8">Center = {sheet.centerStoneDiameterMm || 0} mm</SvgText>
      <SvgText x="110" y="355" fontSize="18" fill="#F8F8F8">Ring size: {sheet.ringSize || '—'}</SvgText>
      <SvgText x="110" y="382" fontSize="18" fill="#F8F8F8">Band width: {sheet.bandWidthMm || 0} mm</SvgText>

      <Line x1="470" y1="285" x2="690" y2="285" stroke="#F3F4F6" strokeWidth="6" />
      <Line x1="500" y1="285" x2="535" y2="235" stroke="#F3F4F6" strokeWidth="4" />
      <Line x1="660" y1="285" x2="625" y2="235" stroke="#F3F4F6" strokeWidth="4" />
      <Line x1="535" y1="235" x2="625" y2="235" stroke="#F3F4F6" strokeWidth="4" />
      <Circle cx="580" cy="195" r="30" fill="none" stroke="#F3F4F6" strokeWidth="4" />
      <SvgText x="455" y="350" fontSize="18" fill="#F8F8F8">Setting: {sheet.settingStyle || 'not specified'}</SvgText>
      <SvgText x="455" y="376" fontSize="18" fill="#F8F8F8">Finish: {sheet.finishLevel || 'polished'}</SvgText>
      <SpecTable sheet={sheet} />
    </CanvasFrame>
  );
}

function NecklaceDiagram({ sheet }: Props) {
  return (
    <CanvasFrame leftTitle="NECKLACE / CHAIN SHEET" rightTitle="DETAIL + DIMENSIONS">
      <Path d="M118 145 C 150 315, 250 315, 282 145" fill="none" stroke="#D4AF37" strokeWidth="8" />
      <Path d="M160 145 C 180 260, 220 260, 240 145" fill="none" stroke="#9BAABC" strokeWidth="3" strokeDasharray="8 8" />
      <SvgText x="92" y="348" fontSize="18" fill="#F8F8F8">Length: {sheet.necklaceLength || '18 in'}</SvgText>
      <SvgText x="92" y="374" fontSize="18" fill="#F8F8F8">Chain: {sheet.chainStyle || 'not specified'}</SvgText>
      <SvgText x="92" y="400" fontSize="18" fill="#F8F8F8">Clasp: {sheet.claspStyle || 'not specified'}</SvgText>
      <Line x1="480" y1="150" x2="670" y2="150" stroke="#C8D0D8" strokeWidth="2" />
      <SvgText x="485" y="136" fontSize="18" fill="#F8F8F8">Gauge + path reference</SvgText>
      <Line x1="480" y1="222" x2="670" y2="222" stroke="#D4AF37" strokeWidth="10" />
      <SvgText x="480" y="262" fontSize="18" fill="#F8F8F8">Metal: {sheet.metalPurity} {sheet.metal}</SvgText>
      <SvgText x="480" y="288" fontSize="18" fill="#F8F8F8">Finish: {sheet.finishLevel || 'polished'}</SvgText>
      <SpecTable sheet={sheet} />
    </CanvasFrame>
  );
}

function PendantDiagram({ sheet }: Props) {
  return (
    <CanvasFrame leftTitle="PENDANT CAD SHEET" rightTitle="PENDANT DETAIL">
      <Circle cx="202" cy="125" r="16" fill="none" stroke="#F3F4F6" strokeWidth="4" />
      <Ellipse cx="202" cy="235" rx="70" ry="92" fill="none" stroke="#F3F4F6" strokeWidth="5" />
      <SvgText x="112" y="350" fontSize="18" fill="#F8F8F8">Style: {sheet.pendantStyle || 'not specified'}</SvgText>
      <SvgText x="112" y="376" fontSize="18" fill="#F8F8F8">Stone: {sheet.shape || ''} {sheet.stone || ''}</SvgText>
      <Rect x="510" y="145" width="130" height="160" rx="12" fill="none" stroke="#F3F4F6" strokeWidth="4" />
      <SvgText x="468" y="338" fontSize="18" fill="#F8F8F8">Bail and frame sized to chain gauge</SvgText>
      <SpecTable sheet={sheet} />
    </CanvasFrame>
  );
}

function BraceletDiagram({ sheet }: Props) {
  return (
    <CanvasFrame leftTitle="BRACELET CAD SHEET" rightTitle="DETAIL + LOCK">
      <Ellipse cx="200" cy="230" rx="120" ry="74" fill="none" stroke="#F3F4F6" strokeWidth="8" />
      <Ellipse cx="200" cy="230" rx="88" ry="48" fill="none" stroke="#9BAABC" strokeWidth="3" />
      <SvgText x="94" y="350" fontSize="18" fill="#F8F8F8">Wrist size: {sheet.wristSize || '7 in'}</SvgText>
      <SvgText x="94" y="376" fontSize="18" fill="#F8F8F8">Style: {sheet.braceletStyle || 'not specified'}</SvgText>
      <Line x1="470" y1="225" x2="690" y2="225" stroke="#F3F4F6" strokeWidth="10" />
      <SvgText x="468" y="264" fontSize="18" fill="#F8F8F8">Clasp: {sheet.claspStyle || 'safety lock'}</SvgText>
      <SvgText x="468" y="290" fontSize="18" fill="#F8F8F8">Accent stones: {sheet.sideStoneCount || 0} pcs</SvgText>
      <SpecTable sheet={sheet} />
    </CanvasFrame>
  );
}

function BangleDiagram({ sheet }: Props) {
  return (
    <CanvasFrame leftTitle="BANGLE CAD SHEET" rightTitle="HINGE + PROFILE">
      <Ellipse cx="202" cy="230" rx="118" ry="92" fill="none" stroke="#D4AF37" strokeWidth="10" />
      <Ellipse cx="202" cy="230" rx="92" ry="68" fill="none" stroke="#9BAABC" strokeWidth="3" />
      <SvgText x="95" y="350" fontSize="18" fill="#F8F8F8">Inner diameter: {sheet.bangleInnerDiameterMm || '62 mm'}</SvgText>
      <SvgText x="95" y="376" fontSize="18" fill="#F8F8F8">Style: {sheet.bangleStyle || 'not specified'}</SvgText>
      <Rect x="515" y="165" width="120" height="82" rx="10" fill="none" stroke="#F3F4F6" strokeWidth="4" />
      <SvgText x="460" y="292" fontSize="18" fill="#F8F8F8">Opening: {sheet.isOpenableBangle || 'not specified'}</SvgText>
      <SvgText x="460" y="318" fontSize="18" fill="#F8F8F8">Finish: {sheet.finishLevel || 'polished'}</SvgText>
      <SpecTable sheet={sheet} />
    </CanvasFrame>
  );
}

function EarringDiagram({ sheet }: Props) {
  return (
    <CanvasFrame leftTitle="EARRING CAD SHEET" rightTitle="STONE MAP + BACK DETAIL">
      <Circle cx="150" cy="150" r="26" fill="none" stroke="#F3F4F6" strokeWidth="4" />
      <Circle cx="115" cy="130" r="12" fill="none" stroke="#C8D0D8" strokeWidth="3" />
      <Circle cx="185" cy="130" r="12" fill="none" stroke="#C8D0D8" strokeWidth="3" />
      <Circle cx="110" cy="173" r="10" fill="none" stroke="#C8D0D8" strokeWidth="3" />
      <Circle cx="190" cy="173" r="10" fill="none" stroke="#C8D0D8" strokeWidth="3" />
      <Path d="M150 176 C150 220, 182 238, 182 276" fill="none" stroke="#F3F4F6" strokeWidth="4" />
      <Circle cx="182" cy="302" r="22" fill="none" stroke="#F3F4F6" strokeWidth="4" />
      <Circle cx="152" cy="290" r="10" fill="none" stroke="#C8D0D8" strokeWidth="3" />
      <Circle cx="212" cy="290" r="10" fill="none" stroke="#C8D0D8" strokeWidth="3" />
      <Path d="M182 324 C182 344, 182 360, 182 380" fill="none" stroke="#F3F4F6" strokeWidth="4" />
      <Ellipse cx="182" cy="402" rx="16" ry="22" fill="none" stroke="#F3F4F6" strokeWidth="4" />
      <Line x1="224" y1="150" x2="290" y2="150" stroke="#C8D0D8" strokeWidth="2" />
      <SvgText x="294" y="155" fontSize="16" fill="#F8F8F8">Top cluster ~4.0 mm</SvgText>
      <Line x1="214" y1="300" x2="290" y2="300" stroke="#C8D0D8" strokeWidth="2" />
      <SvgText x="294" y="305" fontSize="16" fill="#F8F8F8">Bottom cluster ~6.5 mm</SvgText>
      <SvgText x="80" y="432" fontSize="17" fill="#F8F8F8">Style: {sheet.earringStyle || 'drop / cluster'}</SvgText>
      <SvgText x="80" y="458" fontSize="17" fill="#F8F8F8">Length: {sheet.earringLengthMm || '28 mm'}</SvgText>
      <Rect x="470" y="122" width="176" height="76" rx="10" fill="none" stroke="#F3F4F6" strokeWidth="3" />
      <Line x1="490" y1="160" x2="610" y2="160" stroke="#F3F4F6" strokeWidth="4" />
      <Circle cx="622" cy="160" r="14" fill="none" stroke="#F3F4F6" strokeWidth="3" />
      <SvgText x="468" y="225" fontSize="17" fill="#F8F8F8">Backing: {sheet.earringBackingType || 'post + push back'}</SvgText>
      <SvgText x="468" y="251" fontSize="17" fill="#F8F8F8">Stone family: {sheet.shape} {sheet.stone}</SvgText>
      <SvgText x="468" y="277" fontSize="17" fill="#F8F8F8">Symmetry: radial cluster alignment</SvgText>
      <Rect x="470" y="310" width="176" height="108" rx="12" fill="#102033" stroke="#2A4059" />
      <SvgText x="486" y="338" fontSize="17" fontWeight="700" fill="#F8F8F8">CAD Notes</SvgText>
      <SvgText x="486" y="365" fontSize="15" fill="#C8D0D8">Round Brilliant • 14 pcs</SvgText>
      <SvgText x="486" y="389" fontSize="15" fill="#C8D0D8">Marquise • 10 pcs</SvgText>
      <SvgText x="486" y="413" fontSize="15" fill="#C8D0D8">Pear / accent • 2 pcs</SvgText>
      <SpecTable sheet={sheet} />
    </CanvasFrame>
  );
}

export default function TechnicalSheetCard({ sheet }: Props) {
  const normalizedType = useMemo<NormalizedType>(() => normalizeType(sheet.normalizedType || sheet.jewelryType), [sheet.normalizedType, sheet.jewelryType]);
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{sheet.title}</Text>
      <Text style={styles.subtitle}>Phase 4.2 CAD-style technical layout for {sheet.jewelryType || 'jewelry'} with production-sheet notes, deterministic dimensions, stone map structure, and design-lock consistency across all supported jewelry types.</Text>
      <View style={styles.canvasWrap}>
        {normalizedType === 'ring' ? <RingDiagram sheet={sheet} /> : normalizedType === 'pendant' ? <PendantDiagram sheet={sheet} /> : normalizedType === 'necklace' || normalizedType === 'chain' ? <NecklaceDiagram sheet={sheet} /> : normalizedType === 'bracelet' ? <BraceletDiagram sheet={sheet} /> : normalizedType === 'bangle' ? <BangleDiagram sheet={sheet} /> : normalizedType === 'earrings' ? <EarringDiagram sheet={sheet} /> : <NecklaceDiagram sheet={sheet} />}
      </View>
      <View style={styles.noteBlock}>
        <Text style={styles.noteTitle}>Technical Notes</Text>
        {sheet.notes.map((note, index) => <Text key={`${note}-${index}`} style={styles.noteText}>• {note}</Text>)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderColor: '#1D2A37', borderRadius: 14, padding: 16, backgroundColor: '#0B1320', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '700', color: '#F8F8F8' },
  subtitle: { fontSize: 13, color: '#C8D0D8', marginTop: 4, marginBottom: 14 },
  canvasWrap: { width: '100%', minHeight: 470, backgroundColor: '#0B1320' },
  noteBlock: { marginTop: 14 },
  noteTitle: { fontSize: 15, fontWeight: '700', color: '#F8F8F8', marginBottom: 8 },
  noteText: { fontSize: 13, color: '#D3DAE3', lineHeight: 20, marginBottom: 4 },
});
