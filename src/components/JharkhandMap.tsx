import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import { INITIAL_UNIVERSITIES, INITIAL_ORGANIZATIONS } from '../data/jharkhandData';

interface MapProps {
  districtStats: { district: string; challengesCount: number; activeProjects: number }[];
  onSelectDistrict?: (district: string) => void;
  onSelectInstitution?: (institution: { id: string; name: string; type: 'university' | 'industry' }) => void;
}

const normalizeDistrictName = (name: string) => {
  const lower = name.toLowerCase().trim();
  if (lower === 'purba singhbhum') return 'east singhbhum';
  if (lower === 'pashchimi singhbhum') return 'west singhbhum';
  if (lower === 'hazaribag') return 'hazaribagh';
  if (lower === 'saraikela-kharsawan') return 'saraikela kharsawan';
  if (lower === 'kodarma') return 'koderma';
  return lower;
};

export const JharkhandMap: React.FC<MapProps> = ({ districtStats, onSelectDistrict, onSelectInstitution }) => {
  const [geoData, setGeoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/shuklaneerajdev/IndiaStateTopojsonFiles/master/Jharkhand.geojson')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch map data');
        return res.json();
      })
      .then((data) => {
        setGeoData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load Jharkhand GeoJSON:', err);
        setError(true);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!geoData || !svgRef.current) return;

    const width = 600;
    const height = 500;

    // Create a combined GeoJSON object for projection fitting to ensure markers are included
    const institutionsWithCoordinates = [
      ...INITIAL_UNIVERSITIES,
      ...INITIAL_ORGANIZATIONS,
    ].filter((institution: any) => {
      const coords = institution.locationCoords;
      return coords && Number.isFinite(coords.lng) && Number.isFinite(coords.lat);
    });

    const markersGeoJson = {
      type: 'FeatureCollection',
      features: institutionsWithCoordinates.map((institution: any) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [institution.locationCoords.lng, institution.locationCoords.lat],
        },
        properties: { name: institution.name },
      })),
    };

    const combinedGeoData = {
      type: 'FeatureCollection',
      features: [...geoData.features, ...markersGeoJson.features]
    };

    const svg = d3
      .select(svgRef.current)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .attr('width', '100%')
      .attr('height', '100%');

    svg.selectAll('*').remove();

    // Define a filter for a sharp outer border around the union of all districts
    const defs = svg.append('defs');
    const filter = defs.append('filter')
      .attr('id', 'state-outline')
      .attr('x', '-10%')
      .attr('y', '-10%')
      .attr('width', '120%')
      .attr('height', '120%');

    filter.append('feMorphology')
      .attr('operator', 'dilate')
      .attr('radius', '0.372')
      .attr('in', 'SourceAlpha')
      .attr('result', 'dilated');

    filter.append('feComposite')
      .attr('in', 'dilated')
      .attr('in2', 'SourceAlpha')
      .attr('operator', 'out')
      .attr('result', 'outline');

    filter.append('feFlood')
      .attr('flood-color', '#1A1A1A')
      .attr('result', 'color');

    filter.append('feComposite')
      .attr('in', 'color')
      .attr('in2', 'outline')
      .attr('operator', 'in')
      .attr('result', 'border');

    filter.append('feMerge')
      .call(merge => {
        merge.append('feMergeNode').attr('in', 'border');
        merge.append('feMergeNode').attr('in', 'SourceGraphic');
      });

    // Create a projection fitting the bounding box of both the map and the markers
    const projection = d3.geoMercator().fitSize([width - 40, height - 40], combinedGeoData as any);
    const pathGenerator = d3.geoPath().projection(projection);

    const getInnovationScore = (stat: { challengesCount: number; activeProjects: number }) => {
      return stat.challengesCount + (stat.activeProjects * 3);
    };

    const maxScore = (d3.max(districtStats, (d) => getInnovationScore(d)) || 1) as number;

    // Create a color scale based on the combined innovation score
    const colorScale = d3.scaleSequential(d3.interpolateOranges).domain([0, maxScore * 1.2]);

    const g = svg.append('g');
    const districtsGroup = g.append('g')
      .attr('class', 'districts-layer')
      .style('filter', 'url(#state-outline)');
    const internalLinesGroup = g.append('g').attr('class', 'internal-lines-layer');
    const markersGroup = g.append('g').attr('class', 'markers-layer');

    districtsGroup.selectAll('path')
      .data(geoData.features)
      .enter()
      .append('path')
      .attr('d', pathGenerator as any)
      .attr('fill', (d: any) => {
        const distName = d.properties.Dist_Name || '';
        const normalized = normalizeDistrictName(distName);
        const stat = districtStats.find((s) => s.district.toLowerCase() === normalized);
        if (!stat) return '#FAF7F2';
        const score = getInnovationScore(stat);
        if (score === 0) return '#FAF7F2';
        return colorScale(score);
      })
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1)
      .style('cursor', 'pointer')
      .style('transition', 'fill 0.2s, stroke 0.2s')
      .on('mouseover', function (event, d: any) {
        // Bring the hovered path to the front of the districts layer
        d3.select(this).raise();

        d3.select(this)
          .attr('stroke', '#000000')
          .attr('stroke-width', 2);

        const distName = d.properties.Dist_Name || '';
        const normalized = normalizeDistrictName(distName);
        const stat = districtStats.find((s) => s.district.toLowerCase() === normalized);

        if (tooltipRef.current) {
          tooltipRef.current.style.opacity = '1';
          tooltipRef.current.innerHTML = `
            <div class="font-editorial-serif text-lg font-bold text-stone-900 border-b border-stone-200 pb-1 mb-2">${stat?.district || distName}</div>
            <div class="text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">Challenges: <strong class="text-stone-900 ml-1">${stat?.challengesCount || 0}</strong></div>
            <div class="text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">Active Projects: <strong class="text-stone-900 ml-1">${stat?.activeProjects || 0}</strong></div>
            <div class="text-[10px] font-bold uppercase tracking-wider text-[#BC5434] border-t border-stone-100 pt-1 mt-1">Innovation Score: <strong class="text-stone-900 ml-1">${stat ? getInnovationScore(stat) : 0}</strong></div>
          `;
        }
      })
      .on('mousemove', function (event) {
        if (tooltipRef.current) {
          tooltipRef.current.style.left = event.clientX + 15 + 'px';
          tooltipRef.current.style.top = event.clientY - 20 + 'px';
        }
      })
      .on('mouseout', function (event, d: any) {
        d3.select(this)
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 1.5);

        if (tooltipRef.current) {
          tooltipRef.current.style.opacity = '0';
        }
      })
      .on('click', (event, d: any) => {
        const distName = d.properties.Dist_Name || '';
        const normalized = normalizeDistrictName(distName);
        const stat = districtStats.find((s) => s.district.toLowerCase() === normalized);
        if (stat && onSelectDistrict) {
          onSelectDistrict(stat.district);
        }
      });

      // --- Render Institution Markers ---
      const allInstitutions = [
        ...INITIAL_UNIVERSITIES.map(u => ({ ...u, type: 'university', color: '#78350F', iconLabel: 'University' })),
        ...INITIAL_ORGANIZATIONS.map(i => ({ ...i, type: 'industry', color: '#B91C1C', iconLabel: 'Industry' })),
      ].filter((institution: any) => {
        const coords = institution.locationCoords;
        return coords && Number.isFinite(coords.lng) && Number.isFinite(coords.lat);
      });

      markersGroup.selectAll('.inst-marker')
        .data(allInstitutions)
        .enter()
        .append('circle')
        .attr('class', 'inst-marker')
        .attr('cx', (d: any) => {
          const coords = projection([d.locationCoords.lng, d.locationCoords.lat]);
          return coords ? coords[0] : 0;
        })
        .attr('cy', (d: any) => {
          const coords = projection([d.locationCoords.lng, d.locationCoords.lat]);
          return coords ? coords[1] : 0;
        })
        .attr('r', 3)
        .attr('fill', (d: any) => d.color)
        .attr('stroke', '#fff')
        .attr('stroke-width', 1)
        .style('cursor', 'pointer')
        .style('filter', 'drop-shadow(0px 0px 1px rgba(0,0,0,0.5))')
        .on('mouseover', function (event, d: any) {
          d3.select(this).attr('r', 5).attr('stroke-width', 2);
          if (tooltipRef.current) {
            tooltipRef.current.style.opacity = '1';
            tooltipRef.current.innerHTML = `
              <div class="flex items-center gap-2 mb-1">
                <div class="w-2 h-2 rounded-full" style="background-color: ${d.color}"></div>
                <span class="text-[10px] font-bold uppercase tracking-wider text-stone-500">${d.iconLabel}</span>
              </div>
              <div class="font-editorial-serif text-sm font-bold text-stone-900">${d.name}</div>
              <div class="text-[10px] text-stone-600 italic">${d.district || d.headquarters || ''}</div>
            `;
          }
        })
        .on('mousemove', function (event) {
          if (tooltipRef.current) {
            tooltipRef.current.style.left = event.clientX + 15 + 'px';
            tooltipRef.current.style.top = event.clientY - 20 + 'px';
          }
        })
        .on('mouseout', function () {
          d3.select(this).attr('r', 3).attr('stroke-width', 1);
          if (tooltipRef.current) {
            tooltipRef.current.style.opacity = '0';
          }
        })
        .on('click', (event, d: any) => {
          if (onSelectInstitution) {
            onSelectInstitution({
              id: d.id,
              name: d.name,
              type: d.type === 'university' ? 'university' : 'industry'
            });
          }
        });

      // Optional text labels for districts
      /*
      g.selectAll('text')
        .data(geoData.features)
        .enter()
        .append('text')
        .attr('transform', (d: any) => \`translate(\${pathGenerator.centroid(d)})\`)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('font-weight', '500')
        .attr('fill', '#1a1a1a')
        .style('pointer-events', 'none')
        .text((d: any) => {
          const name = d.properties.Dist_Name || '';
          return name;
        });
      */
  }, [geoData, districtStats, onSelectDistrict, onSelectInstitution]);

  if (error) return <div className="p-8 text-center text-sm text-red-500 font-medium">Map data failed to load.</div>;
  
  return (
    <div className="relative w-full h-full min-h-[300px] md:min-h-[400px]">
      <svg ref={svgRef} className="w-full h-full drop-shadow-sm"></svg>
      {/* Tooltip portal */}
      <div
        ref={tooltipRef}
        className="fixed pointer-events-none opacity-0 bg-white border border-slate-200 shadow-xl rounded-lg p-3 text-sm z-50 transition-opacity duration-150"
        style={{ left: 0, top: 0, minWidth: '150px' }}
      ></div>
    </div>
  );
};
