import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { HistoricalTrendPoint } from '../types';
import { formatCurrency, SupportedCurrency } from '../utils/currency';
import {
  TrendingDown,
  TrendingUp,
  Activity,
  Layers,
  Sparkles,
  Calendar,
  Maximize2,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';

interface D3FareTrendChartProps {
  data: HistoricalTrendPoint[];
  origin: string;
  destination: string;
  currency?: SupportedCurrency;
  height?: number;
}

export const D3FareTrendChart: React.FC<D3FareTrendChartProps> = ({
  data,
  origin,
  destination,
  currency = 'INR',
  height = 360
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Time range filter
  const [timeRange, setTimeRange] = useState<'7d' | '14d' | '30d'>('30d');

  // Series visibility toggles
  const [showAverage, setShowAverage] = useState(true);
  const [showMinDeal, setShowMinDeal] = useState(true);
  const [showMaxSurge, setShowMaxSurge] = useState(true);
  const [showAreaFill, setShowAreaFill] = useState(true);

  // Hover state
  const [hoveredPoint, setHoveredPoint] = useState<HistoricalTrendPoint | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  // Filtered dataset
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    if (timeRange === '7d') return data.slice(-7);
    if (timeRange === '14d') return data.slice(-14);
    return data;
  }, [data, timeRange]);

  // Statistics
  const stats = useMemo<{
    min: number;
    max: number;
    avg: number;
    minPoint: HistoricalTrendPoint | null;
    maxPoint: HistoricalTrendPoint | null;
  }>(() => {
    if (filteredData.length === 0) {
      return { min: 0, max: 0, avg: 0, minPoint: null, maxPoint: null };
    }
    let min = Infinity;
    let max = -Infinity;
    let sum = 0;
    let minPoint: HistoricalTrendPoint | null = null;
    let maxPoint: HistoricalTrendPoint | null = null;

    filteredData.forEach(p => {
      sum += p.avgFare;
      if (p.minFare < min) {
        min = p.minFare;
        minPoint = p;
      }
      if (p.maxFare > max) {
        max = p.maxFare;
        maxPoint = p;
      }
    });

    return {
      min,
      max,
      avg: Math.round(sum / filteredData.length),
      minPoint,
      maxPoint
    };
  }, [filteredData]);

  // Render D3 chart
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || filteredData.length === 0) return;

    const containerWidth = containerRef.current.clientWidth;
    const width = Math.max(containerWidth, 320);
    const margin = { top: 25, right: 35, bottom: 45, left: 65 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    svg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);

    // Parse dates
    const parsedData = filteredData.map(d => ({
      ...d,
      parsedDate: new Date(d.date)
    }));

    // Scales
    const xExtent = d3.extent(parsedData, d => d.parsedDate) as [Date, Date];
    const xScale = d3.scaleTime()
      .domain(xExtent)
      .range([0, innerWidth]);

    const allPrices: number[] = [];
    parsedData.forEach(d => {
      if (showMinDeal) allPrices.push(d.minFare);
      if (showAverage) allPrices.push(d.avgFare);
      if (showMaxSurge) allPrices.push(d.maxFare);
    });
    if (allPrices.length === 0) allPrices.push(1000, 10000);

    const yMin = Math.max(0, (d3.min(allPrices) || 2000) * 0.9);
    const yMax = (d3.max(allPrices) || 10000) * 1.08;

    const yScale = d3.scaleLinear()
      .domain([yMin, yMax])
      .nice()
      .range([innerHeight, 0]);

    // Defs: Gradients and drop shadows
    const defs = svg.append('defs');

    // Area Gradient
    const areaGrad = defs.append('linearGradient')
      .attr('id', 'd3-fare-gradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    areaGrad.append('stop').attr('offset', '0%').attr('stop-color', '#38bdf8').attr('stop-opacity', 0.35);
    areaGrad.append('stop').attr('offset', '70%').attr('stop-color', '#0284c7').attr('stop-opacity', 0.08);
    areaGrad.append('stop').attr('offset', '100%').attr('stop-color', '#0284c7').attr('stop-opacity', 0.0);

    // Surge Range Area Gradient
    const surgeGrad = defs.append('linearGradient')
      .attr('id', 'd3-surge-gradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    surgeGrad.append('stop').attr('offset', '0%').attr('stop-color', '#f43f5e').attr('stop-opacity', 0.15);
    surgeGrad.append('stop').attr('offset', '100%').attr('stop-color', '#34d399').attr('stop-opacity', 0.05);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Horizontal Grid Lines
    const yAxisGrid = d3.axisLeft(yScale)
      .tickSize(-innerWidth)
      .tickFormat(() => '')
      .ticks(6);

    g.append('g')
      .attr('class', 'grid')
      .call(yAxisGrid)
      .selectAll('line')
      .attr('stroke', '#1e293b')
      .attr('stroke-dasharray', '3 3')
      .attr('stroke-opacity', 0.8);

    g.select('.domain').remove();

    // Max-to-Min Surge Range Band Fill (if enabled)
    if (showMaxSurge && showMinDeal) {
      const surgeAreaGenerator = d3.area<any>()
        .x(d => xScale(d.parsedDate))
        .y0(d => yScale(d.minFare))
        .y1(d => yScale(d.maxFare))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(parsedData)
        .attr('fill', 'url(#d3-surge-gradient)')
        .attr('d', surgeAreaGenerator);
    }

    // Average Area Fill (if enabled)
    if (showAreaFill && showAverage) {
      const areaGenerator = d3.area<any>()
        .x(d => xScale(d.parsedDate))
        .y0(innerHeight)
        .y1(d => yScale(d.avgFare))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(parsedData)
        .attr('fill', 'url(#d3-fare-gradient)')
        .attr('d', areaGenerator);
    }

    // Line Generators
    const lineAvg = d3.line<any>()
      .x(d => xScale(d.parsedDate))
      .y(d => yScale(d.avgFare))
      .curve(d3.curveMonotoneX);

    const lineMin = d3.line<any>()
      .x(d => xScale(d.parsedDate))
      .y(d => yScale(d.minFare))
      .curve(d3.curveMonotoneX);

    const lineMax = d3.line<any>()
      .x(d => xScale(d.parsedDate))
      .y(d => yScale(d.maxFare))
      .curve(d3.curveMonotoneX);

    // Max Surge Line (Rose)
    if (showMaxSurge) {
      g.append('path')
        .datum(parsedData)
        .attr('fill', 'none')
        .attr('stroke', '#f43f5e')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '4 4')
        .attr('d', lineMax)
        .attr('opacity', 0.8);
    }

    // Min Fare Line (Emerald)
    if (showMinDeal) {
      g.append('path')
        .datum(parsedData)
        .attr('fill', 'none')
        .attr('stroke', '#34d399')
        .attr('stroke-width', 1.75)
        .attr('d', lineMin);
    }

    // Average Line (Sky Blue) with glow
    if (showAverage) {
      g.append('path')
        .datum(parsedData)
        .attr('fill', 'none')
        .attr('stroke', '#38bdf8')
        .attr('stroke-width', 2.5)
        .attr('d', lineAvg);
    }

    // X-Axis
    const xAxis = d3.axisBottom(xScale)
      .ticks(Math.min(parsedData.length, width > 600 ? 8 : 4))
      .tickFormat(d => d3.timeFormat('%b %d')(d as Date));

    const xAxisGroup = g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis);

    xAxisGroup.select('.domain').attr('stroke', '#334155');
    xAxisGroup.selectAll('line').attr('stroke', '#334155');
    xAxisGroup.selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '11px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('dy', '1em');

    // Y-Axis
    const yAxis = d3.axisLeft(yScale)
      .ticks(5)
      .tickFormat(d => formatCurrency(d as number, currency, { compact: true }));

    const yAxisGroup = g.append('g')
      .call(yAxis);

    yAxisGroup.select('.domain').attr('stroke', '#334155');
    yAxisGroup.selectAll('line').remove();
    yAxisGroup.selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '11px')
      .attr('font-family', 'JetBrains Mono, monospace');

    // Min Point Highlight Star / Marker
    if (stats.minPoint && showMinDeal) {
      const minX = xScale(new Date(stats.minPoint.date));
      const minY = yScale(stats.minPoint.minFare);

      g.append('circle')
        .attr('cx', minX)
        .attr('cy', minY)
        .attr('r', 5.5)
        .attr('fill', '#34d399')
        .attr('stroke', '#0f172a')
        .attr('stroke-width', 2)
        .attr('class', 'animate-pulse');
    }

    // Max Surge Highlight Star / Marker
    if (stats.maxPoint && showMaxSurge) {
      const maxX = xScale(new Date(stats.maxPoint.date));
      const maxY = yScale(stats.maxPoint.maxFare);

      g.append('circle')
        .attr('cx', maxX)
        .attr('cy', maxY)
        .attr('r', 5.5)
        .attr('fill', '#f43f5e')
        .attr('stroke', '#0f172a')
        .attr('stroke-width', 2);
    }

    // Interactive Overlay for Crosshair and Tooltip
    const bisectDate = d3.bisector((d: any) => d.parsedDate).center;

    // Crosshair Elements
    const crosshair = g.append('line')
      .attr('stroke', '#64748b')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4 4')
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .style('opacity', 0);

    const focusPoint = g.append('circle')
      .attr('r', 6)
      .attr('fill', '#38bdf8')
      .attr('stroke', '#0f172a')
      .attr('stroke-width', 2.5)
      .style('opacity', 0);

    // Overlay Rect for Mouse Events
    g.append('rect')
      .attr('class', 'overlay')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .attr('cursor', 'crosshair')
      .on('mousemove', (event) => {
        const [xPos] = d3.pointer(event);
        const xDate = xScale.invert(xPos);
        const index = bisectDate(parsedData, xDate);
        const d = parsedData[index];

        if (d) {
          const cx = xScale(d.parsedDate);
          const cy = yScale(d.avgFare);

          crosshair
            .attr('x1', cx)
            .attr('x2', cx)
            .style('opacity', 1);

          focusPoint
            .attr('cx', cx)
            .attr('cy', cy)
            .style('opacity', 1);

          setHoveredPoint(d);
          setHoverPos({
            x: cx + margin.left,
            y: cy + margin.top
          });
        }
      })
      .on('mouseleave', () => {
        crosshair.style('opacity', 0);
        focusPoint.style('opacity', 0);
        setHoveredPoint(null);
        setHoverPos(null);
      });

  }, [filteredData, height, showAverage, showMinDeal, showMaxSurge, showAreaFill, currency, stats]);

  return (
    <div
      ref={containerRef}
      className="relative rounded-2xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 shadow-xl space-y-4"
    >
      {/* Top Controls & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-400 uppercase tracking-wider">
            <Activity className="h-4 w-4" />
            <span>D3 Interactive Time-Series Engine</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/30 font-mono">
              Vector SVG
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">
            30-Day Airfare Movement Trend · {origin} ➔ {destination}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Continuous daily trajectory rendered using D3 curves, dynamic range envelopes, and hover crosshair tracking.
          </p>
        </div>

        {/* Time Filter Pills */}
        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-medium">
            {(['7d', '14d', '30d'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-lg transition font-mono ${
                  timeRange === range
                    ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {range === '7d' ? '7 Days' : range === '14d' ? '14 Days' : '30 Days'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Ticker Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-xl border border-slate-800/80 bg-slate-950/60">
          <span className="text-slate-400 text-[11px] block">Period Average</span>
          <span className="text-base font-bold font-mono text-sky-400 mt-0.5 block">
            {formatCurrency(stats.avg, currency)}
          </span>
          <span className="text-[10px] text-slate-500">{filteredData.length} daily snapshots</span>
        </div>

        <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-950/15">
          <div className="flex items-center justify-between text-emerald-400 text-[11px]">
            <span>Lowest Deal</span>
            <TrendingDown className="h-3 w-3" />
          </div>
          <span className="text-base font-bold font-mono text-emerald-300 mt-0.5 block">
            {formatCurrency(stats.min, currency)}
          </span>
          <span className="text-[10px] text-emerald-400/80">
            {stats.minPoint?.date ? `On ${stats.minPoint.date.slice(5)}` : 'Recorded lowest'}
          </span>
        </div>

        <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-950/15">
          <div className="flex items-center justify-between text-rose-400 text-[11px]">
            <span>Peak Surge</span>
            <TrendingUp className="h-3 w-3" />
          </div>
          <span className="text-base font-bold font-mono text-rose-300 mt-0.5 block">
            {formatCurrency(stats.max, currency)}
          </span>
          <span className="text-[10px] text-rose-400/80">
            {stats.maxPoint?.date ? `On ${stats.maxPoint.date.slice(5)}` : 'Peak observed'}
          </span>
        </div>

        <div className="p-3 rounded-xl border border-slate-800/80 bg-slate-950/60">
          <span className="text-slate-400 text-[11px] block">Price Spread (Vol)</span>
          <span className="text-base font-bold font-mono text-amber-400 mt-0.5 block">
            {formatCurrency(stats.max - stats.min, currency)}
          </span>
          <span className="text-[10px] text-slate-500">Peak-to-low volatility</span>
        </div>
      </div>

      {/* Series Toggle Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/60">
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={() => setShowAverage(!showAverage)}
            className={`flex items-center gap-1.5 transition ${showAverage ? 'text-sky-300 font-semibold' : 'text-slate-500 line-through'}`}
          >
            <span className="h-2.5 w-2.5 rounded-full bg-sky-400" />
            <span>Average Fare Line</span>
          </button>

          <button
            onClick={() => setShowMinDeal(!showMinDeal)}
            className={`flex items-center gap-1.5 transition ${showMinDeal ? 'text-emerald-300 font-semibold' : 'text-slate-500 line-through'}`}
          >
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <span>Lowest Deal (Min)</span>
          </button>

          <button
            onClick={() => setShowMaxSurge(!showMaxSurge)}
            className={`flex items-center gap-1.5 transition ${showMaxSurge ? 'text-rose-300 font-semibold' : 'text-slate-500 line-through'}`}
          >
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
            <span>Surge Ceiling (Max)</span>
          </button>

          <button
            onClick={() => setShowAreaFill(!showAreaFill)}
            className={`flex items-center gap-1.5 transition ${showAreaFill ? 'text-sky-400' : 'text-slate-500'}`}
          >
            {showAreaFill ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            <span>Gradient Glow</span>
          </button>
        </div>

        <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
          Hover across chart for price crosshair
        </span>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative w-full overflow-hidden">
        <svg ref={svgRef} className="w-full select-none" />

        {/* Floating Custom Tooltip */}
        {hoveredPoint && hoverPos && (
          <div
            className="pointer-events-none absolute z-30 transform -translate-x-1/2 -translate-y-full mb-3 rounded-xl border border-slate-700 bg-slate-950/95 p-3.5 shadow-2xl backdrop-blur-md text-xs space-y-1.5 w-48 animate-in fade-in zoom-in-95"
            style={{
              left: `${Math.min(Math.max(hoverPos.x, 100), (containerRef.current?.clientWidth || 320) - 100)}px`,
              top: `${Math.max(hoverPos.y - 12, 10)}px`
            }}
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <span className="font-bold text-white font-mono">{hoveredPoint.date}</span>
              <span className="text-[10px] text-slate-400">{hoveredPoint.observationsCount} flts</span>
            </div>

            <div className="space-y-1 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Average:</span>
                <span className="text-sky-400 font-bold">{formatCurrency(hoveredPoint.avgFare, currency)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-emerald-400">Lowest:</span>
                <span className="text-emerald-300 font-semibold">{formatCurrency(hoveredPoint.minFare, currency)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-rose-400">Surge:</span>
                <span className="text-rose-300 font-semibold">{formatCurrency(hoveredPoint.maxFare, currency)}</span>
              </div>
            </div>

            <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/80">
              {hoveredPoint.avgFare < stats.avg ? (
                <span className="text-emerald-400">
                  ↓ {formatCurrency(stats.avg - hoveredPoint.avgFare, currency)} below period mean
                </span>
              ) : (
                <span className="text-amber-400">
                  ↑ {formatCurrency(hoveredPoint.avgFare - stats.avg, currency)} above period mean
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Chart Footer Insight */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
        <span className="flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-sky-400" />
          <span>Interactive D3 visualization synchronized with live Indian & global domestic route observations</span>
        </span>
        <span className="font-mono text-slate-500">
          Source: FPPS Historical Corridor Registry
        </span>
      </div>
    </div>
  );
};
