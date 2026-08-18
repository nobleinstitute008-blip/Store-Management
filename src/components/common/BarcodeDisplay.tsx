import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeDisplayProps {
  value: string;
  format?: 'CODE128' | 'EAN13' | 'UPC';
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  className?: string;
}

export const BarcodeDisplay: React.FC<BarcodeDisplayProps> = ({
  value,
  format = 'CODE128',
  width = 1.5,
  height = 40,
  displayValue = true,
  fontSize = 12,
  className = ''
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format,
          width,
          height,
          displayValue,
          fontSize,
          background: '#ffffff',
          lineColor: '#000000',
          margin: 4
        });
      } catch (err) {
        console.warn('Barcode render error:', err);
      }
    }
  }, [value, format, width, height, displayValue, fontSize]);

  return (
    <div className={`inline-flex flex-col items-center p-2 bg-white rounded-lg border border-slate-700 shadow-sm ${className}`}>
      <svg ref={svgRef} className="max-w-full" />
    </div>
  );
};
