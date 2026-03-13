"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TechnicalSheetCard;
var react_1 = require("react");
var react_native_1 = require("react-native");
var react_native_svg_1 = require("react-native-svg");
function normalizeType(value) {
    var v = (value || '').trim().toLowerCase();
    if (v.includes('ring'))
        return 'ring';
    if (v.includes('necklace') || v.includes('mangalsutra'))
        return 'necklace';
    if (v.includes('chain'))
        return 'chain';
    if (v.includes('pendant'))
        return 'pendant';
    if (v.includes('bracelet'))
        return 'bracelet';
    if (v.includes('bangle') || v.includes('kada'))
        return 'bangle';
    if (v.includes('earring') || v.includes('stud') || v.includes('hoop'))
        return 'earrings';
    return 'other';
}
function SpecTable(_a) {
    var sheet = _a.sheet;
    return (<>
      <react_native_svg_1.Rect x="40" y="410" width="700" height="450" rx="10" fill="#ffffff" stroke="#d5d5d5"/>
      <react_native_svg_1.Text x="60" y="445" fontSize="24" fontWeight="700" fill="#111111">SPECIFICATIONS</react_native_svg_1.Text>
      {sheet.specRows.slice(0, 10).map(function (row, index) {
            var y = 490 + index * 32;
            return (<react_1.default.Fragment key={"".concat(row.label, "-").concat(index)}>
            <react_native_svg_1.Text x="60" y={y} fontSize="18" fontWeight="700" fill="#111111">{row.label}</react_native_svg_1.Text>
            <react_native_svg_1.Text x="300" y={y} fontSize="18" fill="#333333">{row.value}</react_native_svg_1.Text>
          </react_1.default.Fragment>);
        })}
    </>);
}
function RingDiagram(_a) {
    var sheet = _a.sheet;
    var hasSideStones = sheet.sideStoneCount > 0;
    return (<react_native_svg_1.default width="100%" height={460} viewBox="0 0 800 920">
      <react_native_svg_1.Rect x="20" y="20" width="760" height="880" rx="18" fill="#ffffff" stroke="#111111" strokeWidth="2"/>
      <react_native_svg_1.Text x="50" y="65" fontSize="24" fontWeight="700" fill="#111111">TOP VIEW</react_native_svg_1.Text>
      <react_native_svg_1.Text x="430" y="65" fontSize="24" fontWeight="700" fill="#111111">SIDE VIEW</react_native_svg_1.Text>
      <react_native_svg_1.Rect x="40" y="80" width="320" height="300" rx="10" fill="#fafafa" stroke="#d5d5d5"/>
      <react_native_svg_1.Rect x="420" y="80" width="320" height="300" rx="10" fill="#fafafa" stroke="#d5d5d5"/>
      <react_native_svg_1.Ellipse cx="200" cy="230" rx="110" ry="78" fill="none" stroke="#111111" strokeWidth="6"/>
      <react_native_svg_1.Ellipse cx="200" cy="230" rx="72" ry="48" fill="none" stroke="#444444" strokeWidth="3"/>
      <react_native_svg_1.Circle cx="200" cy="170" r="34" fill="none" stroke="#111111" strokeWidth="4"/>
      {hasSideStones ? (<>
          <react_native_svg_1.Circle cx="142" cy="190" r="8" fill="none" stroke="#111111" strokeWidth="2"/>
          <react_native_svg_1.Circle cx="128" cy="204" r="7" fill="none" stroke="#111111" strokeWidth="2"/>
          <react_native_svg_1.Circle cx="118" cy="220" r="6" fill="none" stroke="#111111" strokeWidth="2"/>
          <react_native_svg_1.Circle cx="112" cy="238" r="5.5" fill="none" stroke="#111111" strokeWidth="2"/>
          <react_native_svg_1.Circle cx="258" cy="190" r="8" fill="none" stroke="#111111" strokeWidth="2"/>
          <react_native_svg_1.Circle cx="272" cy="204" r="7" fill="none" stroke="#111111" strokeWidth="2"/>
          <react_native_svg_1.Circle cx="282" cy="220" r="6" fill="none" stroke="#111111" strokeWidth="2"/>
          <react_native_svg_1.Circle cx="288" cy="238" r="5.5" fill="none" stroke="#111111" strokeWidth="2"/>
        </>) : null}
      <react_native_svg_1.Line x1="200" y1="120" x2="200" y2="95" stroke="#111111" strokeWidth="2"/>
      <react_native_svg_1.Line x1="166" y1="95" x2="234" y2="95" stroke="#111111" strokeWidth="2"/>
      <react_native_svg_1.Text x="98" y="92" fontSize="18" fill="#111111">A = {sheet.centerStoneDiameterMm || 0} mm</react_native_svg_1.Text>
      <react_native_svg_1.Line x1="96" y1="300" x2="60" y2="300" stroke="#111111" strokeWidth="2"/>
      <react_native_svg_1.Line x1="60" y1="152" x2="60" y2="308" stroke="#111111" strokeWidth="2"/>
      <react_native_svg_1.Text x="70" y="318" fontSize="18" fill="#111111">B = {sheet.bandWidthMm || 0} mm</react_native_svg_1.Text>
      <react_native_svg_1.Text x="110" y="355" fontSize="18" fill="#111111">Ring Size: {sheet.ringSize || '—'}</react_native_svg_1.Text>
      <react_native_svg_1.Line x1="470" y1="285" x2="690" y2="285" stroke="#111111" strokeWidth="6"/>
      <react_native_svg_1.Line x1="500" y1="285" x2="535" y2="235" stroke="#111111" strokeWidth="4"/>
      <react_native_svg_1.Line x1="660" y1="285" x2="625" y2="235" stroke="#111111" strokeWidth="4"/>
      <react_native_svg_1.Line x1="535" y1="235" x2="625" y2="235" stroke="#111111" strokeWidth="4"/>
      <react_native_svg_1.Circle cx="580" cy="195" r="32" fill="none" stroke="#111111" strokeWidth="4"/>
      <react_native_svg_1.Line x1="580" y1="160" x2="580" y2="115" stroke="#111111" strokeWidth="2"/>
      <react_native_svg_1.Line x1="545" y1="115" x2="615" y2="115" stroke="#111111" strokeWidth="2"/>
      <react_native_svg_1.Text x="485" y="108" fontSize="18" fill="#111111">C = center stone</react_native_svg_1.Text>
      <react_native_svg_1.Line x1="455" y1="285" x2="455" y2="235" stroke="#111111" strokeWidth="2"/>
      <react_native_svg_1.Line x1="455" y1="235" x2="430" y2="235" stroke="#111111" strokeWidth="2"/>
      <react_native_svg_1.Text x="430" y="225" fontSize="18" fill="#111111">D = {sheet.prongCount || 0} prongs</react_native_svg_1.Text>
      <react_native_svg_1.Text x="515" y="355" fontSize="18" fill="#111111">Finish: {sheet.finishLevel || '—'}</react_native_svg_1.Text>
      <SpecTable sheet={sheet}/>
    </react_native_svg_1.default>);
}
function NecklaceDiagram(_a) {
    var sheet = _a.sheet;
    return (<react_native_svg_1.default width="100%" height={460} viewBox="0 0 800 920">
      <react_native_svg_1.Rect x="20" y="20" width="760" height="880" rx="18" fill="#ffffff" stroke="#111111" strokeWidth="2"/>
      <react_native_svg_1.Text x="50" y="65" fontSize="24" fontWeight="700" fill="#111111">FRONT VIEW</react_native_svg_1.Text>
      <react_native_svg_1.Text x="430" y="65" fontSize="24" fontWeight="700" fill="#111111">DIMENSIONS</react_native_svg_1.Text>
      <react_native_svg_1.Rect x="40" y="80" width="320" height="300" rx="10" fill="#fafafa" stroke="#d5d5d5"/>
      <react_native_svg_1.Rect x="420" y="80" width="320" height="300" rx="10" fill="#fafafa" stroke="#d5d5d5"/>
      <react_native_svg_1.Path d="M120 145 C 145 310, 255 310, 280 145" fill="none" stroke="#111111" strokeWidth="8"/>
      <react_native_svg_1.Circle cx="120" cy="145" r="10" fill="#111111"/>
      <react_native_svg_1.Circle cx="280" cy="145" r="10" fill="#111111"/>
      <react_native_svg_1.Path d="M160 145 C 175 260, 225 260, 240 145" fill="none" stroke="#555555" strokeWidth="3" strokeDasharray="8 8"/>
      <react_native_svg_1.Text x="105" y="340" fontSize="18" fill="#111111">Style: {sheet.chainStyle || 'not specified'}</react_native_svg_1.Text>
      <react_native_svg_1.Text x="105" y="366" fontSize="18" fill="#111111">Clasp: {sheet.claspStyle || 'not specified'}</react_native_svg_1.Text>
      <react_native_svg_1.Text x="105" y="392" fontSize="18" fill="#111111">Length: {sheet.necklaceLength || 'not specified'}</react_native_svg_1.Text>
      <react_native_svg_1.Line x1="500" y1="140" x2="670" y2="140" stroke="#111111" strokeWidth="2"/>
      <react_native_svg_1.Line x1="500" y1="140" x2="500" y2="300" stroke="#111111" strokeWidth="2"/>
      <react_native_svg_1.Line x1="670" y1="140" x2="670" y2="300" stroke="#111111" strokeWidth="2"/>
      <react_native_svg_1.Text x="515" y="130" fontSize="18" fill="#111111">A = {sheet.necklaceLength || 'not specified'}</react_native_svg_1.Text>
      <react_native_svg_1.Line x1="450" y1="235" x2="690" y2="235" stroke="#111111" strokeWidth="5" strokeDasharray="10 6"/>
      <react_native_svg_1.Text x="450" y="220" fontSize="18" fill="#111111">B = chain path reference</react_native_svg_1.Text>
      <react_native_svg_1.Text x="450" y="340" fontSize="18" fill="#111111">Finish: {sheet.finishLevel || '—'}</react_native_svg_1.Text>
      <react_native_svg_1.Text x="450" y="366" fontSize="18" fill="#111111">Metal: {sheet.metalPurity} {sheet.metal}</react_native_svg_1.Text>
      <SpecTable sheet={sheet}/>
    </react_native_svg_1.default>);
}
function PendantDiagram(_a) {
    var sheet = _a.sheet;
    return (<react_native_svg_1.default width="100%" height={460} viewBox="0 0 800 920">
      <react_native_svg_1.Rect x="20" y="20" width="760" height="880" rx="18" fill="#ffffff" stroke="#111111" strokeWidth="2"/>
      <react_native_svg_1.Text x="50" y="65" fontSize="24" fontWeight="700" fill="#111111">FRONT VIEW</react_native_svg_1.Text>
      <react_native_svg_1.Text x="430" y="65" fontSize="24" fontWeight="700" fill="#111111">PENDANT DETAILS</react_native_svg_1.Text>
      <react_native_svg_1.Rect x="40" y="80" width="320" height="300" rx="10" fill="#fafafa" stroke="#d5d5d5"/>
      <react_native_svg_1.Rect x="420" y="80" width="320" height="300" rx="10" fill="#fafafa" stroke="#d5d5d5"/>
      <react_native_svg_1.Ellipse cx="200" cy="230" rx="68" ry="92" fill="none" stroke="#111111" strokeWidth="5"/>
      <react_native_svg_1.Circle cx="200" cy="125" r="18" fill="none" stroke="#111111" strokeWidth="4"/>
      <react_native_svg_1.Line x1="200" y1="137" x2="200" y2="200" stroke="#111111" strokeWidth="2" strokeDasharray="8 8"/>
      <react_native_svg_1.Text x="118" y="338" fontSize="18" fill="#111111">Style: {sheet.pendantStyle || 'not specified'}</react_native_svg_1.Text>
      <react_native_svg_1.Text x="118" y="364" fontSize="18" fill="#111111">Chain: {sheet.chainStyle || 'pendant only'}</react_native_svg_1.Text>
      <react_native_svg_1.Text x="118" y="390" fontSize="18" fill="#111111">Length: {sheet.necklaceLength || 'pendant only'}</react_native_svg_1.Text>
      <react_native_svg_1.Line x1="470" y1="130" x2="470" y2="330" stroke="#111111" strokeWidth="2"/>
      <react_native_svg_1.Line x1="470" y1="130" x2="560" y2="130" stroke="#111111" strokeWidth="2"/>
      <react_native_svg_1.Line x1="470" y1="330" x2="560" y2="330" stroke="#111111" strokeWidth="2"/>
      <react_native_svg_1.Text x="572" y="236" fontSize="18" fill="#111111">A = pendant height</react_native_svg_1.Text>
      <react_native_svg_1.Line x1="520" y1="220" x2="690" y2="220" stroke="#111111" strokeWidth="2"/>
      <react_native_svg_1.Text x="530" y="205" fontSize="18" fill="#111111">B = silhouette width</react_native_svg_1.Text>
      <react_native_svg_1.Text x="450" y="350" fontSize="18" fill="#111111">Stone: {sheet.shape || 'not specified'} {sheet.stone || ''}</react_native_svg_1.Text>
      <SpecTable sheet={sheet}/>
    </react_native_svg_1.default>);
}
function BraceletDiagram(_a) {
    var sheet = _a.sheet;
    return (<react_native_svg_1.default width="100%" height={460} viewBox="0 0 800 920">
      <react_native_svg_1.Rect x="20" y="20" width="760" height="880" rx="18" fill="#ffffff" stroke="#111111" strokeWidth="2"/>
      <react_native_svg_1.Text x="50" y="65" fontSize="24" fontWeight="700" fill="#111111">TOP VIEW</react_native_svg_1.Text>
      <react_native_svg_1.Text x="430" y="65" fontSize="24" fontWeight="700" fill="#111111">DETAILS</react_native_svg_1.Text>
      <react_native_svg_1.Rect x="40" y="80" width="320" height="300" rx="10" fill="#fafafa" stroke="#d5d5d5"/>
      <react_native_svg_1.Rect x="420" y="80" width="320" height="300" rx="10" fill="#fafafa" stroke="#d5d5d5"/>
      <react_native_svg_1.Ellipse cx="200" cy="230" rx="115" ry="75" fill="none" stroke="#111111" strokeWidth="8"/>
      <react_native_svg_1.Ellipse cx="200" cy="230" rx="82" ry="48" fill="none" stroke="#555555" strokeWidth="3"/>
      <react_native_svg_1.Text x="100" y="340" fontSize="18" fill="#111111">Wrist size: {sheet.wristSize || 'not specified'}</react_native_svg_1.Text>
      <react_native_svg_1.Text x="100" y="366" fontSize="18" fill="#111111">Style: {sheet.braceletStyle || 'not specified'}</react_native_svg_1.Text>
      <react_native_svg_1.Text x="450" y="170" fontSize="18" fill="#111111">Clasp: {sheet.claspStyle || 'not specified'}</react_native_svg_1.Text>
      <react_native_svg_1.Text x="450" y="200" fontSize="18" fill="#111111">Finish: {sheet.finishLevel || '—'}</react_native_svg_1.Text>
      <react_native_svg_1.Text x="450" y="230" fontSize="18" fill="#111111">Metal: {sheet.metalPurity} {sheet.metal}</react_native_svg_1.Text>
      <SpecTable sheet={sheet}/>
    </react_native_svg_1.default>);
}
function BangleDiagram(_a) {
    var sheet = _a.sheet;
    return (<react_native_svg_1.default width="100%" height={460} viewBox="0 0 800 920">
      <react_native_svg_1.Rect x="20" y="20" width="760" height="880" rx="18" fill="#ffffff" stroke="#111111" strokeWidth="2"/>
      <react_native_svg_1.Text x="50" y="65" fontSize="24" fontWeight="700" fill="#111111">TOP VIEW</react_native_svg_1.Text>
      <react_native_svg_1.Text x="430" y="65" fontSize="24" fontWeight="700" fill="#111111">HINGE / DETAILS</react_native_svg_1.Text>
      <react_native_svg_1.Rect x="40" y="80" width="320" height="300" rx="10" fill="#fafafa" stroke="#d5d5d5"/>
      <react_native_svg_1.Rect x="420" y="80" width="320" height="300" rx="10" fill="#fafafa" stroke="#d5d5d5"/>
      <react_native_svg_1.Ellipse cx="200" cy="230" rx="115" ry="90" fill="none" stroke="#111111" strokeWidth="10"/>
      <react_native_svg_1.Ellipse cx="200" cy="230" rx="88" ry="65" fill="none" stroke="#555555" strokeWidth="3"/>
      <react_native_svg_1.Line x1="200" y1="130" x2="200" y2="105" stroke="#111111" strokeWidth="2"/>
      <react_native_svg_1.Line x1="115" y1="105" x2="285" y2="105" stroke="#111111" strokeWidth="2"/>
      <react_native_svg_1.Text x="125" y="95" fontSize="18" fill="#111111">A = {sheet.bangleInnerDiameterMm || 'not specified'}</react_native_svg_1.Text>
      <react_native_svg_1.Text x="85" y="340" fontSize="18" fill="#111111">Style: {sheet.bangleStyle || 'not specified'}</react_native_svg_1.Text>
      <react_native_svg_1.Text x="85" y="366" fontSize="18" fill="#111111">Wrist size: {sheet.wristSize || 'not specified'}</react_native_svg_1.Text>
      <react_native_svg_1.Rect x="500" y="160" width="140" height="90" rx="8" fill="none" stroke="#111111" strokeWidth="4"/>
      <react_native_svg_1.Line x1="570" y1="160" x2="570" y2="250" stroke="#111111" strokeWidth="2" strokeDasharray="8 8"/>
      <react_native_svg_1.Text x="445" y="290" fontSize="18" fill="#111111">Opening: {sheet.isOpenableBangle || 'not specified'}</react_native_svg_1.Text>
      <react_native_svg_1.Text x="445" y="320" fontSize="18" fill="#111111">Metal: {sheet.metalPurity} {sheet.metal}</react_native_svg_1.Text>
      <react_native_svg_1.Text x="445" y="350" fontSize="18" fill="#111111">Finish: {sheet.finishLevel || '—'}</react_native_svg_1.Text>
      <SpecTable sheet={sheet}/>
    </react_native_svg_1.default>);
}
function EarringDiagram(_a) {
    var sheet = _a.sheet;
    return (<react_native_svg_1.default width="100%" height={460} viewBox="0 0 800 920">
      <react_native_svg_1.Rect x="20" y="20" width="760" height="880" rx="18" fill="#ffffff" stroke="#111111" strokeWidth="2"/>
      <react_native_svg_1.Text x="50" y="65" fontSize="24" fontWeight="700" fill="#111111">FRONT VIEW</react_native_svg_1.Text>
      <react_native_svg_1.Text x="430" y="65" fontSize="24" fontWeight="700" fill="#111111">DETAILS</react_native_svg_1.Text>
      <react_native_svg_1.Rect x="40" y="80" width="320" height="300" rx="10" fill="#fafafa" stroke="#d5d5d5"/>
      <react_native_svg_1.Rect x="420" y="80" width="320" height="300" rx="10" fill="#fafafa" stroke="#d5d5d5"/>
      <react_native_svg_1.Circle cx="145" cy="170" r="24" fill="none" stroke="#111111" strokeWidth="5"/>
      <react_native_svg_1.Path d="M145 195 C145 255, 195 255, 195 315" fill="none" stroke="#111111" strokeWidth="5"/>
      <react_native_svg_1.Circle cx="245" cy="170" r="24" fill="none" stroke="#111111" strokeWidth="5"/>
      <react_native_svg_1.Path d="M245 195 C245 255, 195 255, 195 315" fill="none" stroke="#111111" strokeWidth="5"/>
      <react_native_svg_1.Text x="95" y="345" fontSize="18" fill="#111111">Style: {sheet.earringStyle || 'not specified'}</react_native_svg_1.Text>
      <react_native_svg_1.Text x="95" y="371" fontSize="18" fill="#111111">Length: {sheet.earringLengthMm || 'not specified'}</react_native_svg_1.Text>
      <react_native_svg_1.Text x="450" y="170" fontSize="18" fill="#111111">Backing: {sheet.earringBackingType || 'not specified'}</react_native_svg_1.Text>
      <react_native_svg_1.Text x="450" y="200" fontSize="18" fill="#111111">Metal: {sheet.metalPurity} {sheet.metal}</react_native_svg_1.Text>
      <react_native_svg_1.Text x="450" y="230" fontSize="18" fill="#111111">Stone: {sheet.shape} {sheet.stone}</react_native_svg_1.Text>
      <SpecTable sheet={sheet}/>
    </react_native_svg_1.default>);
}
function TechnicalSheetCard(_a) {
    var sheet = _a.sheet;
    var normalizedType = (0, react_1.useMemo)(function () { return normalizeType(sheet.normalizedType || sheet.jewelryType); }, [sheet.normalizedType, sheet.jewelryType]);
    return (<react_native_1.View style={styles.card}>
      <react_native_1.Text style={styles.title}>{sheet.title}</react_native_1.Text>
      <react_native_1.Text style={styles.subtitle}>CAD-style technical layout for {sheet.jewelryType || 'jewelry'}</react_native_1.Text>

      <react_native_1.View style={styles.canvasWrap}>
        {normalizedType === 'ring' ? (<RingDiagram sheet={sheet}/>) : normalizedType === 'pendant' ? (<PendantDiagram sheet={sheet}/>) : normalizedType === 'necklace' || normalizedType === 'chain' ? (<NecklaceDiagram sheet={sheet}/>) : normalizedType === 'bracelet' ? (<BraceletDiagram sheet={sheet}/>) : normalizedType === 'bangle' ? (<BangleDiagram sheet={sheet}/>) : normalizedType === 'earrings' ? (<EarringDiagram sheet={sheet}/>) : (<NecklaceDiagram sheet={sheet}/>)}
      </react_native_1.View>

      <react_native_1.View style={styles.noteBlock}>
        <react_native_1.Text style={styles.noteTitle}>Technical Notes</react_native_1.Text>
        {sheet.notes.map(function (note, index) { return (<react_native_1.Text key={"".concat(note, "-").concat(index)} style={styles.noteText}>• {note}</react_native_1.Text>); })}
      </react_native_1.View>
    </react_native_1.View>);
}
var styles = react_native_1.StyleSheet.create({
    card: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 14,
        padding: 16,
        backgroundColor: '#fff',
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111',
    },
    subtitle: {
        fontSize: 13,
        color: '#555',
        marginTop: 4,
        marginBottom: 14,
    },
    canvasWrap: {
        width: '100%',
        minHeight: 460,
        backgroundColor: '#fff',
    },
    noteBlock: {
        marginTop: 14,
    },
    noteTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111',
        marginBottom: 8,
    },
    noteText: {
        fontSize: 13,
        color: '#444',
        lineHeight: 20,
        marginBottom: 4,
    },
});
