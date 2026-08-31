import Svg, { Circle, G, Line, Text as SvgText } from 'react-native-svg';
import type { PremiumNatalResponse } from '@/features/astrology/api/types';

const SIZE = 330, C = SIZE / 2;
const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const glyphs = ['♈︎', '♉︎', '♊︎', '♋︎', '♌︎', '♍︎', '♎︎', '♏︎', '♐︎', '♑︎', '♒︎', '♓︎'];
const planetGlyph: Record<string, string> = { Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀', Mars: '♂', Jupiter: '♃', Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇' };
function point(longitude: number, radius: number, asc: number) { const angle = ((180 - (longitude - asc)) * Math.PI) / 180; return { x: C + Math.cos(angle) * radius, y: C - Math.sin(angle) * radius }; }
function longitude(sign: string, degree: number) { return Math.max(0, signs.indexOf(sign)) * 30 + degree; }

export function NatalWheel({ wheel }: { wheel: PremiumNatalResponse['premium']['wheel'] }) {
  const asc = wheel.angles.asc.startDegree;
  const planetPoints = new Map(wheel.planets.map((planet) => [planet.name, point(longitude(planet.sign, planet.degree), 96, asc)]));
  return <Svg accessibilityLabel="Tam doğum haritası çarkı" height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} width="100%">
    <Circle cx={C} cy={C} fill="#FFFCF5" r={158} stroke="#173A70" strokeWidth={2} /><Circle cx={C} cy={C} fill="none" r={126} stroke="#C9A55A" /><Circle cx={C} cy={C} fill="none" r={72} stroke="#D9D4C8" />
    {signs.map((sign, index) => { const border = point(index * 30, 158, asc), label = point(index * 30 + 15, 142, asc), inner = point(index * 30, 126, asc); return <G key={sign}><Line x1={inner.x} y1={inner.y} x2={border.x} y2={border.y} stroke="#C9A55A" /><SvgText fill="#173A70" fontSize={17} fontWeight="700" textAnchor="middle" x={label.x} y={label.y + 6}>{glyphs[index]}</SvgText></G>; })}
    {wheel.houses.map((house) => { const outer = point(house.startDegree, 126, asc), inner = point(house.startDegree, 72, asc), label = point(house.startDegree + 12, 81, asc); return <G key={house.id}><Line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="#8B90A0" strokeWidth={[1, 4, 7, 10].includes(house.id) ? 2 : 1} /><SvgText fill="#8B90A0" fontSize={9} textAnchor="middle" x={label.x} y={label.y + 3}>{house.id}</SvgText></G>; })}
    {wheel.aspects.filter((a) => ['conjunction', 'opposition', 'square', 'trine', 'sextile'].includes(a.type.toLowerCase())).slice(0, 24).map((aspect, index) => { const from = planetPoints.get(aspect.from), to = planetPoints.get(aspect.to); if (!from || !to) return null; return <Line key={`${aspect.from}-${aspect.to}-${index}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={['trine', 'sextile'].includes(aspect.type.toLowerCase()) ? '#2B6CB0' : '#B05A5A'} strokeOpacity={0.48} />; })}
    {wheel.planets.map((planet) => { const p = planetPoints.get(planet.name)!; return <SvgText key={planet.name} fill="#10294D" fontSize={18} fontWeight="700" textAnchor="middle" x={p.x} y={p.y + 6}>{planetGlyph[planet.name] ?? '•'}</SvgText>; })}
    {(['asc', 'dsc', 'mc', 'ic'] as const).map((key) => { const p = point(wheel.angles[key].startDegree, 116, asc); return <SvgText key={key} fill="#9A742A" fontSize={9} fontWeight="900" textAnchor="middle" x={p.x} y={p.y + 3}>{key.toUpperCase()}</SvgText>; })}
  </Svg>;
}
